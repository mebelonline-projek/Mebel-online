/**
 * Custom Next.js Image Loader — bypass Vercel Image Optimization untuk gambar Supabase.
 *
 * Gambar dari Supabase Storage sudah dikompresi ke WebP di client-side sebelum upload
 * (via browser-image-compression). Karena itu, optimasi ulang oleh Vercel bersifat
 * redundan dan hanya menghabiskan kuota image optimization Vercel.
 *
 * Loader ini mengirim URL gambar Supabase langsung ke browser (unoptimized),
 * sementara gambar dari sumber lain tetap diproses oleh Vercel.
 *
 * @see next.config.ts — loader diarahkan ke file ini
 */
export default function supabaseImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Gambar dari Supabase Storage → kirim langsung, tanpa Vercel optimasi
  // Karena sudah WebP + terkompresi dari client-side (max 90KB produk, 350KB hero)
  if (src.includes("supabase.co")) {
    return src;
  }

  // Gambar eksternal lain (placehold.co, unsplash, dll) → tetap via Vercel
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}