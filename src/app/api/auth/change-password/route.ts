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

    // 1 RPC call: verifikasi + hash + update (all-in-one)
    // CPU usage: ~15-25ms (di bawah 50ms limit Cloudflare Workers)
    const { data: result, error: rpcError } = await supabase
      .rpc("change_admin_password", {
        p_email: session.user.email,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });

    if (rpcError) {
      console.error("Change password RPC error:", rpcError);
      return NextResponse.json(
        { success: false, error: "Terjadi kesalahan server." },
        { status: 500 }
      );
    }

    // Parse JSONB result
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error || "Gagal mengubah password." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: parsed.message || "Password berhasil diubah.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}