import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

// GET /api/products/by-category?categoryId=xxx — Ringan: hanya id, name, sortOrder
export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Parameter categoryId wajib diisi." },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where: { categoryId },
      select: { id: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Get products by category error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data produk." },
      { status: 500 }
    );
  }
}
