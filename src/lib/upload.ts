/**
 * Upload utility — uploads files to Supabase Storage using Supabase JS SDK.
 * Konversi paksa ke WebP di server-side menggunakan sharp.
 */
import { getSupabase } from "@/lib/supabase";
import sharp from "sharp";

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
 * Konversi file ke WebP menggunakan sharp (server-side).
 * Menjamin 100% output adalah WebP, terlepas dari format input (JPG, PNG, dll).
 *
 * @param file - File dari FormData (bisa JPG, PNG, WebP, AVIF)
 * @returns Buffer WebP + nama file dengan ekstensi .webp
 */
async function convertToWebp(file: File): Promise<{ buffer: Buffer; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const webpBuffer = await sharp(inputBuffer)
    .webp({ quality: 90 })
    .toBuffer();

  // Override nama file jadi .webp
  const webpName = file.name.replace(/\.[^.]+$/, ".webp");

  console.log(
    `🖼️ [convertToWebp] ${(inputBuffer.length / 1024).toFixed(1)} KB → ${(webpBuffer.length / 1024).toFixed(1)} KB (${file.name})`
  );

  return { buffer: webpBuffer, fileName: webpName };
}

/**
 * Upload file ke Supabase Storage menggunakan Supabase JS SDK.
 * File akan DIKONVERSI PAKSA ke WebP via sharp sebelum upload.
 *
 * @param file - File yang akan di-upload (JPG, PNG, WebP, AVIF — semua dikonversi ke WebP)
 * @param folder - Sub-folder di bucket (default: "general")
 * @returns UploadResult dengan URL publik atau pesan error
 */
export async function uploadToSupabase(
  file: File,
  folder: string = "general",
  options?: { upsert?: boolean; customFileName?: string }
): Promise<UploadResult> {
  // Validasi awal — gunakan MIME type asli dulu
  const validationError = validateFile(file);
  if (validationError) {
    return { url: "", error: validationError };
  }

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "furniture-images";

  try {
    // ── 1. Konversi paksa ke WebP di server ──
    const { buffer: webpBuffer } = await convertToWebp(file);

    // ── 2. Generate nama file unik untuk Supabase ──
    const supabaseFileName =
      options?.customFileName ??
      `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;

    // ── 3. Upload Buffer ke Supabase Storage ──
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(supabaseFileName, webpBuffer, {
        contentType: "image/webp",
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