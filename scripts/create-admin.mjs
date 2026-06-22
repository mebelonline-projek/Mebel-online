#!/usr/bin/env node

/**
 * Script untuk membuat admin baru di Supabase.
 * 
 * Cara pakai:
 *   node scripts/create-admin.mjs
 * 
 * Atau dengan parameter langsung:
 *   node scripts/create-admin.mjs admin@example.com password123
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { createInterface } from "readline";
import { env } from "process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync, readFileSync } from "fs";

// Load .env.local
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        // Hapus kutipan
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!env[key]) {
          env[key] = value;
        }
      }
    }
  }
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

async function main() {
  const args = process.argv.slice(2);
  let emailArg = args[0] || "";
  let passwordArg = args[1] || "";
  let nameArg = args[2] || "";

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERROR: .env.local tidak ditemukan atau tidak lengkap.");
    console.error("   Pastikan file .env.local ada di root project dan berisi:");
    console.error("   NEXT_PUBLIC_SUPABASE_URL=...");
    console.error("   SUPABASE_SERVICE_KEY=...");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log(`\n🔌 Terhubung ke: ${supabaseUrl}`);

  // Cek apakah tabel Admin ada
  const { error: tableCheck } = await supabase
    .from("Admin")
    .select("id")
    .limit(1);

  if (tableCheck && tableCheck.message?.includes("does not exist")) {
    console.error("❌ Tabel 'Admin' belum ada di database.");
    console.error("\n📋 Buat tabel dulu di Supabase SQL Editor:");
    console.error(`
CREATE TABLE IF NOT EXISTS "Admin" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
    `);
    process.exit(1);
  }

  // Cek admin yang sudah ada
  const { data: admins } = await supabase
    .from("Admin")
    .select("id, email, name");

  console.log(`\n📊 Admin terdaftar: ${admins?.length || 0} user(s)`);
  if (admins && admins.length > 0) {
    for (const a of admins) {
      console.log(`   - ${a.email} (${a.name || "tanpa nama"})`);
    }

    const answer = await ask("\n🔑 Reset password admin yang sudah ada? (y/n): ");
    if (answer.toLowerCase() !== "y") {
      console.log("   Tidak ada perubahan. Selesai.");
      process.exit(0);
    }

    const targetEmail = (await ask("   Email admin yang akan di-reset: ")).toLowerCase().trim();
    const admin = admins.find((a) => a.email === targetEmail);
    if (!admin) {
      console.error(`❌ Admin "${targetEmail}" tidak ditemukan.`);
      process.exit(1);
    }

    const newPassword = passwordArg || await ask("   Password baru (min 6 karakter): ");
    if (newPassword.length < 6) {
      console.error("❌ Password minimal 6 karakter.");
      process.exit(1);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    const { error: updateErr } = await supabase
      .from("Admin")
      .update({ password: hashed })
      .eq("email", targetEmail);

    if (updateErr) {
      console.error("❌ Gagal update password:", updateErr.message);
      process.exit(1);
    }

    console.log(`\n✅ Password untuk ${targetEmail} berhasil di-reset!`);
    console.log(`   Email:    ${targetEmail}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`\n🔗 Login di: https://mebelonline.id/admin/login`);
    process.exit(0);
  }

  // Buat admin baru
  console.log("\n📝 Belum ada admin. Buat admin baru...");
  const name = nameArg || await ask("   Nama admin: ");
  const email = (emailArg || await ask("   Email admin: ")).toLowerCase().trim();
  const password = passwordArg || await ask("   Password (min 6 karakter): ");

  if (!email || !password || password.length < 6) {
    console.error("❌ Email dan password (min 6 karakter) wajib diisi.");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);
  const { error: insertErr } = await supabase
    .from("Admin")
    .insert({
      email,
      password: hashed,
      name: name || "Admin",
    });

  if (insertErr) {
    if (insertErr.message?.includes("duplicate")) {
      console.error(`❌ Email "${email}" sudah terdaftar.`);
    } else {
      console.error("❌ Gagal membuat admin:", insertErr.message);
    }
    process.exit(1);
  }

  console.log(`\n✅ Admin berhasil dibuat!`);
  console.log(`   Nama:     ${name || "Admin"}`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`\n🔗 Login di: https://mebelonline.id/admin/login`);

  rl.close();
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});