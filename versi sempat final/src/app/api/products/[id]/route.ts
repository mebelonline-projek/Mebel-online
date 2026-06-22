import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { deleteFromSupabase } from "@/lib/upload";

// GET /api/products/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    const images = product.images ? JSON.parse(product.images) : [];
    return NextResponse.json({
      success: true,
      data: {
        ...product,
        images: Array.isArray(images) ? images.filter((i: unknown) => typeof i === "string") : [],
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

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    // === Renumber logic: saat sortOrder berubah, produk lain otomatis menyesuaikan ===
    if (sortOrder !== undefined && sortOrder !== existing.sortOrder) {
      const oldSort = existing.sortOrder;
      const newSort = sortOrder;

      await prisma.$transaction(async (tx) => {
        if (newSort < oldSort) {
          // Produk naik ke posisi lebih awal → produk di antaranya digeser mundur
          await tx.product.updateMany({
            where: {
              sortOrder: { gte: newSort, lt: oldSort },
              id: { not: id },
            },
            data: { sortOrder: { increment: 1 } },
          });
        } else {
          // Produk turun ke posisi lebih akhir → produk di antaranya digeser maju
          await tx.product.updateMany({
            where: {
              sortOrder: { gt: oldSort, lte: newSort },
              id: { not: id },
            },
            data: { sortOrder: { decrement: 1 } },
          });
        }

        await tx.product.update({
          where: { id },
          data: {
            name,
            description,
            image: image ?? existing.image,
            images: images ? JSON.stringify(images) : existing.images,
            variants: variants ? JSON.stringify(variants) : existing.variants,
            categoryId,
            isActive: isActive ?? existing.isActive,
            sortOrder: newSort,
          },
        });
      });

      // Ambil ulang data setelah renumber
      const updated = await prisma.product.findUnique({
        where: { id },
        include: { category: { select: { name: true, slug: true } } },
      });

      // Hapus foto lama dari Supabase kalau image berubah
      if (image !== undefined && image !== existing.image && existing.image) {
        await deleteFromSupabase(existing.image);
      }

      // Hapus foto tambahan yang dihapus dari array images
      if (images !== undefined && existing.images) {
        const oldImages = JSON.parse(existing.images) as string[];
        const newImages = images as string[];
        const removed = oldImages.filter((img) => !newImages.includes(img));
        if (removed.length > 0) {
          await Promise.all(removed.map((img) => deleteFromSupabase(img)));
        }
      }

      const updImages = updated?.images ? JSON.parse(updated.images) : [];
      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          images: updImages,
          variants: updated?.variants ? JSON.parse(updated.variants) : [],
        },
      });
    }

    // Tanpa perubahan sortOrder — update biasa
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        image: image ?? existing.image,
        images: images ? JSON.stringify(images) : existing.images,
        variants: variants ? JSON.stringify(variants) : existing.variants,
        categoryId,
        isActive: isActive ?? existing.isActive,
        sortOrder: sortOrder ?? existing.sortOrder,
      },
      include: {
        category: { select: { name: true, slug: true } },
      },
    });

    // Hapus foto lama dari Supabase kalau image berubah
    if (image !== undefined && image !== existing.image && existing.image) {
      await deleteFromSupabase(existing.image);
    }

    // Hapus foto tambahan yang dihapus dari array images
    if (images !== undefined && existing.images) {
      const oldImages = JSON.parse(existing.images) as string[];
      const newImages = images as string[];
      const removed = oldImages.filter((img) => !newImages.includes(img));
      if (removed.length > 0) {
        await Promise.all(removed.map((img) => deleteFromSupabase(img)));
      }
    }

    const prodImages = product.images ? JSON.parse(product.images) : [];
    return NextResponse.json({
      success: true,
      data: {
        ...product,
        images: prodImages,
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
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    // Hapus foto dari Supabase sebelum hapus record
    if (existing.image) {
      await deleteFromSupabase(existing.image);
    }
    if (existing.images) {
      const imageList = JSON.parse(existing.images) as string[];
      await Promise.all(imageList.map((img) => deleteFromSupabase(img)));
    }

    await prisma.product.delete({ where: { id } });

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
