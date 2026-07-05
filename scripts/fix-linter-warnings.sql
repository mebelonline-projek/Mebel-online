-- ============================================================
-- FIX LINTER WARNINGS: 4 WARNING → 0
-- ============================================================
-- Masalah:
--   WARN: anon_security_definer_function_executable (x2)
--   WARN: authenticated_security_definer_function_executable (x2)
--
-- Penyebab:
--   CREATE OR REPLACE FUNCTION me-reset permission ke default
--   (EXECUTE granted to PUBLIC), sehingga REVOKE sebelumnya
--   tidak efektif.
--
-- CARA JALANKAN:
--   1. Supabase Dashboard → SQL Editor
--   2. Copy-paste seluruh script ini
--   3. Klik "Run"
--
-- DAMPAK:
--   - anon & authenticated tidak bisa execute functions
--   - service_role tetap bisa execute (app tidak terganggu)
--   - Function TIDAK di-recreate, hanya permission yang diperbaiki
-- ============================================================

-- 1. Cabut akses dari anon & authenticated
REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM anon, authenticated;

-- 2. Pastikan service_role tetap bisa akses
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO service_role;

-- 3. Verifikasi permission
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