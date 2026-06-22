-- ============================================================
-- FIX SCRIPT: Perbaikan Struktur Tabel
-- Project: Mebel Online (mebelonline.id)
-- Jalan kan di Supabase SQL Editor:
--    https://supabase.com/dashboard/project/xczbowaotnvzduikgdad/sql/new
-- ============================================================

-- 1. FIX: Tabel PasswordResetToken — tambah default UUID untuk kolom id
ALTER TABLE "PasswordResetToken" 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. FIX: Tabel RateLimit — tambah unique constraint identifier_action
-- Hapus constraint lama jika ada
ALTER TABLE "RateLimit" DROP CONSTRAINT IF EXISTS "RateLimit_identifier_action_key";
-- Tambah unique constraint baru
ALTER TABLE "RateLimit" ADD CONSTRAINT "RateLimit_identifier_action_key" UNIQUE (identifier, action);

-- 3. PASTIKAN kolom expiresAt pakai timestamptz (bukan text)
ALTER TABLE "PasswordResetToken" 
  ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ USING "expiresAt"::TIMESTAMPTZ,
  ALTER COLUMN "expiresAt" SET DEFAULT NOW();

ALTER TABLE "RateLimit"
  ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ USING "expiresAt"::TIMESTAMPTZ;

-- ============================================================
-- CEK STATUS: Tabel yang seharusnya ada
-- ============================================================
-- Admin, Category, Product, SiteConfig, PasswordResetToken, RateLimit
-- 
-- Jika tabel Admin belum punya kolom createdAt / updatedAt:
ALTER TABLE "Admin" 
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

SELECT '✅ FIX SELESAI!' AS status;