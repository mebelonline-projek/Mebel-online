-- ============================================
-- Fix: Hapus REVOKE FROM PUBLIC yang memblokir service_role
-- service_role di Supabase BUKAN superuser, jadi REVOKE FROM PUBLIC
-- benar-benar mencabut akses execute dari service_role
-- ============================================

-- 1. Re-create function dengan search_path yang benar
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

-- 2. GRANT EXECUTE kembali ke service_role (penting!)
GRANT EXECUTE ON FUNCTION verify_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO service_role;

-- 3. Hanya revoke dari anon & authenticated (JANGAN dari PUBLIC)
REVOKE EXECUTE ON FUNCTION verify_admin_password(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_dashboard_stats() FROM anon, authenticated;

-- 4. Hapus ALTER DEFAULT PRIVILEGES yang memblokir PUBLIC
-- (ini yang menyebabkan function baru otomatis di-revoke dari PUBLIC)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ============================================
-- DIAGNOSTIC: Jalankan query ini untuk verifikasi
-- ============================================
-- SELECT verify_admin_password('admin@example.com', 'password123');
-- SELECT * FROM get_dashboard_stats();