import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel — Muara Teweh",
  description: "Panel administrasi toko furnitur Muara Teweh",
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#b8860b",
  },
  icons: [
    { rel: "icon", url: "/icons/icon-192x192.png", sizes: "192x192" },
    { rel: "icon", url: "/icons/icon-512x512.png", sizes: "512x512" },
    {
      rel: "apple-touch-icon",
      url: "/icons/icon-152x152.png",
      sizes: "152x152",
    },
    {
      rel: "apple-touch-icon",
      url: "/icons/icon-192x192.png",
      sizes: "192x192",
    },
    {
      rel: "apple-touch-icon",
      url: "/icons/icon-512x512.png",
      sizes: "512x512",
    },
  ],
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* PWA: Register Service Worker (hanya di halaman admin) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/admin/' });
              });
            }
          `,
        }}
      />
      {children}
    </>
  );
}
