import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

// GET /api/products — Daftar produk (public & admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const all = searchParams.get("all") === "true"; // admin: include inactive

    // Proteksi: hanya admin bisa lihat produk non-aktif
    if (all) {
      const { error } = await requireAdmin();
      if (error) return error;
    }

    const where: Record<string, unknown> = {};

    if (!all) {
      where.isActive = true;
    }

    if (categorySlug && categorySlug !== "semua") {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { name: true, slug: true },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Parse images & variants JSON strings to arrays
    const parsedProducts = products.map((p) => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      variants: p.variants ? JSON.parse(p.variants) : [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        products: parsedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data produk." },
      { status: 500 }
    );
  }
}

// POST /api/products — Tambah produk (admin)
export async function POST(request: Request) {
  try {
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { name, description, image, images, variants, categoryId, sortOrder } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Nama produk dan kategori wajib diisi." },
        { status: 400 }
      );
    }

    // Auto-fill sortOrder: produk baru ditaruh di urutan paling akhir
    const maxSortOrder = await prisma.product.aggregate({
      _max: { sortOrder: true },
    });
    const nextSortOrder = sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1;

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `produk-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        name,
        slug: `${slug}-${Date.now()}`, // ensure unique
        description,
        image: image ?? null,
        images: images ? JSON.stringify(images) : "[]",
        variants: variants ? JSON.stringify(variants) : "[]",
        categoryId,
        sortOrder: nextSortOrder,
      },
      include: {
        category: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambah produk." },
      { status: 500 }
    );
  }
}
