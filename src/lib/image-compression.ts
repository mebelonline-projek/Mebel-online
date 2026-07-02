/**
 * Client-side image compression utility.
 *
 * WAJIB dijalankan di client (browser), bukan di server.
 * Menggunakan Canvas API native browser untuk resize + konversi WebP
 * sebelum di-upload, agar menghemat bandwidth pengguna dan efisiensi penyimpanan.
 *
 * MIGRASI CLOUDFLARE: browser-image-compression diganti dengan Canvas API native
 * karena library tersebut tidak bisa menghasilkan WebP secara deterministik
 * (quality iteratif, bisa anjlok ke 0.3). Canvas API memberikan kontrol penuh
 * atas format output (WebP) dan quality (deterministik).
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

// ── Konfigurasi Kompresi per Tipe Foto ──────────────────────────────────

interface CompressOptions {
  maxWidthOrHeight: number;
  /** Quality WebP deterministik (0-1). Tidak iteratif, selalu fix. */
  quality: number;
  /** Target maksimal ukuran file dalam MB (safety net) */
  maxSizeMB: number;
  /** Folder tujuan di Supabase Storage */
  folder: string;
  /** Label untuk display */
  label: string;
}

// Canvas API: resize + konversi WebP dengan quality deterministik.
// Quality 0.85 = near-lossless untuk WebP, setara JPEG ~95 secara visual.
const COMPRESS_CONFIG: Record<string, CompressOptions> = {
  hero: {
    maxWidthOrHeight: 1600,
    quality: 0.85,
    maxSizeMB: 1.5,
    folder: "hero",
    label: "Hero (Halaman Utama)",
  },
  produk: {
    maxWidthOrHeight: 800,
    quality: 0.85,
    maxSizeMB: 1.5,
    folder: "products",
    label: "Produk (Katalog)",
  },
  "galeri-produk": {
    maxWidthOrHeight: 800,
    quality: 0.85,
    maxSizeMB: 1.5,
    folder: "products/variants",
    label: "Galeri Produk",
  },
  "tentang-kami": {
    maxWidthOrHeight: 1024,
    quality: 0.85,
    maxSizeMB: 1.5,
    folder: "tentang-kami",
    label: "Tentang Kami",
  },
  logo: {
    maxWidthOrHeight: 512,
    quality: 0.85,
    maxSizeMB: 1.5,
    folder: "settings",
    label: "Logo (Pengaturan)",
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

// ── Canvas API Helper ───────────────────────────────────────────────────

/**
 * Load gambar dari File ke HTMLImageElement.
 * Menggunakan Object URL agar tidak perlu render ke DOM.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memuat gambar. File mungkin rusak."));
    };
    img.src = url;
  });
}

/**
 * Resize gambar ke dimensi target dan konversi ke WebP via Canvas API.
 *
 * @param img - HTMLImageElement yang sudah di-load
 * @param maxWidthOrHeight - Dimensi maksimum (panjang sisi terpanjang)
 * @param quality - Quality WebP (0-1), deterministik
 * @returns Blob WebP
 */
function resizeAndConvertToWebP(
  img: HTMLImageElement,
  maxWidthOrHeight: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Hitung dimensi baru (pertahankan aspect ratio)
    const { width: origW, height: origH } = img;
    const scale = Math.min(maxWidthOrHeight / origW, maxWidthOrHeight / origH, 1);
    const newW = Math.round(origW * scale);
    const newH = Math.round(origH * scale);

    // Buat canvas off-screen
    const canvas = document.createElement("canvas");
    canvas.width = newW;
    canvas.height = newH;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Browser tidak mendukung Canvas API."));
      return;
    }

    // Draw gambar ke canvas dengan smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, newW, newH);

    // Konversi ke WebP dengan quality deterministik
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Gagal mengkonversi gambar ke WebP."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality
    );
  });
}

// ── Fungsi Kompresi ─────────────────────────────────────────────────────

/**
 * Kompres gambar di client-side menggunakan Canvas API native browser.
 * Hasilnya berupa File WebP yang siap dikirim ke API upload.
 *
 * @param file - File mentah dari <input type="file">
 * @param tipeFoto - 'hero' | 'produk' | 'tentang-kami' | 'galeri-produk' | 'logo'
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

  // ── 2. Load gambar ke <img> ──
  const img = await loadImage(file);

  // ── 3. Resize + konversi ke WebP via Canvas API ──
  let blob: Blob;
  try {
    blob = await resizeAndConvertToWebP(img, config.maxWidthOrHeight, config.quality);
  } catch (error) {
    console.error(`❌ [${config.label}] Gagal konversi WebP:`, error);
    throw new Error("Gagal mengkonversi gambar. Silakan coba dengan file lain.");
  }

  // ── 4. Buat File WebP dari Blob ──
  const fileName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  let fileWebP = new File([blob], fileName, { type: "image/webp" });
  let ukuranKompres = fileWebP.size;

  // ── 5. Safety net: jika masih kegedean, turunkan quality ──
  if (ukuranKompres > config.maxSizeMB * 1024 * 1024 * 1.5) {
    console.warn(
      `⚠️ [${config.label}] Hasil masih besar (${(ukuranKompres / 1024).toFixed(2)} KB), kompres ulang dengan quality lebih rendah...`
    );
    const lowerQuality = Math.max(config.quality - 0.15, 0.5);
    const blob2 = await resizeAndConvertToWebP(img, config.maxWidthOrHeight, lowerQuality);
    const fileWebP2 = new File([blob2], fileName, { type: "image/webp" });

    // Gunakan hasil kedua jika lebih kecil
    if (fileWebP2.size < fileWebP.size) {
      fileWebP = fileWebP2;
      ukuranKompres = fileWebP2.size;
    }
  }

  const persenHemat =
    ukuranAsli > 0
      ? ((1 - ukuranKompres / ukuranAsli) * 100).toFixed(1)
      : "0.0";

  console.log(
    `✅ [${config.label}] Setelah kompresi: ${(ukuranKompres / 1024).toFixed(2)} KB (hemat ${persenHemat}%) | Format: WebP | Quality: ${config.quality}`
  );

  return {
    file: fileWebP,
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
 * 1. Kompres gambar di client-side (Canvas API → WebP)
 * 2. Kirim ke POST /api/upload untuk di-upload ke Supabase Storage
 * 3. Return URL publik hasil upload
 *
 * @param file - File mentah dari <input type="file">
 * @param tipeFoto - 'hero' | 'produk' | 'tentang-kami' | 'galeri-produk' | 'logo'
 * @returns URL publik file yang sudah di-upload
 * @throws Error jika kompresi atau upload gagal
 */
export async function prosesDanUploadFoto(
  file: File,
  tipeFoto: TipeFoto
): Promise<string> {
  // 1. Kompresi client-side (Canvas API → WebP)
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