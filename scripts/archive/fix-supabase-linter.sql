-- ============================================================
-- FIX SUPABASE LINTER: 3 ERROR + 4 WARNING
-- ============================================================
-- Masalah:
--   ERROR: policy_exists_rls_disabled, rls_disabled_in_public,
--          sensitive_columns_exposed (semua di tabel Admin)
--   WARN:  anon_security_definer_function_executable (x2),
--          authenticated_security_definer_function_executable (x2)
--
-- CARA JALANKAN:
--   1. Supabase Dashboard → SQL Editor
--   2. Copy-paste seluruh script ini
--   3. Klik "Run"
--
-- DAMPAK:
--   - Tabel Admin: RLS di-enable, policy "Deny all" aktif
--   - RPC functions: hanya service_role yang bisa execute
--   - App TIDAK terganggu karena pakai service_role key
-- ============================================================

-- ============================================================
-- BAGIAN 0: DIAGNOSTIC — Cek nama tabel & kolom sebenarnya
-- ============================================================
-- Jalankan ini dulu untuk memastikan nama tabel di database kamu.
-- Jika hasil menunjukkan nama lowercase (product, category),
-- maka function di bawah sudah benar (unquoted = lowercase).
-- ============================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name ILIKE '%product%'
   OR table_name ILIKE '%category%'
   OR table_name ILIKE '%admin%'
ORDER BY table_name;

-- Cek nama kolom di tabel product (untuk konfirmasi isActive)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name ILIKE 'product'
ORDER BY ordinal_position;

-- ============================================================
-- BAGIAN 1: FIX 3 ERROR — Enable RLS di tabel Admin
-- ============================================================
-- Begitu RLS enabled, policy "Deny all" yang sudah ada langsung aktif.
-- service_role bypass RLS, jadi app tetap jalan normal.
-- ============================================================

ALTER TABLE public."Admin" ENABLE ROW LEVEL SECURITY;

-- Verifikasi RLS sudah enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'Admin';

-- ============================================================
-- BAGIAN 2: FIX 4 WARNING — Re-create functions + permissions
-- ============================================================
-- Re-create kedua function dengan:
--   - Return type TEXT (sesuai kolom id di tabel Admin)
--   - search_path yang benar (1 string, bukan 3 string terpisah)
--   - GRANT ke service_role DULU, baru REVOKE dari anon/authenticated
-- ============================================================

-- 2a. verify_admin_password
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

-- 2b. get_dashboard_stats
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

-- 2c. GRANT ke service_role (WAJIB dilakukan SEBELUM revoke dari PUBLIC)
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO service_role;

-- 2d. REVOKE dari anon & authenticated (JANGAN dari PUBLIC — akan blokir service_role)
REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM anon, authenticated;

-- 2e. Default privileges untuk function baru di masa depan
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ============================================================
-- BAGIAN 3: VERIFIKASI
-- ============================================================

-- 3a. Test login — harus return 1 row
SELECT * FROM verify_admin_password('mebelonline111@gmail.com', 'password123');

-- 3b. Test dashboard stats — harus return 1 row
SELECT * FROM get_dashboard_stats();

-- 3c. Cek RLS status
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'Admin';

-- 3d. Cek function permissions
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