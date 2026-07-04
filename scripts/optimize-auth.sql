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
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.email, a.name
  FROM "Admin" a
  WHERE LOWER(a.email) = LOWER(p_email)
    AND a.password = crypt(p_password, a.password);
END;
$$;

-- Revoke akses dari PUBLIC, anon & authenticated (dipanggil via service_role dari server)
-- PostgreSQL default GRANT EXECUTE ke PUBLIC saat CREATE OR REPLACE FUNCTION
REVOKE EXECUTE ON FUNCTION verify_admin_password(text, text) FROM PUBLIC;
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
SET search_path = ''
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

-- Revoke akses dari PUBLIC, anon & authenticated (dipanggil via service_role dari server)
-- PostgreSQL default GRANT EXECUTE ke PUBLIC saat CREATE OR REPLACE FUNCTION
REVOKE EXECUTE ON FUNCTION get_dashboard_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_dashboard_stats() FROM anon, authenticated;

-- ============================================
-- 4. Cegah auto-grant EXECUTE ke PUBLIC di masa depan
-- ============================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
