import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import { publicApiRateLimiter } from "@/lib/rate-limit";

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
export async function GET(request: Request) {
  // Rate limit untuk endpoint publik
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
  const { allowed } = await publicApiRateLimiter(ip, "public-categories");
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
      { status: 429 }
    );
  }
  try {
    const { data: categories, error } = await getSupabase()
      .from("Category")
      .select("*, products:Product(count)")
      .order("sortOrder", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Get categories error:", error);
      return NextResponse.json(
        { success: false, error: "Gagal mengambil data kategori." },
        { status: 500 }
      );
    }

    // Map to match expected _count format
    const mapped = (categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      _count: { products: c.products?.[0]?.count ?? 0 },
    }));

    return NextResponse.json({ success: true, data: mapped });
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

    // Check duplicate slug
    const { data: existing } = await supabase
      .from("Category")
      .select("id")
      .eq("slug", slug)
      .single();

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
        .single();
      nextSortOrder = (maxData?.sortOrder ?? 0) + 1;
    }

    const { data: category, error: createError } = await supabase
      .from("Category")
      .insert({
        id: generateUUID(),
        name: parsed.name,
        slug,
        description: parsed.description ?? null,
        image: parsed.image ?? null,
        sortOrder: nextSortOrder,
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
          description: description ?? existing.description,
          image: image ?? existing.image,
          sortOrder: newSort,
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
        description: description ?? existing.description,
        image: image ?? existing.image,
        sortOrder: sortOrder ?? existing.sortOrder,
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