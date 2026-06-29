import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix: multiple lockfiles warning — tentukan root proyek secara eksplisit
  outputFileTracingRoot: process.cwd(),
  images: {
    // Custom loader: bypass Vercel Image Optimization untuk gambar Supabase
    // yang sudah dikompresi ke WebP (hemat kuota Vercel)
    loader: "custom",
    loaderFile: "./src/lib/supabase-image-loader.ts",
    // Cache gambar lebih lama di Vercel CDN (mengurangi permintaan ulang)
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
  serverExternalPackages: ["bcryptjs"],
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
