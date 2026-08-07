import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
});

// GET /api/categories
// CONTRACT (Workers Free): keep Product(count) + _count.products transform.
// Do NOT remove this JOIN "for CPU" without measuring — admin UI depends on it.
// Optional chaining (_count?.products ?? 0) remains mandatory in all UIs.
export async function GET() {
  try {
    const { data: categories, error } = await getSupabase()
      .from("Category")
      .select("*, Product(count)")
      .order("sortOrder", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Get categories error:", error);
      return NextResponse.json(
        { success: false, error: "Gagal mengambil data kategori." },
        { status: 500 }
      );
    }

    // Transform response: Supabase mengembalikan Product[{count}] 
    // Frontend mengharapkan _count.products
    const transformed = (categories ?? []).map((cat: Record<string, unknown>) => ({
      ...cat,
      _count: {
        products: (cat.Product as Array<{ count: number }> | undefined)?.[0]?.count ?? 0,
      },
      Product: undefined,
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data kategori." },
      { status: 500 }
    );
  }
}

// POST /api/categories
export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = categorySchema.parse(body);

    // Generate slug
    const slug = parsed.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `kategori-${Date.now()}`;

    // Check duplicate slug (.maybeSingle: 0 rows → data null, bukan error)
    const { data: existing } = await supabase
      .from("Category")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Kategori dengan nama serupa sudah ada." },
        { status: 409 }
      );
    }

    // Auto-fill sortOrder
    let nextSortOrder = parsed.sortOrder && parsed.sortOrder > 0 ? parsed.sortOrder : 1;
    if (!parsed.sortOrder || parsed.sortOrder <= 0) {
      const { data: maxData } = await supabase
        .from("Category")
        .select("sortOrder")
        .order("sortOrder", { ascending: false })
        .limit(1)
        .maybeSingle();
      nextSortOrder = (maxData?.sortOrder ?? 0) + 1;
    }

    // createdAt/updatedAt wajib diisi eksplisit: kolom Prisma @updatedAt
    // tidak punya DEFAULT di Postgres setelah migrasi ke Supabase JS
    // (bug yang sama sudah diperbaiki di POST /api/products).
    const now = new Date().toISOString();
    const { data: category, error: createError } = await supabase
      .from("Category")
      .insert({
        id: generateUUID(),
        name: parsed.name,
        slug,
        description: parsed.description ?? null,
        image: parsed.image ?? null,
        sortOrder: nextSortOrder,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (createError || !category) {
      console.error("Create category error:", createError);
      return NextResponse.json(
        { success: false, error: "Gagal menambah kategori." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }
    console.error("Create category error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambah kategori." },
      { status: 500 }
    );
  }
}

// PUT /api/categories
export async function PUT(request: Request) {
  try {
    const supabase = getSupabase();
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { id, name, description, image, sortOrder } = body;

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: "ID dan nama kategori wajib diisi." },
        { status: 400 }
      );
    }

    // Check existing
    const { data: existing, error: findError } = await supabase
      .from("Category")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    // Regenerate slug dari nama (rename harus ikut update URL/filter)
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `kategori-${Date.now()}`;

    const { data: slugConflict } = await supabase
      .from("Category")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (slugConflict) {
      return NextResponse.json(
        { success: false, error: "Kategori dengan nama serupa sudah ada." },
        { status: 409 }
      );
    }

    // description/image: undefined = pertahankan; null = boleh dikosongkan
    const nextDescription =
      description !== undefined ? description : existing.description;
    const nextImage = image !== undefined ? image : existing.image;
    const now = new Date().toISOString();

    // Renumber logic: saat sortOrder berubah, kategori lain menyesuaikan
    if (sortOrder !== undefined && sortOrder !== existing.sortOrder) {
      const oldSort = existing.sortOrder;
      const newSort = sortOrder;

      // Renumber: ambil semua kategori yang terdampak, lalu update satu per satu
      if (newSort < oldSort) {
        // Kategori naik ke posisi lebih awal → geser yang di antaranya ke belakang
        const { data: toShift } = await supabase
          .from("Category")
          .select("id, sortOrder")
          .gte("sortOrder", newSort)
          .lt("sortOrder", oldSort)
          .neq("id", id)
          .order("sortOrder", { ascending: false });

        if (toShift) {
          for (const item of toShift) {
            await supabase
              .from("Category")
              .update({ sortOrder: item.sortOrder + 1 })
              .eq("id", item.id);
          }
        }
      } else {
        // Kategori turun ke posisi lebih akhir → geser yang di antaranya ke depan
        const { data: toShift } = await supabase
          .from("Category")
          .select("id, sortOrder")
          .gt("sortOrder", oldSort)
          .lte("sortOrder", newSort)
          .neq("id", id)
          .order("sortOrder", { ascending: true });

        if (toShift) {
          for (const item of toShift) {
            await supabase
              .from("Category")
              .update({ sortOrder: item.sortOrder - 1 })
              .eq("id", item.id);
          }
        }
      }

      // Update kategori
      const { data: updated, error: updateError } = await supabase
        .from("Category")
        .update({
          name,
          slug,
          description: nextDescription,
          image: nextImage,
          sortOrder: newSort,
          updatedAt: now,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError || !updated) {
        console.error("Update category error:", updateError);
        return NextResponse.json(
          { success: false, error: "Gagal mengupdate kategori." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    // Tanpa perubahan sortOrder — update biasa
    const { data: category, error: updateError } = await supabase
      .from("Category")
      .update({
        name,
        slug,
        description: nextDescription,
        image: nextImage,
        sortOrder: sortOrder ?? existing.sortOrder,
        updatedAt: now,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !category) {
      console.error("Update category error:", updateError);
      return NextResponse.json(
        { success: false, error: "Gagal mengupdate kategori." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate kategori." },
      { status: 500 }
    );
  }
}

// DELETE /api/categories
export async function DELETE(request: Request) {
  try {
    const supabase = getSupabase();
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const moveToCategoryId = searchParams.get("moveToCategoryId");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID kategori wajib diisi." },
        { status: 400 }
      );
    }

    // Check existing
    const { data: existing, error: findError } = await supabase
      .from("Category")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cek apakah kategori memiliki produk
    const { count: productCount, error: countError } = await supabase
      .from("Product")
      .select("id", { count: "exact", head: true })
      .eq("categoryId", id);

    if (!countError && productCount && productCount > 0) {
      // Jika ada parameter moveToCategoryId, pindahkan produk dulu
      if (moveToCategoryId) {
        // Validasi kategori tujuan ada
        const { data: targetCategory } = await supabase
          .from("Category")
          .select("id")
          .eq("id", moveToCategoryId)
          .single();

        if (!targetCategory) {
          return NextResponse.json(
            { success: false, error: "Kategori tujuan tidak ditemukan." },
            { status: 400 }
          );
        }

        // Pindahkan semua produk ke kategori tujuan
        const { error: moveError } = await supabase
          .from("Product")
          .update({ categoryId: moveToCategoryId })
          .eq("categoryId", id);

        if (moveError) {
          console.error("Move products error:", moveError);
          return NextResponse.json(
            { success: false, error: "Gagal memindahkan produk." },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Kategori "${existing.name}" memiliki ${productCount} produk. Hapus atau pindahkan produk terlebih dahulu.`,
          },
          { status: 409 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from("Category")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete category error:", deleteError);
      return NextResponse.json(
        { success: false, error: "Gagal menghapus kategori." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil dihapus.",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus kategori." },
      { status: 500 }
    );
  }
}