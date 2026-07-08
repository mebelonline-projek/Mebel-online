-- ============================================================
-- FIX PERMISSIONS: Revoke akses anon & authenticated dari RPC functions
-- ============================================================
-- Masalah: REVOKE FROM anon, authenticated tidak berhasil karena
-- ada GRANT TO PUBLIC yang override, atau ALTER DEFAULT PRIVILEGES
-- yang auto-grant ke semua roles.
--
-- CARA JALANKAN:
--   1. Supabase Dashboard → SQL Editor
--   2. Copy-paste seluruh script ini
--   3. Klik "Run"
-- ============================================================

-- 1. Cabut akses dari PUBLIC (ini yang override REVOKE dari anon/authenticated)
REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM PUBLIC;

-- 2. Cabut akses dari anon & authenticated secara eksplisit
REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM authenticated;

-- 3. Pastikan service_role tetap punya akses
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO service_role;

-- 4. Fix default privileges agar function baru TIDAK auto-grant ke PUBLIC
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ============================================================
-- VERIFIKASI — harus: service_role=true, anon=false, authenticated=false
-- ============================================================
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
--   get_dashboard_stats   | anon          | false
--   get_dashboard_stats   | authenticated | false
--   get_dashboard_stats   | service_role  | true
--   verify_admin_password | anon          | false
--   verify_admin_password | authenticated | false
--   verify_admin_password | service_role  | true