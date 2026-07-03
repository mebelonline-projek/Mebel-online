import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();

  const [productsResult, categoriesResult] = await Promise.all([
    supabase.from("Product").select("id, isActive"),
    supabase.from("Category").select("id", { count: "exact", head: true }),
  ]);

  const products = productsResult.data ?? [];
  const totalProducts = products.length;
  const totalCategories = categoriesResult.count ?? 0;
  const activeProducts = products.filter((p) => p.isActive).length;
  const inactiveProducts = totalProducts - activeProducts;

  return NextResponse.json({
    success: true,
    data: {
      totalProducts,
      totalCategories,
      activeProducts,
      inactiveProducts,
    },
  });
}