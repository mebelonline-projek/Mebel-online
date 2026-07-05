export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

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

    const supabase = getSupabase();

    // Verifikasi password saat ini menggunakan RPC (sama seperti login)
    // Ini memastikan hash $2a$12$... dari extensions.crypt() bisa diverifikasi
    const { data: verifyResult, error: verifyError } = await supabase
      .rpc("verify_admin_password", {
        p_email: session.user.email,
        p_password: currentPassword,
      });

    if (verifyError || !verifyResult || verifyResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Password saat ini tidak sesuai." },
        { status: 400 }
      );
    }

    // Hash password baru menggunakan RPC (menghasilkan hash $2a$12$...)
    const { data: hashedPassword, error: hashError } = await supabase
      .rpc("hash_admin_password", {
        p_password: newPassword,
      });

    if (hashError || !hashedPassword) {
      console.error("Hash password error:", hashError);
      return NextResponse.json(
        { success: false, error: "Gagal meng-hash password baru." },
        { status: 500 }
      );
    }

    // Update password di database
    const adminId = verifyResult[0].id;
    const { error: updateError } = await supabase
      .from("Admin")
      .update({ password: hashedPassword })
      .eq("id", adminId);

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