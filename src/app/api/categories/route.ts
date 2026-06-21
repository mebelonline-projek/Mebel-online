import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: categories });
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

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Kategori dengan nama serupa sudah ada." },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: parsed.name,
        slug,
        description: parsed.description ?? null,
        image: parsed.image ?? null,
        sortOrder:
          parsed.sortOrder && parsed.sortOrder > 0
            ? parsed.sortOrder
            : ((await prisma.category.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0) + 1,
      },
    });

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

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    // === Renumber logic: saat sortOrder berubah, kategori lain otomatis menyesuaikan ===
    if (sortOrder !== undefined && sortOrder !== existing.sortOrder) {
      const oldSort = existing.sortOrder;
      const newSort = sortOrder;

      await prisma.$transaction(async (tx) => {
        if (newSort < oldSort) {
          // Kategori naik ke posisi lebih awal → geser yang di antaranya ke belakang
          await tx.category.updateMany({
            where: {
              sortOrder: { gte: newSort, lt: oldSort },
              id: { not: id },
            },
            data: { sortOrder: { increment: 1 } },
          });
        } else {
          // Kategori turun ke posisi lebih akhir → geser yang di antaranya ke depan
          await tx.category.updateMany({
            where: {
              sortOrder: { gt: oldSort, lte: newSort },
              id: { not: id },
            },
            data: { sortOrder: { decrement: 1 } },
          });
        }

        await tx.category.update({
          where: { id },
          data: {
            name,
            description: description ?? existing.description,
            image: image ?? existing.image,
            sortOrder: newSort,
          },
        });
      });

      const updated = await prisma.category.findUnique({ where: { id } });
      return NextResponse.json({ success: true, data: updated });
    }

    // Tanpa perubahan sortOrder — update biasa
    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description: description ?? existing.description,
        image: image ?? existing.image,
        sortOrder: sortOrder ?? existing.sortOrder,
      },
    });

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

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cek apakah kategori memiliki produk
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Kategori "${existing.name}" memiliki ${productCount} produk. Hapus atau pindahkan produk terlebih dahulu.`,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });

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
