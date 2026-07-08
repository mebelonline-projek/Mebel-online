-- ============================================================
-- FINAL FIX: verify_admin_password + get_dashboard_stats
-- ============================================================
-- Script ini memperbaiki KEDUA function yang di-overwrite oleh
-- fix-auth-functions.sql (versi rusak).
--
-- MASALAH:
--   fix-auth-functions.sql menggunakan:
--   1. Return type UUID untuk verify_admin_password (kolom id = TEXT) → type mismatch
--   2. crypt() tanpa prefix extensions. → function not found
--   3. Tabel name tanpa schema prefix → bisa ambigu
--
-- CARA JALANKAN:
--   1. Supabase Dashboard → SQL Editor
--   2. Copy-paste SELURUH script ini
--   3. Klik "Run"
--   4. Lihat bagian VERIFIKASI di bawah — pastikan semua test PASS
-- ============================================================

-- ============================================================
-- 1. FIX verify_admin_password
-- ============================================================
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

-- ============================================================
-- 2. FIX get_dashboard_stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  "totalProducts" BIGINT,
  "totalCategories" BIGINT,
  "activeProducts" BIGINT,
  "inactiveProducts" BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog, pg_temp, public'
AS $$
DECLARE
  v_total_products BIGINT;
  v_total_categories BIGINT;
  v_active_products BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_products FROM public."Product";
  SELECT COUNT(*) INTO v_total_categories FROM public."Category";
  SELECT COUNT(*) INTO v_active_products FROM public."Product" WHERE "isActive" = true;

  RETURN QUERY
  SELECT
    v_total_products AS "totalProducts",
    v_total_categories AS "totalCategories",
    v_active_products AS "activeProducts",
    (v_total_products - v_active_products) AS "inactiveProducts";
END;
$$;

-- ============================================================
-- 3. PERMISSIONS — GRANT ke service_role, REVOKE dari anon/authenticated
-- ============================================================
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO service_role;

REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM anon, authenticated;

-- ============================================================
-- 4. VERIFIKASI — Jalankan query di bawah untuk memastikan fix berhasil
-- ============================================================

-- 4a. Test login — harus return 1 row dengan data admin
SELECT 'TEST LOGIN' AS test, * FROM public.verify_admin_password('mebelonline111@gmail.com', 'password123');

-- 4b. Test login admin kedua — harus return 1 row
SELECT 'TEST LOGIN 2' AS test, * FROM public.verify_admin_password('admin@example.com', 'password123');

-- 4c. Test dashboard stats — harus return 1 row dengan angka
SELECT 'TEST STATS' AS test, * FROM public.get_dashboard_stats();

-- 4d. Cek function permissions — service_role=true, anon=false, authenticated=false
SELECT
  p.proname AS function_name,
  r.rolname AS role_name,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname IN ('verify_admin_password', 'get_dashboard_stats')
  AND r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY p.proname, r.rolname;
-- Expected:
--   verify_admin_password | anon          | false
--   verify_admin_password | authenticated | false
--   verify_admin_password | service_role  | true
--   get_dashboard_stats   | anon          | false
--   get_dashboard_stats   | authenticated | false
--   get_dashboard_stats   | service_role  | true