import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

// GET /api/products — Daftar produk (public & admin)
export async function GET(request: Request) {
  try {
    const supabase = getSupabase();
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

    let query = supabase
      .from("Product")
      .select("*, category:Category(name, slug)", { count: "exact" });

    if (!all) {
      query = query.eq("isActive", true);
    }

    if (categorySlug && categorySlug !== "semua") {
      // Dapatkan category id dari slug
      const { data: cat } = await supabase
        .from("Category")
        .select("id")
        .eq("slug", categorySlug)
        .single();
      if (cat) {
        query = query.eq("categoryId", cat.id);
      }
    }

    const skip = (page - 1) * limit;

    const { data: products, error, count } = await query
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error("Get products error:", error);
      return NextResponse.json(
        { success: false, error: "Gagal mengambil data produk." },
        { status: 500 }
      );
    }

    // Parse images & variants JSON strings to arrays
    const parsedProducts = (products ?? []).map((p) => ({
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
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
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
    const supabase = getSupabase();
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

    // Auto-fill sortOrder
    let nextSortOrder = sortOrder && sortOrder > 0 ? sortOrder : 1;
    if (!sortOrder || sortOrder <= 0) {
      const { data: maxData } = await supabase
        .from("Product")
        .select("sortOrder")
        .order("sortOrder", { ascending: false })
        .limit(1)
        .single();
      nextSortOrder = (maxData?.sortOrder ?? 0) + 1;
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `produk-${Date.now()}`;

    const { data: product, error: createError } = await supabase
      .from("Product")
      .insert({
        name,
        slug: `${slug}-${Date.now()}`,
        description: description ?? null,
        image: image ?? null,
        images: images ? JSON.stringify(images) : "[]",
        variants: variants ? JSON.stringify(variants) : "[]",
        categoryId,
        sortOrder: nextSortOrder,
      })
      .select("*, category:Category(name, slug)")
      .single();

    if (createError || !product) {
      console.error("Create product error:", createError);
      return NextResponse.json(
        { success: false, error: "Gagal menambah produk." },
        { status: 500 }
      );
    }

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