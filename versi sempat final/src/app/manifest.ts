import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Admin — Muara Teweh Mebel Online",
    short_name: "Muara Teweh Admin",
    description:
      "Panel admin toko furnitur Muara Teweh. Kelola produk, kategori, dan pengaturan toko.",
    start_url: "/admin/dashboard",
    scope: "/admin/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#B31324",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["business", "shopping"],
    lang: "id-ID",
    dir: "ltr",
  };
}
