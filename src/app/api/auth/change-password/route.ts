export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Cek autentikasi
    const { error, session } = await requireAdmin();
    if (error || !session) return error;

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Password saat ini dan password baru wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password baru minimal 8 karakter." },
        { status: 400 }
      );
    }

    if (!session.user?.email) {
      return NextResponse.json(
        { success: false, error: "Session tidak valid." },
        { status: 401 }
      );
    }

    // Ambil data admin dari database
    const { data: admin, error: findError } = await supabase
      .from("Admin")
      .select("*")
      .eq("email", session.user.email)
      .single();

    if (findError || !admin) {
      return NextResponse.json(
        { success: false, error: "Admin tidak ditemukan." },
        { status: 404 }
      );
    }

    // Verifikasi password saat ini
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      admin.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Password saat ini tidak sesuai." },
        { status: 400 }
      );
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from("Admin")
      .update({ password: hashedPassword })
      .eq("id", admin.id);

    if (updateError) {
      console.error("Update password error:", updateError);
      return NextResponse.json(
        { success: false, error: "Gagal mengupdate password." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}