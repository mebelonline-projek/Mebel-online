import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token dan password baru wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Cari token yang valid
    const { data: resetToken, error: findError } = await supabase
      .from("PasswordResetToken")
      .select("*")
      .eq("token", token)
      .single();

    if (findError || !resetToken) {
      return NextResponse.json(
        { success: false, error: "Token tidak valid." },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(resetToken.expiresAt);

    if (expiresAt < now) {
      // Hapus token yang expired
      await supabase
        .from("PasswordResetToken")
        .delete()
        .eq("id", resetToken.id);

      return NextResponse.json(
        { success: false, error: "Token sudah kedaluwarsa. Silakan minta reset password lagi." },
        { status: 400 }
      );
    }

    // Update password admin
    const hashedPassword = await hashPassword(password);
    const { error: updateError } = await supabase
      .from("Admin")
      .update({ password: hashedPassword })
      .eq("email", resetToken.email);

    if (updateError) {
      console.error("Update password error:", updateError);
      return NextResponse.json(
        { success: false, error: "Gagal mengupdate password." },
        { status: 500 }
      );
    }

    // Hapus token yang sudah dipakai
    await supabase
      .from("PasswordResetToken")
      .delete()
      .eq("id", resetToken.id);

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}