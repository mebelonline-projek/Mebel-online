import { NextResponse } from "next/server";
import { getAllSettings, updateSettings } from "@/lib/site-config";
import { requireAdmin } from "@/lib/api-auth";
import { deleteFromSupabase } from "@/lib/upload";
import type { SiteSettings } from "@/types";

const IMAGE_FIELDS = ["site_logo", "hero_image", "about_image"];

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
    const { error: authError, session } = await requireAdmin();
    if (authError) {
      console.error("Auth failed in PUT /api/settings");
      return authError;
    }

    console.log("Settings PUT: authenticated as", session?.user?.email);

    const body: Partial<SiteSettings> = await request.json();
    console.log("Settings PUT: received body keys:", Object.keys(body));

    // Validasi tipe social_media jika ada
    if (body.social_media !== undefined) {
      if (!Array.isArray(body.social_media)) {
        return NextResponse.json(
          { success: false, error: "Format social_media tidak valid." },
          { status: 400 }
        );
      }
    }

    // Validasi tipe operating_hours jika ada
    if (body.operating_hours !== undefined) {
      if (!Array.isArray(body.operating_hours)) {
        return NextResponse.json(
          { success: false, error: "Format operating_hours tidak valid." },
          { status: 400 }
        );
      }
    }

    // Ambil data lama dulu untuk cek perubahan gambar
    const oldSettings = await getAllSettings();

    // Simpan dulu — jika gagal, throw biar masuk catch
    await updateSettings(body);

    // Ambil data terbaru setelah simpan
    const settings = await getAllSettings();

    // Hapus foto lama dari Supabase kalau ada gambar yang berubah
    // Tunggu semua delete selesai sebelum kirim response (blocking)
    const deletePromises: Promise<boolean>[] = [];
    for (const field of IMAGE_FIELDS) {
      const oldVal = oldSettings[field as keyof SiteSettings] as string;
      const newVal = body[field as keyof SiteSettings];
      if (newVal !== undefined && newVal !== oldVal && oldVal) {
        deletePromises.push(
          deleteFromSupabase(oldVal).catch((err) => {
            console.error(`Failed to delete old ${field} image:`, err);
            return false;
          })
        );
      }
    }
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Pengaturan berhasil disimpan.",
    });
  } catch (error) {
    console.error("Update settings error:", error);
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : "Gagal menyimpan pengaturan.";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}