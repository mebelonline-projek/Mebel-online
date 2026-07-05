-- ============================================================
-- RESET PASSWORD FINAL
-- ============================================================
-- Reset password admin ke 'password123' dengan hash yang benar
-- ($2a$12$... dari extensions.crypt)
--
-- CARA JALANKAN:
--   1. Supabase Dashboard → SQL Editor
--   2. Copy-paste seluruh script ini
--   3. Klik "Run"
-- ============================================================

-- Reset password
UPDATE public."Admin"
SET password = extensions.crypt('password123', extensions.gen_salt('bf', 12)),
    "updatedAt" = NOW();

-- Verifikasi hash
SELECT id, email, name, LEFT(password, 10) AS hash_prefix, LENGTH(password) AS hash_length
FROM public."Admin";

-- Test login
SELECT 'TEST LOGIN' AS test, * FROM public.verify_admin_password('mebelonline111@gmail.com', 'password123');