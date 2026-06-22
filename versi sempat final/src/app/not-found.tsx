import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4">
        <h1 className="text-8xl font-bold text-brand-maroon mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand-maroon text-white rounded-full px-6 py-3 font-medium hover:bg-brand-maroon-dark transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
