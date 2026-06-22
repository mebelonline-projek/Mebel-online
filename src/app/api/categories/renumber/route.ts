import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

// POST /api/categories/renumber — Beri nomor urut 1,2,3... ke semua kategori
export async function POST() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    // Ambil semua kategori urut sesuai tampilan (sortOrder ASC, name ASC)
    const { data: categories, error: findError } = await supabase
      .from("Category")
      .select("id")
      .order("sortOrder", { ascending: true })
      .order("name", { ascending: true });

    if (findError || !categories) {
      console.error("Renumber categories error:", findError);
      return NextResponse.json(
        { success: false, error: "Gagal mengambil data kategori." },
        { status: 500 }
      );
    }

    // Update berurutan
    for (let i = 0; i < categories.length; i++) {
      const { error: updateError } = await supabase
        .from("Category")
        .update({ sortOrder: i + 1 })
        .eq("id", categories[i].id);

      if (updateError) {
        console.error("Renumber update error:", updateError);
        return NextResponse.json(
          { success: false, error: "Gagal mengurutkan ulang kategori." },
          { status: 500 }
        );
      }
    }

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