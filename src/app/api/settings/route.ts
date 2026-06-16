import { NextResponse } from "next/server";
import { getAllSettings, updateSettings } from "@/lib/site-config";
import { requireAdmin } from "@/lib/api-auth";
import type { SiteSettings } from "@/types";

// GET /api/settings — Ambil semua pengaturan landing page (admin only)
export async function GET() {
  try {
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const settings = await getAllSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil pengaturan." },
      { status: 500 }
    );
  }
}

// PUT /api/settings — Update pengaturan
export async function PUT(request: Request) {
  try {
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const body: Partial<SiteSettings> = await request.json();

    // Validasi tipe social_media jika ada
    if (body.social_media !== undefined) {
      if (!Array.isArray(body.social_media)) {
        return NextResponse.json(
          { success: false, error: "Format social_media tidak valid." },
          { status: 400 }
        );
      }
    }

    await updateSettings(body);

    // Ambil data terbaru
    const settings = await getAllSettings();

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Pengaturan berhasil disimpan.",
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan pengaturan." },
      { status: 500 }
    );
  }
}
