import type { Metadata } from "next";
import { Inter, Fredoka, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-brand",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-tagline",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Muara Teweh — Mebel Online | Toko Furnitur",
  description:
    "Toko furnitur terpercaya di Muara Teweh. Temukan koleksi mebel berkualitas untuk rumah impian Anda.",
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
  openGraph: {
    title: "Muara Teweh — Mebel Online",
    description:
      "Toko furnitur terpercaya. Koleksi mebel berkualitas untuk rumah impian Anda.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${inter.variable} ${fredoka.variable} ${poppins.variable} antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
