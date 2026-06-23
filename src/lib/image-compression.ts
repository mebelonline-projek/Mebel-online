/**
 * Client-side image compression utility.
 *
 * WAJIB dijalankan di client (browser), bukan di server.
 * Menggunakan library 'browser-image-compression' untuk mengompres & konversi WebP
 * sebelum di-upload, agar menghemat bandwidth pengguna dan efisiensi penyimpanan.
 *
 * Fungsi ini hanya melakukan kompresi — upload tetap melalui API route
 * (/api/upload) yang sudah diproteksi requireAdmin() dan menggunakan
 * SUPABASE_SERVICE_KEY dengan aman di server-side.
 *
 * @example
 *   import { kompresFoto, getCompressInfo } from "@/lib/image-compression";
 *
 *   const fileKompres = await kompresFoto(fileInput.files[0], "hero");
 *   // kirim fileKompres ke API upload
 */

import imageCompression from "browser-image-compression";

// ── Konfigurasi Kompresi per Tipe Foto ──────────────────────────────────

interface CompressOptions {
  maxWidthOrHeight: number;
  quality: number;
  /** Target maksimal ukuran file dalam MB */
  maxSizeMB: number;
  /** Folder tujuan di Supabase Storage */
  folder: string;
  /** Label untuk display */
  label: string;
}

const COMPRESS_CONFIG: Record<string, CompressOptions> = {
  hero: {
    maxWidthOrHeight: 1600, // 1600×1200 (4:3)
    quality: 0.8,
    maxSizeMB: 0.35, // 350 KB
    folder: "hero",
    label: "Hero (Halaman Utama)",
  },
  produk: {
    maxWidthOrHeight: 800, // 800×600 (4:3)
    quality: 0.75,
    maxSizeMB: 0.09, // 90 KB
    folder: "products",
    label: "Produk (Katalog)",
  },
  "galeri-produk": {
    maxWidthOrHeight: 800, // 800×600 (4:3) — sama dengan produk
    quality: 0.75,
    maxSizeMB: 0.09, // 90 KB
    folder: "products/variants",
    label: "Galeri Produk",
  },
  "tentang-kami": {
    maxWidthOrHeight: 1024, // 1024×768 (4:3)
    quality: 0.75,
    maxSizeMB: 0.18, // 180 KB
    folder: "tentang-kami",
    label: "Tentang Kami",
  },
} as const;

/** Tipe foto yang didukung */
export type TipeFoto = keyof typeof COMPRESS_CONFIG;

// ── Hasil Kompresi ──────────────────────────────────────────────────────

export interface HasilKompresi {
  /** File hasil kompresi (format WebP) */
  file: File;
  /** Nama folder tujuan di Supabase Storage */
  folder: string;
  /** Ukuran asli dalam bytes */
  ukuranAsli: number;
  /** Ukuran setelah kompresi dalam bytes */
  ukuranKompres: number;
  /** Persentase penghematan */
  persenHemat: string;
}

// ── Fungsi Kompresi ─────────────────────────────────────────────────────

/**
 * Kompres gambar di client-side sesuai tipe foto.
 * Hasilnya berupa File WebP yang siap dikirim ke API upload.
 *
 * @param file - File mentah dari <input type="file">
 * @param tipeFoto - 'hero' | 'produk' | 'tentang-kami'
 * @returns HasilKompresi berisi file terkompres + metadata
 * @throws Error jika kompresi gagal
 */
export async function kompresFoto(
  file: File,
  tipeFoto: TipeFoto
): Promise<HasilKompresi> {
  const config = COMPRESS_CONFIG[tipeFoto];

  if (!config) {
    throw new Error(
      `Tipe foto tidak valid. Gunakan: ${Object.keys(COMPRESS_CONFIG).join(", ")}`
    );
  }

  const ukuranAsli = file.size;

  // ── 1. Log ukuran asli ──
  console.log(
    `📸 [${config.label}] Ukuran asli: ${(ukuranAsli / 1024).toFixed(2)} KB | Format: ${file.type}`
  );

  // ── 2. Kompresi client-side ──
  let fileKompres: File;
  try {
    fileKompres = await imageCompression(file, {
      maxSizeMB: config.maxSizeMB,
      maxWidthOrHeight: config.maxWidthOrHeight,
      useWebWorker: true, // biar tidak nge-block UI thread
      fileType: "image/webp", // konversi paksa ke WebP
      initialQuality: config.quality,
      alwaysKeepResolution: false,
    });
  } catch (error) {
    console.error(`❌ [${config.label}] Gagal kompresi:`, error);
    throw new Error("Gagal mengompres gambar. Silakan coba dengan file lain.");
  }

  let ukuranKompres = fileKompres.size;

  // ── 3. Jika masih kegedean, kompres sekali lagi ──
  if (ukuranKompres > config.maxSizeMB * 1024 * 1024 * 1.5) {
    console.warn(
      `⚠️ [${config.label}] Hasil masih besar (${(ukuranKompres / 1024).toFixed(2)} KB), kompres ulang...`
    );
    fileKompres = await imageCompression(fileKompres, {
      maxSizeMB: config.maxSizeMB,
      maxWidthOrHeight: Math.round(config.maxWidthOrHeight * 0.9),
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: Math.max(config.quality - 0.1, 0.3),
      alwaysKeepResolution: false,
    });
    ukuranKompres = fileKompres.size;
  }

  const persenHemat =
    ukuranAsli > 0
      ? ((1 - ukuranKompres / ukuranAsli) * 100).toFixed(1)
      : "0.0";

  console.log(
    `✅ [${config.label}] Setelah kompresi: ${(ukuranKompres / 1024).toFixed(2)} KB (hemat ${persenHemat}%)`
  );

  return {
    file: fileKompres,
    folder: config.folder,
    ukuranAsli,
    ukuranKompres,
    persenHemat,
  };
}

// ── Fungsi Proses + Upload (All-in-One) ────────────────────────────────

/**
 * Kompres gambar + upload ke Supabase via API route.
 *
 * Fungsi lengkap yang:
 * 1. Kompres gambar di client-side sesuai tipe foto
 * 2. Kirim ke POST /api/upload untuk di-upload ke Supabase Storage
 * 3. Return URL publik hasil upload
 *
 * @param file - File mentah dari <input type="file">
 * @param tipeFoto - 'hero' | 'produk' | 'tentang-kami'
 * @returns URL publik file yang sudah di-upload
 * @throws Error jika kompresi atau upload gagal
 */
export async function prosesDanUploadFoto(
  file: File,
  tipeFoto: TipeFoto
): Promise<string> {
  // 1. Kompresi client-side
  const hasil = await kompresFoto(file, tipeFoto);

  // 2. Kirim file terkompres ke API
  const formData = new FormData();
  formData.append("file", hasil.file, `${tipeFoto}-${Date.now()}.webp`);
  formData.append("folder", hasil.folder);
  formData.append("tipeFoto", tipeFoto);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error(`❌ [${tipeFoto}] Upload API error:`, errData);
    throw new Error(errData.error || "Gagal mengunggah gambar ke server.");
  }

  const data = await res.json();

  if (!data.success || !data.data?.url) {
    throw new Error(data.error || "Gagal mendapatkan URL gambar.");
  }

  console.log(`🚀 [${tipeFoto}] Upload berhasil: ${data.data.url}`);
  return data.data.url;
}

// ── Info Display ────────────────────────────────────────────────────────

/**
 * Mendapatkan informasi konfigurasi kompresi untuk sebuah tipe foto.
 * Berguna untuk menampilkan info ke user (mis: "Maks 350 KB, 1600×1200").
 */
export function getCompressInfo(tipeFoto: TipeFoto): {
  label: string;
  resolusi: string;
  maxSize: string;
} {
  const config = COMPRESS_CONFIG[tipeFoto];
  const resolusi = `${config.maxWidthOrHeight}x${Math.round(config.maxWidthOrHeight * 0.75)}`;
  const maxSize =
    config.maxSizeMB >= 1
      ? `${config.maxSizeMB} MB`
      : `${Math.round(config.maxSizeMB * 1024)} KB`;
  return {
    label: config.label,
    resolusi,
    maxSize,
  };
}