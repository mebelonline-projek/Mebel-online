"use server";

import { signIn } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  try {
    const result = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Email atau password salah." };
    }

    return { success: true };
  } catch {
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}