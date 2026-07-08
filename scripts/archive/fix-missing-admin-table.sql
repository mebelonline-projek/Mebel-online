-- ============================================
-- FIX: Create HANYA Tabel Admin (yang missing)
-- Tabel lain & data tidak akan tersentuh
-- ============================================

-- Enable pgcrypto extension jika belum
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. CREATE ONLY Tabel Admin (yang missing)
-- ============================================
CREATE TABLE IF NOT EXISTS "Admin" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Admin',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create index untuk query by email
CREATE INDEX IF NOT EXISTS "idx_Admin_email" ON "Admin"(email);

-- ============================================
-- 2. Fix Functions (re-create dengan permissions benar)
-- ============================================

DROP FUNCTION IF EXISTS verify_admin_password(text, text) CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_stats() CASCADE;

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

-- ============================================
-- 3. Grant Permissions ke service_role
-- ============================================
GRANT EXECUTE ON FUNCTION verify_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO service_role;

-- Revoke dari anon & authenticated
REVOKE EXECUTE ON FUNCTION verify_admin_password(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_dashboard_stats() FROM anon, authenticated;

-- Pastikan function baru tetap accessible ke service_role
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ============================================
-- SELESAI — Tidak ada data yang dihapus!
-- ============================================
