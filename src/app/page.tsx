import type { Metadata } from "next";
import LandingPageClient from "@/components/landing/LandingPageClient";

/** Static shell — no Supabase on Worker SSR (avoids Error 1102 / timeout on `/`). */
export const metadata: Metadata = {
  title: "Muara Teweh — Mebel Online | Toko Furnitur",
  description:
    "Toko furnitur terpercaya di Muara Teweh. Temukan koleksi mebel berkualitas untuk rumah impian Anda.",
  openGraph: {
    title: "Muara Teweh — Mebel Online",
    description:
      "Toko furnitur terpercaya. Koleksi mebel berkualitas untuk rumah impian Anda.",
    type: "website",
    locale: "id_ID",
  },
  keywords: [
    "furnitur",
    "mebel",
    "Muara Teweh",
    "toko furnitur",
    "kursi",
    "meja",
    "lemari",
    "perabot rumah",
  ],
  alternates: {
    canonical: process.env.AUTH_URL || "https://mebelonline.id",
  },
};

export default function HomePage() {
  return <LandingPageClient />;
}
