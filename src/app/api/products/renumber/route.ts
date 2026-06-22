import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

// POST /api/products/renumber — Beri nomor urut 1,2,3... ke semua produk
export async function POST() {
  try {
    const supabase = getSupabase();
    const { error } = await requireAdmin();
    if (error) return error;

    // Ambil semua produk urut sesuai tampilan (sortOrder ASC, createdAt DESC)
    const { data: products, error: findError } = await supabase
      .from("Product")
      .select("id")
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false });

    if (findError || !products) {
      console.error("Renumber error:", findError);
      return NextResponse.json(
        { success: false, error: "Gagal mengambil data produk." },
        { status: 500 }
      );
    }

    // Update berurutan
    for (let i = 0; i < products.length; i++) {
      const { error: updateError } = await supabase
        .from("Product")
        .update({ sortOrder: i + 1 })
        .eq("id", products[i].id);

      if (updateError) {
        console.error("Renumber update error:", updateError);
        return NextResponse.json(
          { success: false, error: "Gagal mengurutkan ulang produk." },
          { status: 500 }
        );
      }
    }

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