import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Hapus semua cookie session NextAuth
  response.cookies.set("authjs.session-token", "", {
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("__Secure-authjs.session-token", "", {
    maxAge: 0,
    path: "/",
    secure: true,
  });

  return response;
}