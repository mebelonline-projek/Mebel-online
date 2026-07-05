-- ============================================================
-- FIX: Change Password — Hash password baru dengan extensions.crypt()
-- ============================================================
-- Masalah: API route change-password menggunakan bcryptjs yang
-- menghasilkan hash $2b$12$... tidak kompatibel dengan
-- extensions.crypt() yang menghasilkan $2a$12$...
--
-- Solusi: Buat DB function hash_admin_password yang menggunakan
-- extensions.crypt() + extensions.gen_salt('bf', 12)
--
-- CARA JALANKAN:
--   1. Supabase Dashboard → SQL Editor
--   2. Copy-paste seluruh script ini
--   3. Klik "Run"
-- ============================================================

-- 1. Buat function hash_admin_password
CREATE OR REPLACE FUNCTION public.hash_admin_password(
  p_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog, pg_temp, public'
AS $$
BEGIN
  RETURN extensions.crypt(p_password, extensions.gen_salt('bf', 12));
END;
$$;

-- 2. Permissions
GRANT EXECUTE ON FUNCTION public.hash_admin_password(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.hash_admin_password(text) FROM anon, authenticated;

-- 3. Test: harus return hash $2a$12$...
SELECT 'TEST HASH' AS test, public.hash_admin_password('password123') AS hash;

-- 4. Verifikasi: hash harus bisa diverifikasi oleh verify_admin_password
SELECT 'TEST VERIFY' AS test, * FROM public.verify_admin_password('mebelonline111@gmail.com', 'password123');