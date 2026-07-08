import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token dan password baru wajib diisi." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    // 1 RPC: validate token + hash (extensions.crypt) + update + delete token
    // Avoids bcryptjs on Cloudflare Workers (CPU + hash-format mismatch)
    const { data: result, error: rpcError } = await getSupabase().rpc(
      "reset_admin_password",
      {
        p_token: token,
        p_new_password: password,
      }
    );

    if (rpcError) {
      console.error("Reset password RPC error:", rpcError);
      return NextResponse.json(
        { success: false, error: "Terjadi kesalahan server." },
        { status: 500 }
      );
    }

    const parsed = typeof result === "string" ? JSON.parse(result) : result;

    if (!parsed?.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed?.error || "Gagal mengupdate password.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        parsed.message ||
        "Password berhasil diubah. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
