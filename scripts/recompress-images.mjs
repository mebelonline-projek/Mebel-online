/**
 * Batch Re-compress Images — Script untuk mengompres ulang gambar yang sudah ada.
 *
 * ## Cara Kerja
 * 1. Ambil semua URL gambar dari database (produk, site_config)
 * 2. Download dari Supabase Storage
 * 3. Kompres ke WebP pakai sharp
 * 4. Upload ulang dengan nama file SAMA (upsert) → URL di database TIDAK BERUBAH
 *
 * ## Cara Menjalankan
 *   node scripts/recompress-images.mjs
 *
 * ## Prasyarat
 *   - File .env.local / .env harus berisi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_KEY
 *   - sharp harus terinstall (`npm install sharp`)
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env.local ────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const envPaths = [
    resolve(__dirname, "..", ".env.local"),
    resolve(__dirname, "..", ".env"),
  ];
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        // Hapus quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}
loadEnv();

// ── Validasi env ───────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "furniture-images";

if (!supabaseUrl || !serviceKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_KEY harus di-set di .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ── Konfigurasi Kompresi per Tipe ──────────────────────────────────────
const COMPRESS_CONFIG = {
  hero: { maxWidth: 1600, maxHeight: 1200, quality: 80 },
  produk: { maxWidth: 800, maxHeight: 600, quality: 75 },
  "tentang-kami": { maxWidth: 1024, maxHeight: 768, quality: 75 },
  logo: { maxWidth: 512, maxHeight: 384, quality: 80 },
  general: { maxWidth: 1200, maxHeight: 900, quality: 75 },
};

// ── Threshold Skip ────────────────────────────────────────────────────
// Gambar yang sudah WebP dan ukuran di bawah threshold TIDAK akan dikompres ulang.
// Ini melindungi 70% gambar yang sudah optimal dari client-side compression.
const COMPRESS_THRESHOLD = {
  hero: 350 * 1024 * 1.5,         // 525 KB
  produk: 90 * 1024 * 1.5,        // 135 KB
  "tentang-kami": 180 * 1024 * 1.5, // 270 KB
  logo: 50 * 1024 * 1.5,          // 75 KB
  general: 500 * 1024,             // 500 KB
};

/**
 * Deteksi tipe gambar berdasarkan path folder di Supabase Storage URL.
 */
function detectType(url) {
  if (!url) return "general";
  if (url.includes("/hero/")) return "hero";
  if (url.includes("/products/") || url.includes("/variants/")) return "produk";
  if (url.includes("/tentang-kami/")) return "tentang-kami";
  if (url.includes("/settings/")) return "logo";
  return "general";
}

/**
 * Cek apakah gambar sudah optimal (WebP + ukuran kecil) → tidak perlu dikompres ulang.
 * Melindungi 70% gambar yang sudah bagus dari client-side compression.
 */
function shouldSkip(buffer, path, type) {
  const threshold = COMPRESS_THRESHOLD[type] || COMPRESS_THRESHOLD.general;
  const isWebp = path.toLowerCase().endsWith(".webp");
  return isWebp && buffer.length <= threshold;
}

// ── Statistik ───────────────────────────────────────────────────────────
const stats = { total: 0, success: 0, skipped: 0, failed: 0, bytesBefore: 0, bytesAfter: 0 };

/**
 * Ekstrak path dari Supabase public URL.
 * Input:  https://xxx.supabase.co/storage/v1/object/public/bucket/hero/file.webp
 * Output: hero/file.webp
 */
function extractPath(url) {
  const publicPrefix = `${supabaseUrl}/storage/v1/object/public/`;
  if (!url.startsWith(publicPrefix)) return null;
  const objectPath = url.slice(publicPrefix.length);
  const parts = objectPath.split("/");
  // Remove bucket name (first part)
  return parts.slice(1).join("/");
}

/**
 * Download gambar dari Supabase sebagai buffer.
 */
async function downloadImage(url) {
  const path = extractPath(url);
  if (!path) {
    console.warn(`  ⚠️ Bukan URL Supabase, skip: ${url.slice(0, 60)}...`);
    return null;
  }

  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) {
    console.error(`  ❌ Gagal download ${path}: ${error.message}`);
    return null;
  }

  return { buffer: Buffer.from(await data.arrayBuffer()), path };
}

/**
 * Kompres gambar dengan sharp.
 *
 * PENTING: Nama file TIDAK diubah (tidak rename ke .webp).
 * Ini memastikan URL di database tetap sama setelah upsert.
 * Browser tetap bisa render karena mendeteksi format dari magic bytes,
 * bukan dari ekstensi file.
 */
async function compressImage(buffer, path, type) {
  const config = COMPRESS_CONFIG[type] || COMPRESS_CONFIG.general;

  try {
    const result = await sharp(buffer)
      .resize(config.maxWidth, config.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: config.quality })
      .toBuffer();

    // JANGAN ubah ekstensi — pakai nama file persis sama (URL di DB tidak berubah)
    return { buffer: result, path };
  } catch (err) {
    console.error(`  ❌ Gagal kompres ${path}: ${err.message}`);
    return null;
  }
}

/**
 * Upload ulang dengan upsert (timpa file lama).
 */
async function uploadImage(buffer, path) {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "public, max-age=31536000, immutable",
  });

  if (error) {
    console.error(`  ❌ Gagal upload ${path}: ${error.message}`);
    return false;
  }
  return true;
}

// ── Koleksi URL dari Database ──────────────────────────────────────────

async function collectUrls() {
  const urls = new Map(); // url → { type, source }

  console.log("📊 Mengumpulkan URL gambar dari database...\n");

  // 1. SiteConfig — site_logo, hero_image, about_image
  const { data: siteConfigs, error: scErr } = await supabase
    .from("SiteConfig")
    .select("key, value");
  if (scErr) {
    console.error("❌ Gagal ambil SiteConfig:", scErr.message);
  } else {
    const imageFields = ["site_logo", "hero_image", "about_image"];
    for (const row of siteConfigs) {
      if (imageFields.includes(row.key) && row.value && row.value.includes("supabase.co")) {
        const type = row.key === "site_logo" ? "logo" : row.key === "hero_image" ? "hero" : "tentang-kami";
        if (!urls.has(row.value)) {
          urls.set(row.value, { type, source: `SiteConfig.${row.key}` });
        }
      }
    }
  }

  // 2. Products — image + images[]
  const { data: products, error: prodErr } = await supabase
    .from("Product")
    .select("id, name, image, images");
  if (prodErr) {
    console.error("❌ Gagal ambil Product:", prodErr.message);
  } else {
    for (const p of products) {
      if (p.image && p.image.includes("supabase.co") && !urls.has(p.image)) {
        urls.set(p.image, { type: "produk", source: `Product(${p.name}).image` });
      }
      if (Array.isArray(p.images)) {
        for (const img of p.images) {
          if (img && img.includes("supabase.co") && !urls.has(img)) {
            urls.set(img, { type: "produk", source: `Product(${p.name}).images[]` });
          }
        }
      }
    }
  }

  // 3. Categories — image
  const { data: categories, error: catErr } = await supabase
    .from("Category")
    .select("id, name, image");
  if (catErr) {
    console.error("❌ Gagal ambil Category:", catErr.message);
  } else {
    for (const c of categories) {
      if (c.image && c.image.includes("supabase.co") && !urls.has(c.image)) {
        urls.set(c.image, { type: "general", source: `Category(${c.name}).image` });
      }
    }
  }

  return urls;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Batch Re-compress Images — Mulai...\n");
  console.log(`   Bucket: ${bucket}`);
  console.log(`   Supabase: ${supabaseUrl}\n`);

  const urls = await collectUrls();
  console.log(`📸 Ditemukan ${urls.size} URL gambar unik.\n`);

  stats.total = urls.size;

  let i = 0;
  for (const [url, info] of urls) {
    i++;
    const progress = `[${i}/${urls.size}]`;
    console.log(`${progress} ${info.source}`);
    console.log(`       URL: ${url.slice(0, 80)}...`);

    // Download
    const downloaded = await downloadImage(url);
    if (!downloaded) {
      stats.failed++;
      continue;
    }

    stats.bytesBefore += downloaded.buffer.length;

    // Deteksi tipe berdasarkan folder path
    const detectedType = detectType(url);
    const type = info.type !== "general" ? info.type : detectedType;
    console.log(`       Tipe: ${type} | Ukuran asli: ${(downloaded.buffer.length / 1024).toFixed(2)} KB`);

    // Skip gambar yang sudah optimal (WebP + ukuran kecil)
    if (shouldSkip(downloaded.buffer, downloaded.path, type)) {
      stats.skipped++;
      console.log(`       ⏭️  Lewati: sudah WebP + ukuran di bawah threshold\n`);
      continue;
    }

    // Kompres
    const compressed = await compressImage(downloaded.buffer, downloaded.path, type);
    if (!compressed) {
      stats.failed++;
      continue;
    }

    stats.bytesAfter += compressed.buffer.length;
    const savings = downloaded.buffer.length > 0
      ? ((1 - compressed.buffer.length / downloaded.buffer.length) * 100).toFixed(1)
      : "0.0";
    console.log(`       Hasil kompresi: ${(compressed.buffer.length / 1024).toFixed(2)} KB (hemat ${savings}%)`);

    // Upload upsert
    const uploaded = await uploadImage(compressed.buffer, compressed.path);
    if (!uploaded) {
      stats.failed++;
      continue;
    }

    stats.success++;
    console.log(`       ✅ Upload berhasil (upsert)\n`);

    // Jeda kecil antar request (rate limiting)
    await new Promise((r) => setTimeout(r, 200));
  }

  // ── Ringkasan ────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════════════");
  console.log("📊 RINGKASAN");
  console.log("════════════════════════════════════════════════════════");
  console.log(`   Total URL:     ${stats.total}`);
  console.log(`   Berhasil:      ${stats.success}`);
  console.log(`   Gagal:         ${stats.failed}`);
  console.log(`   Skip:          ${stats.skipped}`);
  console.log(`   Ukuran sebelum: ${(stats.bytesBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Ukuran setelah: ${(stats.bytesAfter / 1024 / 1024).toFixed(2)} MB`);
  const totalSavings = stats.bytesBefore > 0
    ? ((1 - stats.bytesAfter / stats.bytesBefore) * 100).toFixed(1)
    : "0.0";
  console.log(`   Total hemat:    ${totalSavings}%`);
  console.log("════════════════════════════════════════════════════════\n");

  if (stats.failed > 0) {
    console.log("⚠️  Beberapa gambar gagal diproses. Periksa log di atas.\n");
    process.exit(1);
  }

  console.log("✅ Selesai! Semua gambar berhasil dikompres ulang.\n");
  console.log("💡 Tips: Karena pakai upsert (nama file sama), URL di database TIDAK berubah.");
  console.log("   Tidak perlu update database. Cukup deploy ulang agar CDN cache refresh.\n");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});