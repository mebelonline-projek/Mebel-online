/**
 * Cek storage Supabase — total file, ukuran per folder, sisa quota.
 * Jalankan: node scripts/check-storage.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
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

async function checkStorage() {
  const { data: rootItems, error } = await supabase.storage.from(bucket).list();
  if (error) {
    console.error("❌ Error:", error.message);
    return;
  }

  let totalFiles = 0;
  let totalSize = 0;
  const folderStats = {};

  for (const item of rootItems) {
    if (item.id === null) {
      // Folder
      const { data: files } = await supabase.storage.from(bucket).list(item.name, { limit: 1000 });
      let folderSize = 0;
      let folderCount = 0;
      if (files) {
        for (const f of files) {
          if (f.id !== null && f.metadata?.size) {
            folderSize += f.metadata.size;
            folderCount++;
          }
        }
      }
      folderStats[item.name] = { count: folderCount, size: folderSize };
      totalFiles += folderCount;
      totalSize += folderSize;
    } else {
      // Root file
      if (item.metadata?.size) {
        totalSize += item.metadata.size;
        totalFiles++;
      }
    }
  }

  console.log("=== Supabase Storage Stats ===");
  console.log("Bucket:", bucket);
  console.log("");
  for (const [folder, stats] of Object.entries(folderStats)) {
    console.log(`  ${folder}: ${stats.count} files, ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }
  console.log("");
  console.log("Total files:", totalFiles);
  console.log("Total size:", (totalSize / 1024 / 1024).toFixed(2), "MB");
  console.log("");
  console.log("Supabase Free tier limit: 1 GB");
  console.log("Used:", ((totalSize / 1024 / 1024 / 1024) * 100).toFixed(1) + "%");
  console.log("Free:", (1024 - totalSize / 1024 / 1024).toFixed(0), "MB remaining");
}

checkStorage();