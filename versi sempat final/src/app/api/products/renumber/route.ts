import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

// POST /api/products/renumber — Beri nomor urut 1,2,3... ke semua produk
export async function POST() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    // Ambil semua produk urut sesuai tampilan (sortOrder ASC, createdAt DESC)
    const products = await prisma.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true },
    });

    // Update berurutan dalam transaction
    await prisma.$transaction(
      products.map((product, index) =>
        prisma.product.update({
          where: { id: product.id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${products.length} produk berhasil diurutkan ulang.`,
    });
  } catch (error) {
    console.error("Renumber error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengurutkan ulang produk." },
      { status: 500 }
    );
  }
}
