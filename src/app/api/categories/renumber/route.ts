import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

// POST /api/categories/renumber — Beri nomor urut 1,2,3... ke semua kategori
export async function POST() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    // Ambil semua kategori urut sesuai tampilan (sortOrder ASC, name ASC)
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true },
    });

    // Update berurutan dalam transaction
    await prisma.$transaction(
      categories.map((cat, index) =>
        prisma.category.update({
          where: { id: cat.id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${categories.length} kategori berhasil diurutkan ulang.`,
    });
  } catch (error) {
    console.error("Renumber categories error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengurutkan ulang kategori." },
      { status: 500 }
    );
  }
}
