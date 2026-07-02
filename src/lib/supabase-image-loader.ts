/**
 * Custom Next.js Image Loader — Passthrough (no transformation).
 *
 * MIGRASI CLOUDFLARE: Karena unoptimized: true di next.config.ts,
 * loader ini cukup return URL mentah tanpa transformasi.
 * Gambar dari Supabase Storage langsung di-serve oleh CDN Supabase.
 *
 * Konversi ke WebP sudah dilakukan di client-side (Canvas API) sebelum upload.
 * File yang tersimpan di Supabase Storage sudah dalam format WebP.
 *
 * @see next.config.ts — loader diarahkan ke file ini, unoptimized: true
 */

export default function supabaseImageLoader({
  src,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Return URL apa adanya — tidak ada transformasi
  // File sudah WebP dari client-side, jadi tidak perlu konversi lagi
  return src;
}