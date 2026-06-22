import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // Izinkan akses ke halaman login admin tanpa session
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Izinkan akses ke forgot-password, reset-password tanpa session
  if (
    request.nextUrl.pathname === "/admin/forgot-password" ||
    request.nextUrl.pathname === "/admin/reset-password"
  ) {
    return NextResponse.next();
  }

  // Untuk route /admin/* lainnya, redirect ke login jika tidak ada session
  if (!sessionToken && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};