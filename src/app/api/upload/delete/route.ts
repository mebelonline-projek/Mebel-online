import { NextResponse } from "next/server";
import { deleteFromSupabase } from "@/lib/upload";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL gambar wajib diisi." },
        { status: 400 }
      );
    }

    const deleted = await deleteFromSupabase(url);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Gagal menghapus file dari penyimpanan." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete upload API error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}