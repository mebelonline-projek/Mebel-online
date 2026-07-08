-- ============================================================
-- RESET PASSWORD ADMIN
-- ============================================================
-- Masalah: Password hash lama (bcryptjs $2b$12$...) tidak kompatibel
-- dengan extensions.crypt() (menghasilkan $2a$12$...).
-- extensions.crypt() tidak bisa memverifikasi hash $2b$ format.
--
-- CARA JALANKAN:
--   1. Supabase Dashboard → SQL Editor
--   2. Copy-paste seluruh script ini
--   3. Klik "Run"
-- ============================================================

-- 1. Cek admin yang ada di database
SELECT id, email, name, 
       LEFT(password, 10) AS hash_prefix, 
       LENGTH(password) AS hash_length,
       "createdAt"
FROM public."Admin"
ORDER BY "createdAt";

-- 2. Reset SEMUA password admin ke 'password123'
-- Menggunakan extensions.crypt() + extensions.gen_salt('bf', 12)
-- Hash baru akan berformat $2a$12$... (kompatibel dengan extensions.crypt)
UPDATE public."Admin"
SET password = extensions.crypt('password123', extensions.gen_salt('bf', 12)),
    "updatedAt" = NOW();

-- 3. Verifikasi: test login harus return 1 row
SELECT 'TEST LOGIN' AS test, * FROM public.verify_admin_password('mebelonline111@gmail.com', 'password123');

-- 4. Verifikasi: test login admin kedua
SELECT 'TEST LOGIN 2' AS test, * FROM public.verify_admin_password('admin@example.com', 'password123');

-- 5. Cek hash baru — harus $2a$12$... (bukan $2b$12$...)
SELECT id, email, 
       LEFT(password, 10) AS hash_prefix,
       LENGTH(password) AS hash_length
FROM public."Admin";