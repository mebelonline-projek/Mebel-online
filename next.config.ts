import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================
  // MIGRASI CLOUDFLARE: Konfigurasi untuk OpenNext
  // ============================================

  // Output standalone untuk Cloudflare Workers/Pages
  output: "standalone",

  images: {
    // Custom loader: Supabase Image Transformation
    // Gambar dari Supabase dikonversi ke WebP on-the-fly via URL transformation
    // (menggantikan sharp yang tidak kompatibel dengan Cloudflare Workers)
    loader: "custom",
    loaderFile: "./src/lib/supabase-image-loader.ts",
    // Cache gambar lebih lama di CDN (mengurangi permintaan ulang)
    minimumCacheTTL: 86400, // 1 hari
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // bcryptjs pure JS, tidak perlu di-externalize untuk Cloudflare
  // serverExternalPackages dihapus
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/admin/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;