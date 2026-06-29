/**
 * Batch Re-compress Images — Scan semua file di bucket Supabase dan kompres yang belum optimal.
 *
 * ## Cara Kerja
 * 1. List SEMUA file di semua folder dalam bucket Supabase Storage
 * 2. Download, cek format & ukuran
 * 3. Skip jika: sudah WebP + ukuran di bawah threshold
 * 4. Kompres ke WebP pakai sharp jika: JPEG/PNG/besar
 * 5. Upload ulang dengan nama file SAMA (upsert) → URL tidak berubah
 *
 * ## Cara Menjalankan
 *   node scripts/recompress-images.mjs
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
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
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
const bucket =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "furniture-images";

if (!supabaseUrl || !serviceKey) {
  console.error(
    "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_KEY harus di-set di .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ── Konfigurasi Kompresi per Folder ────────────────────────────────────
const COMPRESS_CONFIG = {
  products: { maxWidth: 800, maxHeight: 600, quality: 75 },
  variants: { maxWidth: 800, maxHeight: 600, quality: 75 },
  hero: { maxWidth: 1600, maxHeight: 1200, quality: 80 },
  "tentang-kami": { maxWidth: 1024, maxHeight: 768, quality: 75 },
  settings: { maxWidth: 512, maxHeight: 384, quality: 80 },
  logo: { maxWidth: 512, maxHeight: 384, quality: 80 },
  general: { maxWidth: 1200, maxHeight: 900, quality: 75 },
};

// ── Threshold Skip ─────────────────────────────────────────────────────
// Gambar WebP di bawah threshold TIDAK akan dikompres ulang
const COMPRESS_THRESHOLD = {
  products: 135 * 1024, // 135 KB
  variants: 135 * 1024,
  hero: 525 * 1024, // 525 KB
  "tentang-kami": 270 * 1024, // 270 KB
  settings: 75 * 1024, // 75 KB
  logo: 75 * 1024,
  general: 500 * 1024,
};

// ── Statistik ──────────────────────────────────────────────────────────
const stats = {
  total: 0,
  success: 0,
  skipped: 0,
  failed: 0,
  bytesBefore: 0,
  bytesAfter: 0,
};

/**
 * Cek apakah gambar sudah optimal → tidak perlu dikompres ulang.
 */
function shouldSkip(buffer, filePath, folder) {
  const threshold = COMPRESS_THRESHOLD[folder] || COMPRESS_THRESHOLD.general;
  const isWebp = filePath.toLowerCase().endsWith(".webp");
  return isWebp && buffer.length <= threshold;
}

/**
 * List semua file di bucket secara rekursif.
 */
async function listAllFiles() {
  const { data: rootItems, error: rootErr } = await supabase.storage
    .from(bucket)
    .list();

  if (rootErr) {
    console.error("❌ Gagal list root bucket:", rootErr.message);
    return [];
  }

  const allFiles = [];

  for (const item of rootItems) {
    if (item.id === null) {
      // Ini folder
      const { data: folderItems, error: folderErr } = await supabase.storage
        .from(bucket)
        .list(item.name, { limit: 1000 });

      if (folderErr) {
        console.warn(`⚠️  Gagal list folder ${item.name}:`, folderErr.message);
        continue;
      }

      for (const f of folderItems) {
        // Skip placeholder & folder dalam folder
        if (f.name.startsWith(".")) continue;
        if (f.id === null) continue;
        allFiles.push(`${item.name}/${f.name}`);
      }
    } else {
      // File di root
      if (!item.name.startsWith(".")) {
        allFiles.push(item.name);
      }
    }
  }

  return allFiles;
}

/**
 * Download gambar dari Supabase sebagai buffer.
 */
async function downloadFile(filePath) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) {
    console.error(`  ❌ Gagal download ${filePath}: ${error.message}`);
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Kompres gambar dengan sharp → WebP.
 */
async function compressImage(buffer, folder) {
  const config = COMPRESS_CONFIG[folder] || COMPRESS_CONFIG.general;

  try {
    const result = await sharp(buffer)
      .resize(config.maxWidth, config.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: config.quality })
      .toBuffer();

    return result;
  } catch (err) {
    console.error(`  ❌ Gagal kompres: ${err.message}`);
    return null;
  }
}

/**
 * Upload ulang dengan upsert (timpa file lama).
 */
async function uploadFile(filePath, buffer) {
  const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "public, max-age=31536000, immutable",
  });

  if (error) {
    console.error(`  ❌ Gagal upload ${filePath}: ${error.message}`);
    return false;
  }
  return true;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Batch Re-compress Images — Mulai...\n");
  console.log(`   Bucket: ${bucket}`);
  console.log(`   Supabase: ${supabaseUrl}\n`);

  console.log("📊 Scan semua file di bucket (rekursif)...\n");
  const allFiles = await listAllFiles();

  // Filter hanya file gambar
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];
  const imageFiles = allFiles.filter((f) => {
    const lower = f.toLowerCase();
    return imageExtensions.some((ext) => lower.endsWith(ext));
  });

  console.log(`📸 Ditemukan ${imageFiles.length} file gambar dari ${allFiles.length} total file.\n`);
  stats.total = imageFiles.length;

  for (let i = 0; i < imageFiles.length; i++) {
    const filePath = imageFiles[i];
    const progress = `[${i + 1}/${imageFiles.length}]`;
    const folder = filePath.split("/")[0] || "general";

    console.log(`${progress} ${filePath}`);
    console.log(`       Folder: ${folder}`);

    // Download
    const buffer = await downloadFile(filePath);
    if (!buffer) {
      stats.failed++;
      continue;
    }

    const sizeKB = (buffer.length / 1024).toFixed(2);
    console.log(`       Ukuran: ${sizeKB} KB | Format: ${filePath.split(".").pop()?.toLowerCase()}`);

    stats.bytesBefore += buffer.length;

    // Skip gambar yang sudah optimal
    if (shouldSkip(buffer, filePath, folder)) {
      stats.skipped++;
      console.log(`       ⏭️  Lewati: sudah WebP + ukuran di bawah threshold\n`);
      continue;
    }

    // Kompres
    const compressed = await compressImage(buffer, folder);
    if (!compressed) {
      stats.failed++;
      continue;
    }

    stats.bytesAfter += compressed.length;
    const savings =
      buffer.length > 0
        ? ((1 - compressed.length / buffer.length) * 100).toFixed(1)
        : "0.0";
    console.log(
      `       Hasil: ${(compressed.length / 1024).toFixed(2)} KB (hemat ${savings}%)`
    );

    // Upload upsert
    const uploaded = await uploadFile(filePath, compressed);
    if (!uploaded) {
      stats.failed++;
      continue;
    }

    stats.success++;
    console.log(`       ✅ Upload berhasil (upsert)\n`);

    // Jeda 200ms antar request
    await new Promise((r) => setTimeout(r, 200));
  }

  // ── Ringkasan ────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════════════");
  console.log("📊 RINGKASAN AKHIR");
  console.log("════════════════════════════════════════════════════════");
  console.log(`   Total file gambar: ${stats.total}`);
  console.log(`   ✅ Dikompres:      ${stats.success}`);
  console.log(`   ⏭️  Dilewati:       ${stats.skipped}`);
  console.log(`   ❌ Gagal:          ${stats.failed}`);
  console.log(
    `   Ukuran sebelum:    ${(stats.bytesBefore / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `   Ukuran setelah:    ${(stats.bytesAfter / 1024 / 1024).toFixed(2)} MB`
  );
  const totalSavings =
    stats.bytesBefore > 0
      ? ((1 - stats.bytesAfter / stats.bytesBefore) * 100).toFixed(1)
      : "0.0";
  console.log(`   Total hemat:       ${totalSavings}%`);
  console.log("════════════════════════════════════════════════════════\n");

  if (stats.failed > 0) {
    console.log(`⚠️  ${stats.failed} gambar gagal diproses. Periksa log di atas.\n`);
  }

  if (stats.success > 0) {
    console.log(
      `✅ Selesai! ${stats.success} gambar berhasil dikompres ulang.\n`
    );
  }

  console.log(
    "💡 URL di database tidak berubah karena pakai upsert dengan nama file sama."
  );
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});