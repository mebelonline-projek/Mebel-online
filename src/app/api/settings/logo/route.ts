import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/settings/logo — Ambil logo toko (publik, untuk halaman login)
// Endpoint ini TIDAK pakai requireAdmin agar bisa diakses tanpa login
// Hanya ambil 1 field (site_logo) untuk efisiensi CPU
export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("SiteConfig")
      .select("value")
      .eq("key", "site_logo")
      .single();

    if (error || !data) {
      return NextResponse.json({ success: true, logoUrl: "" });
    }

    return NextResponse.json({ success: true, logoUrl: data.value || "" });
  } catch {
    return NextResponse.json({ success: true, logoUrl: "" });
  }
}