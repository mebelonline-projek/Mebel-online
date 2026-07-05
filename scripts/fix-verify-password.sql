-- ============================================================
-- FIX: verify_admin_password dengan extensions.crypt()
-- ============================================================
-- Script ini HANYA fix function verify_admin_password.
-- Tidak menyentuh tabel, function lain, atau permission apapun.
--
-- CARA JALANKAN:
--   1. Supabase Dashboard → SQL Editor
--   2. Copy-paste seluruh script ini
--   3. Klik "Run"
-- ============================================================

-- Re-create function dengan extensions.crypt() yang benar
CREATE OR REPLACE FUNCTION public.verify_admin_password(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id TEXT,
  email TEXT,
  name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog, pg_temp, public'
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id::TEXT, a.email, a.name
  FROM public."Admin" a
  WHERE LOWER(a.email) = LOWER(p_email)
    AND a.password = extensions.crypt(p_password, a.password);
END;
$$;

-- Pastikan permission tetap benar
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM anon, authenticated;

-- Test: harus return 1 row jika password benar
SELECT * FROM verify_admin_password('mebelonline111@gmail.com', 'password123');