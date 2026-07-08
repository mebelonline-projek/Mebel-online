export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  applySessionCookie,
  createSessionToken,
} from "@/lib/session-cookie";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabase().rpc("verify_admin_password", {
      p_email: email,
      p_password: password,
    });

    if (error) {
      console.error("Login RPC error:", error);
      return NextResponse.json(
        { success: false, error: "Terjadi kesalahan server." },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah." },
        { status: 401 }
      );
    }

    const admin = data[0] as { id: string; email: string; name: string };
    const sessionToken = await createSessionToken(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      request
    );

    const response = NextResponse.json({ success: true });
    applySessionCookie(response, request, sessionToken);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
