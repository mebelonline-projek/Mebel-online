import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSupabase } from "./supabase";
import { authConfig } from "./auth.config";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // Gunakan RPC untuk verifikasi password di sisi database
          // Ini menghindari bcrypt di Worker yang memakan CPU
          const { data, error } = await getSupabase()
            .rpc("verify_admin_password", {
              p_email: email,
              p_password: password,
            });

          if (error || !data || data.length === 0) {
            return null;
          }

          const admin = data[0];
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
});

// Hash password menggunakan bcrypt (untuk create admin baru)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password menggunakan bcrypt (fallback jika RPC tidak tersedia)
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
