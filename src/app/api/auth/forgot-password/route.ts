export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordRateLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Rate limiting berdasarkan IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const rateCheck = await forgotPasswordRateLimiter(ip, "forgot-password");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Terlalu banyak permintaan. Silakan coba lagi dalam 15 menit.",
        },
        { status: 429 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email wajib diisi." },
        { status: 400 }
      );
    }

    // Cek apakah email terdaftar sebagai admin
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Tetap return sukses meskipun email tidak ditemukan (keamanan)
    if (!admin) {
      return NextResponse.json({
        success: true,
        message:
          "Jika email terdaftar, link reset password akan dikirim ke email Anda.",
      });
    }

    // Hapus token lama untuk email ini
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Generate token baru
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt,
      },
    });

    // Kirim email
    const resetLink = `${process.env.AUTH_URL ?? "http://localhost:3000"}/admin/reset-password?token=${token}`;
    const emailResult = await sendPasswordResetEmail(
      email.toLowerCase(),
      resetLink
    );

    if (!emailResult.success) {
      console.error("Email send failed:", emailResult.error);
      return NextResponse.json(
        { success: false, error: "Gagal mengirim email. Coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Link reset password telah dikirim ke email Anda (cek folder spam jika tidak muncul dalam beberapa menit).",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
