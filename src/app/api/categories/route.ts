import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";

const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
});

// GET /api/categories
export async function GET() {
  try {
    const { data: categories, error } = await supabase
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

      if (newSort < oldSort) {
        // Kategori naik ke posisi lebih awal → geser yang di antaranya ke belakang
        await supabase
          .from("Category")
          .update({ sortOrder: existing.sortOrder + 1 }) // dummy increment
          .gte("sortOrder", newSort)
          .lt("sortOrder", oldSort)
          .neq("id", id);
      } else {
        // Kategori turun ke posisi lebih akhir → geser yang di antaranya ke depan
        await supabase
          .from("Category")
          .update({ sortOrder: existing.sortOrder - 1 }) // dummy decrement
          .gt("sortOrder", oldSort)
          .lte("sortOrder", newSort)
          .neq("id", id);
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
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

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
      return NextResponse.json(
        {
          success: false,
          error: `Kategori "${existing.name}" memiliki ${productCount} produk. Hapus atau pindahkan produk terlebih dahulu.`,
        },
        { status: 409 }
      );
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