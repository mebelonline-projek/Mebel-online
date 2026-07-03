/**
 * Cleanup Orphan Images — Hapus file di Supabase Storage yang tidak lagi direferensi database.
 *
 * Cek SEMUA folder (termasuk "hero actions", "products actions", dll) dan
 * SEMUA tabel yang menyimpan URL gambar (Product, Settings, Category).
 *
 * Jalankan:
 *   node scripts/cleanup-orphan-images.mjs          # dry-run (preview saja)
 *   node scripts/cleanup-orphan-images.mjs --delete  # hapus beneran
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──
const envPath = resolve(__dirname, "..", ".env.local");
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
    if (!process.env[key]) process.env[key] = value;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "furniture-images";

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_KEY di .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const isDryRun = !process.argv.includes("--delete");

/**
 * Ekstrak path storage dari URL Supabase.
 * URL: https://xxx.supabase.co/storage/v1/object/public/furniture-images/products/file.webp
 * → "products/file.webp"
 */
function extractStoragePath(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const publicIdx = pathParts.indexOf("public");
    if (publicIdx === -1) return null;
    const afterPublic = pathParts.slice(publicIdx + 1);
    if (afterPublic.length < 2) return null;
    return afterPublic.slice(1).join("/");
  } catch {
    return null;
  }
}

/**
 * Ekstrak semua URL gambar dari string (JSON array atau URL tunggal).
 */
function extractUrls(value) {
  const urls = [];
  if (!value || typeof value !== "string") return urls;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item === "string" && item.startsWith("http")) {
          urls.push(item);
        }
        if (typeof item === "object" && item !== null) {
          if (Array.isArray(item.images)) {
            for (const img of item.images) {
              if (typeof img === "string" && img.startsWith("http")) {
                urls.push(img);
              }
            }
          }
          if (typeof item.image === "string" && item.image.startsWith("http")) {
            urls.push(item.image);
          }
        }
      }
      return urls;
    }
  } catch {
    // Bukan JSON
  }

  if (value.startsWith("http")) {
    urls.push(value);
  }
  return urls;
}

/**
 * List semua file di SEMUA folder secara rekursif.
 */
async function listAllFiles() {
  const { data: rootItems, error } = await supabase.storage.from(bucket).list();
  if (error) {
    console.error("❌ Gagal list root:", error.message);
    return [];
  }

  const allFiles = [];
  const folderStats = {};

  for (const item of rootItems || []) {
    if (item.id === null) {
      // Folder — bisa nama biasa atau "nama actions"
      const folderName = item.name;
      const { data: files } = await supabase.storage.from(bucket).list(folderName, { limit: 1000 });
      let folderCount = 0;
      for (const f of files || []) {
        if (f.id !== null) {
          allFiles.push({
            path: `${folderName}/${f.name}`,
            size: f.metadata?.size || 0,
          });
          folderCount++;
        }
      }
      folderStats[folderName] = folderCount;
    } else {
      // Root file
      allFiles.push({
        path: item.name,
        size: item.metadata?.size || 0,
      });
    }
  }

  return { allFiles, folderStats };
}

async function main() {
  console.log("🧹 Cleanup Orphan Images (Komprehensif v2)");
  console.log(`   Mode: ${isDryRun ? "DRY RUN (preview)" : "DELETE (hapus beneran)"}`);
  console.log(`   Bucket: ${bucket}\n`);

  // ── 1. List SEMUA file di SEMUA folder ──
  console.log("📂 List SEMUA file di Supabase Storage...");
  const { allFiles, folderStats } = await listAllFiles();

  console.log(`   Total file di storage: ${allFiles.length}`);
  for (const [folder, count] of Object.entries(folderStats)) {
    console.log(`     "${folder}": ${count} files`);
  }
  console.log();

  // ── 2. Query SEMUA tabel yang menyimpan URL gambar ──
  console.log("🗄️  Query semua tabel yang menyimpan URL gambar...");
  const referencedPaths = new Set();

  // 2a. Product
  const { data: products } = await supabase
    .from("Product")
    .select("id, name, image, images, variants");

  let productImageCount = 0;
  for (const p of products || []) {
    for (const url of extractUrls(p.image)) {
      const path = extractStoragePath(url);
      if (path) { referencedPaths.add(path); productImageCount++; }
    }
    for (const url of extractUrls(p.images)) {
      const path = extractStoragePath(url);
      if (path) { referencedPaths.add(path); productImageCount++; }
    }
    for (const url of extractUrls(p.variants)) {
      const path = extractStoragePath(url);
      if (path) { referencedPaths.add(path); productImageCount++; }
    }
  }
  console.log(`   Product: ${(products || []).length} produk, ${productImageCount} path gambar`);

  // 2b. SiteConfig (settings: logo, hero_image, about_image, dll)
  const { data: siteConfig } = await supabase
    .from("SiteConfig")
    .select("key, value");

  let siteConfigImageCount = 0;
  for (const s of siteConfig || []) {
    for (const url of extractUrls(s.value)) {
      const path = extractStoragePath(url);
      if (path) { referencedPaths.add(path); siteConfigImageCount++; }
    }
  }
  console.log(`   SiteConfig: ${(siteConfig || []).length} entries, ${siteConfigImageCount} path gambar`);
  // Tampilkan detail untuk debug
  if (siteConfig) {
    for (const s of siteConfig) {
      if (s.value && typeof s.value === "string" && s.value.includes("supabase.co")) {
        console.log(`     ${s.key}: ${s.value.substring(0, 120)}`);
      }
    }
  }

  // 2c. Category
  try {
    const { data: categories } = await supabase
      .from("Category")
      .select("id, name, image");

    let catImageCount = 0;
    for (const c of categories || []) {
      for (const url of extractUrls(c.image)) {
        const path = extractStoragePath(url);
        if (path) { referencedPaths.add(path); catImageCount++; }
      }
    }
    console.log(`   Category: ${(categories || []).length} entries, ${catImageCount} path gambar`);
  } catch {
    console.log("   Category: tidak ada");
  }

  console.log(`\n📎 Total path gambar yang direferensi database: ${referencedPaths.size}\n`);

  // ── 3. Cari orphan ──
  const orphans = allFiles.filter((f) => !referencedPaths.has(f.path));

  console.log(`🔍 File orphan (tidak direferensi): ${orphans.length}\n`);

  if (orphans.length === 0) {
    console.log("✅ Tidak ada file orphan. Storage bersih!");
    return;
  }

  // ── 4. Tampilkan per folder ──
  const orphanByFolder = {};
  let totalOrphanSize = 0;
  for (const f of orphans) {
    const folder = f.path.split("/")[0] || "root";
    if (!orphanByFolder[folder]) orphanByFolder[folder] = [];
    orphanByFolder[folder].push(f);
    totalOrphanSize += f.size;
  }

  console.log("─── File Orphan per Folder ───");
  for (const [folder, files] of Object.entries(orphanByFolder)) {
    const folderSize = files.reduce((sum, f) => sum + f.size, 0);
    console.log(`\n  📁 "${folder}/" (${files.length} files, ${(folderSize / 1024 / 1024).toFixed(2)} MB)`);
    for (const f of files) {
      const sizeKB = f.size > 0 ? (f.size / 1024).toFixed(1) : "?";
      console.log(`     ${f.path.split("/").pop()} (${sizeKB} KB)`);
    }
  }

  console.log(`\n  Total orphan: ${orphans.length} files, ${(totalOrphanSize / 1024 / 1024).toFixed(2)} MB\n`);

  // ── 5. Hapus ──
  if (isDryRun) {
    console.log("💡 Ini DRY RUN. Untuk menghapus beneran, jalankan:");
    console.log("   node scripts/cleanup-orphan-images.mjs --delete");
    return;
  }

  console.log("🗑️  Menghapus file orphan...");
  const orphanPaths = orphans.map((f) => f.path);
  const { error: deleteErr } = await supabase.storage.from(bucket).remove(orphanPaths);

  if (deleteErr) {
    console.error("❌ Gagal hapus:", deleteErr.message);
    return;
  }

  console.log(`✅ Berhasil hapus ${orphans.length} file orphan (${(totalOrphanSize / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});