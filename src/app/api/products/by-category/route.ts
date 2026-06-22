import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
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

    const { data: products, error: findError } = await getSupabase()
      .from("Product")
      .select("id, name, sortOrder")
      .eq("categoryId", categoryId)
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false });

    if (findError) {
      console.error("Get products by category error:", findError);
      return NextResponse.json(
        { success: false, error: "Gagal mengambil data produk." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: products ?? [] });
  } catch (error) {
    console.error("Get products by category error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data produk." },
      { status: 500 }
    );
  }
}