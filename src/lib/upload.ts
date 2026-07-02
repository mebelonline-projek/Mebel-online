/**
 * Upload utility — uploads files to Supabase Storage using Supabase JS SDK.
 *
 * MIGRASI CLOUDFLARE: sharp dihapus karena tidak kompatibel dengan Cloudflare Workers.
 * Konversi ke WebP sekarang ditangani oleh Supabase Image Transformation (on-the-fly)
 * saat gambar ditampilkan via URL parameter (?format=webp&quality=85).
 *
 * Flow baru:
 *   [Client] browser-image-compression (resize only, keep format asli)
 *   → [Server] upload langsung ke Supabase Storage (NO sharp)
 *   → [Image Loader] generate URL dengan transformasi Supabase (?format=webp&quality=85)
 *   → [Browser] terima gambar WebP dari CDN Supabase
 */
import { getSupabase } from "@/lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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
    return "Ukuran file maksimal 20MB.";
  }
  return null;
}

/**
 * Hapus file dari Supabase Storage berdasarkan URL publiknya menggunakan Supabase SDK.
 * Returns true kalau berhasil atau file sudah tidak ada, false kalau gagal.
 */
export async function deleteFromSupabase(url: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  try {
    // URL format: {supabaseUrl}/storage/v1/object/public/{bucket}/{folder}/{filename}
    const publicPrefix = `${supabaseUrl}/storage/v1/object/public/`;
    if (!url.startsWith(publicPrefix)) {
      console.warn("deleteFromSupabase: URL is not a Supabase public URL");
      return false;
    }

    const objectPath = url.slice(publicPrefix.length); // e.g. "furniture-images/products/file.webp"
    const [bucket, ...pathParts] = objectPath.split("/");
    const filePath = pathParts.join("/");

    const supabase = getSupabase();
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error && !error.message?.includes("not found")) {
      console.error("deleteFromSupabase failed:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("deleteFromSupabase error:", error);
    return false;
  }
}

/**
 * Upload file ke Supabase Storage menggunakan Supabase JS SDK.
 *
 * MIGRASI CLOUDFLARE: Tidak ada lagi konversi WebP di server (sharp dihapus).
 * File di-upload apa adanya (format asli dari client). Konversi ke WebP
 * ditangani oleh Supabase Image Transformation saat gambar ditampilkan.
 *
 * @param file - File yang akan di-upload (JPG, PNG, WebP, AVIF)
 * @param folder - Sub-folder di bucket (default: "general")
 * @returns UploadResult dengan URL publik atau pesan error
 */
export async function uploadToSupabase(
  file: File,
  folder: string = "general",
  options?: { upsert?: boolean; customFileName?: string }
): Promise<UploadResult> {
  // Validasi awal
  const validationError = validateFile(file);
  if (validationError) {
    return { url: "", error: validationError };
  }

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "furniture-images";

  try {
    // ── 1. Baca file sebagai ArrayBuffer ──
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // ── 2. Generate nama file unik untuk Supabase ──
    // Pertahankan ekstensi asli file (jpg, png, webp, dll)
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const supabaseFileName =
      options?.customFileName ??
      `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    // ── 3. Upload Buffer ke Supabase Storage ──
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(supabaseFileName, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: options?.upsert ?? false,
        // Cache gambar selama 1 tahun di browser & CDN
        // Karena nama file selalu unik (timestamp+UUID), cache bisa sangat agresif
        cacheControl: "public, max-age=31536000, immutable",
      });

    if (error) {
      console.error("Supabase upload failed:", error);
      return { url: "", error: "Gagal mengunggah file." };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    console.log(`✅ [uploadToSupabase] Uploaded: ${publicUrl}`);
    return { url: publicUrl };
  } catch (error) {
    console.error("Upload error:", error);
    return { url: "", error: "Terjadi kesalahan saat mengunggah file." };
  }
}