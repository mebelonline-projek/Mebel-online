-- ============================================
-- Optimasi Auth & Dashboard untuk Cloudflare Workers
-- Pindahkan bcrypt dari Worker ke Supabase (pgcrypto)
-- ============================================

-- 1. Enable pgcrypto extension (jika belum aktif)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 2. Function: verify_admin_password
-- Menggantikan SELECT + bcrypt.compare() di Worker
-- Input: email, password (plain text)
-- Output: data admin (id, email, name) jika password valid, NULL jika tidak
-- ============================================
CREATE OR REPLACE FUNCTION verify_admin_password(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog, pg_temp, public'
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.email, a.name
  FROM "Admin" a
  WHERE LOWER(a.email) = LOWER(p_email)
    AND a.password = crypt(p_password, a.password);
END;
$$;

-- Grant akses ke service_role (penting: service_role di Supabase BUKAN superuser)
GRANT EXECUTE ON FUNCTION verify_admin_password(text, text) TO service_role;
-- Revoke akses dari anon & authenticated (JANGAN dari PUBLIC — akan blokir service_role)
REVOKE EXECUTE ON FUNCTION verify_admin_password(text, text) FROM anon, authenticated;

-- ============================================
-- 3. Function: get_dashboard_stats
-- Menggantikan 2 query terpisah di /api/admin/dashboard-stats
-- Output: totalProducts, totalCategories, activeProducts, inactiveProducts
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
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
  SELECT COUNT(*) INTO v_total_products FROM "Product";
  SELECT COUNT(*) INTO v_total_categories FROM "Category";
  SELECT COUNT(*) INTO v_active_products FROM "Product" WHERE "isActive" = true;

  RETURN QUERY
  SELECT
    v_total_products AS "totalProducts",
    v_total_categories AS "totalCategories",
    v_active_products AS "activeProducts",
    (v_total_products - v_active_products) AS "inactiveProducts";
END;
$$;

-- Grant akses ke service_role (penting: service_role di Supabase BUKAN superuser)
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO service_role;
-- Revoke akses dari anon & authenticated (JANGAN dari PUBLIC — akan blokir service_role)
REVOKE EXECUTE ON FUNCTION get_dashboard_stats() FROM anon, authenticated;

-- ============================================
-- 4. Pastikan function baru tetap bisa diakses service_role
-- ============================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;
