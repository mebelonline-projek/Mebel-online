import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";
import { deleteFromSupabase } from "@/lib/upload";

// GET /api/products/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: product, error } = await getSupabase()
      .from("Product")
      .select("*, category:Category(id, name, slug)")
      .eq("id", id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    // Proteksi: produk nonaktif tidak bisa diakses publik
    if (!product.isActive) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan atau tidak tersedia." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        variants: product.variants ? JSON.parse(product.variants) : [],
      },
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data produk." },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] — Edit produk
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { name, description, image, images, variants, categoryId, isActive, sortOrder } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Nama produk dan kategori wajib diisi." },
        { status: 400 }
      );
    }

    // Check existing
    const { data: existing, error: findError } = await supabase
      .from("Product")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    // Renumber logic: saat sortOrder berubah, produk lain menyesuaikan
    if (sortOrder !== undefined && sortOrder !== existing.sortOrder) {
      const oldSort = existing.sortOrder;
      const newSort = sortOrder;

      if (newSort < oldSort) {
        // Produk naik ke posisi lebih awal → produk di antaranya digeser mundur
        // Produk naik ke posisi lebih awal → geser yang di antaranya ke belakang
        const { data: toShiftUp } = await supabase
          .from("Product")
          .select("id, sortOrder")
          .gte("sortOrder", newSort)
          .lt("sortOrder", oldSort)
          .neq("id", id)
          .order("sortOrder", { ascending: false });

        if (toShiftUp) {
          for (const item of toShiftUp) {
            await supabase
              .from("Product")
              .update({ sortOrder: item.sortOrder + 1 })
              .eq("id", item.id);
          }
        }
      } else {
        // Produk turun ke posisi lebih akhir → geser yang di antaranya ke depan
        const { data: toShiftDown } = await supabase
          .from("Product")
          .select("id, sortOrder")
          .gt("sortOrder", oldSort)
          .lte("sortOrder", newSort)
          .neq("id", id)
          .order("sortOrder", { ascending: true });

        if (toShiftDown) {
          for (const item of toShiftDown) {
            await supabase
              .from("Product")
              .update({ sortOrder: item.sortOrder - 1 })
              .eq("id", item.id);
          }
        }
      }

      // Update produk
      const { error: updateError } = await supabase
        .from("Product")
        .update({
          name,
          description: description ?? existing.description,
          image: image ?? existing.image,
          images: images ? JSON.stringify(images) : existing.images,
          variants: variants ? JSON.stringify(variants) : existing.variants,
          categoryId,
          isActive: isActive ?? existing.isActive,
          sortOrder: newSort,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        console.error("Update product error:", updateError);
        return NextResponse.json(
          { success: false, error: "Gagal mengupdate produk." },
          { status: 500 }
        );
      }

      // Ambil ulang data setelah renumber
      const { data: updated } = await supabase
        .from("Product")
        .select("*, category:Category(name, slug)")
        .eq("id", id)
        .single();

      // Hapus foto lama dari Supabase kalau image berubah
      if (image !== undefined && image !== existing.image && existing.image) {
        await deleteFromSupabase(existing.image);
      }

      // Hapus foto galeri yang dihapus dari array images
      if (images !== undefined) {
        const oldImages = existing.images ? (JSON.parse(existing.images) as string[]) : [];
        const newImages = images as string[];
        const removed = oldImages.filter((url) => !newImages.includes(url));
        await Promise.all(removed.map((url) => deleteFromSupabase(url)));
      }

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          images: updated?.images ? JSON.parse(updated.images) : [],
          variants: updated?.variants ? JSON.parse(updated.variants) : [],
        },
      });
    }

    // Tanpa perubahan sortOrder — update biasa
    const { data: product, error: updateError } = await supabase
      .from("Product")
      .update({
        name,
        description: description ?? existing.description,
        image: image ?? existing.image,
        images: images ? JSON.stringify(images) : existing.images,
        variants: variants ? JSON.stringify(variants) : existing.variants,
        categoryId,
        isActive: isActive ?? existing.isActive,
        sortOrder: sortOrder ?? existing.sortOrder,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, category:Category(name, slug)")
      .single();

    if (updateError || !product) {
      console.error("Update product error:", updateError);
      return NextResponse.json(
        { success: false, error: "Gagal mengupdate produk." },
        { status: 500 }
      );
    }

    // Hapus foto lama dari Supabase kalau image berubah
    if (image !== undefined && image !== existing.image && existing.image) {
      await deleteFromSupabase(existing.image);
    }

    // Hapus foto galeri yang dihapus dari array images
    if (images !== undefined) {
      const oldImages = existing.images ? (JSON.parse(existing.images) as string[]) : [];
      const newImages = images as string[];
      const removed = oldImages.filter((url) => !newImages.includes(url));
      await Promise.all(removed.map((url) => deleteFromSupabase(url)));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        variants: product.variants ? JSON.parse(product.variants) : [],
      },
    });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate produk." },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const { data: existing, error: findError } = await supabase
      .from("Product")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    // Hapus foto dari Supabase sebelum hapus record
    if (existing.image) {
      await deleteFromSupabase(existing.image);
    }
    // Hapus foto galeri — handle null / string kosong / parse error
    if (existing.images) {
      let imageList: string[] = [];
      try {
        const parsed = JSON.parse(existing.images);
        imageList = Array.isArray(parsed) ? parsed : [];
      } catch {
        imageList = [];
      }
      if (imageList.length > 0) {
        await Promise.all(imageList.map((img) => deleteFromSupabase(img)));
      }
    }

    const { error: deleteError } = await supabase
      .from("Product")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete product error:", deleteError);
      return NextResponse.json(
        { success: false, error: "Gagal menghapus produk." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus.",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus produk." },
      { status: 500 }
    );
  }
}