import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();

  // Gunakan RPC untuk mendapatkan semua stats dalam 1 query
  // Ini menghindari multiple queries yang memakan CPU Worker
  const { data, error } = await supabase.rpc("get_dashboard_stats");

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      success: false,
      error: "Gagal mengambil statistik dashboard",
    });
  }

  const stats = data[0];
  return NextResponse.json({
    success: true,
    data: {
      totalProducts: Number(stats.totalProducts),
      totalCategories: Number(stats.totalCategories),
      activeProducts: Number(stats.activeProducts),
      inactiveProducts: Number(stats.inactiveProducts),
    },
  });
}
