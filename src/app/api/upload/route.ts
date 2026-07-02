import { NextResponse } from "next/server";
import { uploadToSupabase, validateFile } from "@/lib/upload";
import { requireAdmin } from "@/lib/api-auth";

/**
 * POST /api/upload
 *
 * Menerima file WebP yang SUDAH dikompres dari client-side (Canvas API).
 * Parameter:
 *   - file: File (wajib, format WebP hasil konversi client-side)
 *   - folder: string (opsional, default "general")
 *   - tipeFoto: string (opsional, untuk keperluan logging/kategorisasi)
 *
 * Untuk kompresi client-side gunakan fungsi `prosesDanUploadFoto()` dari @/lib/image-compression.
 */
export async function POST(request: Request) {
  try {
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) ?? "general";
    const tipeFoto = (formData.get("tipeFoto") as string) ?? undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Tidak ada file yang diunggah." },
        { status: 400 }
      );
    }

    const validationError = validateFile(file);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Log jika tipeFoto diberikan
    if (tipeFoto) {
      console.log(
        `📤 [/api/upload] tipeFoto=${tipeFoto} | file=${file.name} | size=${(file.size / 1024).toFixed(2)} KB | type=${file.type}`
      );
    }

    const result = await uploadToSupabase(file, folder);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: result.url },
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
