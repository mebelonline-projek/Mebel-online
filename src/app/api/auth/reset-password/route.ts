import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { authRateLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limiting berdasarkan IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const rateCheck = await authRateLimiter(ip, "reset-password");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Terlalu banyak permintaan. Silakan coba lagi dalam 15 menit.",
        },
        { status: 429 }
      );
    }

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

    // Cari token yang valid
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Token tidak valid." },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      // Hapus token yang expired
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { success: false, error: "Token sudah kedaluwarsa. Silakan minta reset password lagi." },
        { status: 400 }
      );
    }

    // Update password admin
    const hashedPassword = await hashPassword(password);
    await prisma.admin.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Hapus token yang sudah dipakai
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

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
