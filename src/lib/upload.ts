/**
 * Upload utility — uploads files to Supabase Storage.
 * Falls back to /public/uploads/ for local development.
 */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string;
  error?: string;
}

export function validateFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran file maksimal 5MB.";
  }
  return null;
}

export async function uploadToSupabase(
  file: File,
  folder: string = "general"
): Promise<UploadResult> {
  const validationError = validateFile(file);
  if (validationError) {
    return { url: "", error: validationError };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "furniture-images";

  if (!supabaseUrl || !supabaseKey) {
    return {
      url: "",
      error: "Supabase belum dikonfigurasi. Hubungi administrator.",
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${ext}`;

    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": file.type,
        },
        body: buffer,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Supabase upload failed:", errorBody);
      return { url: "", error: "Gagal mengunggah file." };
    }

    return {
      url: `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { url: "", error: "Terjadi kesalahan saat mengunggah file." };
  }
}
