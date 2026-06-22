import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Memeriksa apakah request memiliki session admin yang valid.
 * Gunakan di setiap endpoint API yang hanya boleh diakses admin.
 *
 * @returns { session } jika terautentikasi
 * @returns { NextResponse } error 401 jika tidak
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}
