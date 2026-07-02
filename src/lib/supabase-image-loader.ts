/**
 * Custom Next.js Image Loader — Supabase Image Transformation.
 *
 * MIGRASI CLOUDFLARE: Loader ini sekarang menggunakan Supabase Image Transformation
 * untuk mengkonversi gambar ke WebP on-the-fly. Ini menggantikan sharp (yang tidak
 * kompatibel dengan Cloudflare Workers) dan Vercel Image Optimization (yang terbatas kuota).
 *
 * Cara kerja:
 *   - Gambar dari Supabase Storage → tambahkan query parameter transformasi
 *     (?format=webp&quality=85) agar Supabase serve sebagai WebP
 *   - Gambar dari sumber lain → proxy melalui Next.js default image optimization
 *
 * Supabase Image Transformation menggunakan libvips (engine yang sama dengan sharp),
 * jadi kualitas output identik. Transformasi di-cache di CDN Supabase.
 *
 * @see https://supabase.com/docs/guides/storage/image-transformations
 * @see next.config.ts — loader diarahkan ke file ini
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export default function supabaseImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Gambar dari Supabase Storage → gunakan Supabase Image Transformation
  // URL format: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
  // Transformasi: {supabaseUrl}/render/image/public/{bucket}/{path}?width=X&format=webp&quality=Y
  if (src.includes("supabase.co") && src.includes("/storage/v1/object/public/")) {
    // Extract path setelah /storage/v1/object/public/
    const publicPrefix = "/storage/v1/object/public/";
    const pathIndex = src.indexOf(publicPrefix);
    if (pathIndex !== -1) {
      const objectPath = src.slice(pathIndex + publicPrefix.length);
      const qualityParam = quality || 85;

      // Gunakan Supabase Image Transformation endpoint
      // Format: {supabaseUrl}/render/image/public/{bucket}/{path}?width=X&format=webp&quality=Y
      return `${SUPABASE_URL}/render/image/public/${objectPath}?width=${width}&format=webp&quality=${qualityParam}`;
    }
  }

  // Gambar dari Supabase yang sudah dalam format transformasi (legacy/already transformed)
  // Langsung return tanpa modifikasi
  if (src.includes("supabase.co") && src.includes("/render/image/")) {
    return src;
  }

  // Gambar eksternal lain (placehold.co, unsplash, dll) → proxy melalui Next.js
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}