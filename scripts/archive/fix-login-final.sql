-- ============================================================
-- FIX LOGIN ADMIN — Type Mismatch verify_admin_password
-- ============================================================
-- Masalah: Kolom id di tabel Admin bertipe TEXT, tapi function
--          verify_admin_password return type-nya UUID
-- Error:   42804: structure of query does not match function result type
-- 
-- CARA JALANKAN:
-- 1. Buka Supabase Dashboard: https://app.supabase.com
-- 2. Pilih project: xczbowaotnvzduikgdad
-- 3. Buka SQL Editor (menu kiri)
-- 4. Copy-paste seluruh script ini
-- 5. Klik "Run"
-- ============================================================

-- Step 1: Cek tipe kolom di tabel Admin (untuk konfirmasi)
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name='Admin' AND table_schema='public'
ORDER BY ordinal_position;

-- Step 2: Drop function lama yang punya type mismatch
DROP FUNCTION IF EXISTS public.verify_admin_password(text, text) CASCADE;

-- Step 3: Create function baru dengan return type TEXT (sesuai kolom id)
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

-- Step 4: Set permissions yang benar
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM anon, authenticated;

-- Step 5: Test function — harus return 1 row jika password benar
SELECT * FROM verify_admin_password('mebelonline111@gmail.com', 'password123');

-- Step 6: Test juga dengan admin kedua (jika ada)
SELECT * FROM verify_admin_password('admin@example.com', 'password123');

-- Step 7: Cek function get_dashboard_stats juga
SELECT * FROM get_dashboard_stats();