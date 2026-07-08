import { encode } from "@auth/core/jwt";
import { authConfig } from "./auth.config";

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
};

export function isSecureSessionCookie(request: Request): boolean {
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (authUrl) {
    return authUrl.startsWith("https://");
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function getSessionCookieName(secure: boolean): string {
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

export async function createSessionToken(
  user: AdminSessionUser,
  request: Request
): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  const maxAge = authConfig.session?.maxAge ?? 30 * 24 * 60 * 60;
  const secure = isSecureSessionCookie(request);
  const cookieName = getSessionCookieName(secure);

  return encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
    },
    secret,
    salt: cookieName,
    maxAge,
  });
}

export function getSessionMaxAge(): number {
  return authConfig.session?.maxAge ?? 30 * 24 * 60 * 60;
}

export function applySessionCookie(
  response: Response,
  request: Request,
  sessionToken: string
): void {
  const secure = isSecureSessionCookie(request);
  const cookieName = getSessionCookieName(secure);
  const maxAge = getSessionMaxAge();

  response.headers.append(
    "Set-Cookie",
    `${cookieName}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
      secure ? "; Secure" : ""
    }`
  );
}
