-- ============================================================
-- CANONICAL AUTH — SATU-SATUNYA script auth untuk proyek ini
-- ============================================================
-- JANGAN jalankan script scripts/archive/fix-*.sql untuk auth.
-- File ini adalah single source of truth.
--
-- Functions:
--   verify_admin_password(p_email, p_password)
--   change_admin_password(p_email, p_current_password, p_new_password)
--   reset_admin_password(p_token, p_new_password)
--   get_dashboard_stats()
--
-- Aturan: hash password HANYA via extensions.crypt / gen_salt('bf', 12).
--          Jangan hash dengan bcryptjs di Cloudflare Worker.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ------------------------------------------------------------
-- 1. verify_admin_password
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.verify_admin_password(text, text);

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

-- ------------------------------------------------------------
-- 2. change_admin_password (verify + hash + update, 1 call)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.change_admin_password(
  p_email TEXT,
  p_current_password TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog, pg_temp, public'
AS $$
DECLARE
  v_admin RECORD;
  v_new_hash TEXT;
BEGIN
  IF p_new_password IS NULL OR char_length(p_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password baru minimal 8 karakter.');
  END IF;

  SELECT * INTO v_admin
  FROM public."Admin" a
  WHERE LOWER(a.email) = LOWER(p_email)
    AND a.password = extensions.crypt(p_current_password, a.password);

  IF v_admin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password saat ini tidak sesuai.');
  END IF;

  v_new_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 12));

  UPDATE public."Admin"
  SET password = v_new_hash, "updatedAt" = NOW()
  WHERE id = v_admin.id;

  RETURN jsonb_build_object('success', true, 'message', 'Password berhasil diubah.');
END;
$$;

-- ------------------------------------------------------------
-- 3b. hash_admin_password — for offline scripts (create-admin), not Worker login path
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hash_admin_password(
  p_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog, pg_temp, public'
AS $$
BEGIN
  IF p_password IS NULL OR char_length(p_password) < 8 THEN
    RAISE EXCEPTION 'Password minimal 8 karakter';
  END IF;
  RETURN extensions.crypt(p_password, extensions.gen_salt('bf', 12));
END;
$$;
CREATE OR REPLACE FUNCTION public.reset_admin_password(
  p_token TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog, pg_temp, public'
AS $$
DECLARE
  v_token RECORD;
  v_new_hash TEXT;
  v_updated INT;
BEGIN
  IF p_token IS NULL OR p_token = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token tidak valid.');
  END IF;

  IF p_new_password IS NULL OR char_length(p_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password minimal 8 karakter.');
  END IF;

  SELECT * INTO v_token
  FROM public."PasswordResetToken" t
  WHERE t.token = p_token;

  IF v_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token tidak valid.');
  END IF;

  IF v_token."expiresAt" < NOW() THEN
    DELETE FROM public."PasswordResetToken" WHERE id = v_token.id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token sudah kedaluwarsa. Silakan minta reset password lagi.'
    );
  END IF;

  v_new_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 12));

  UPDATE public."Admin"
  SET password = v_new_hash, "updatedAt" = NOW()
  WHERE LOWER(email) = LOWER(v_token.email);

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  DELETE FROM public."PasswordResetToken" WHERE id = v_token.id;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gagal mengupdate password.');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Password berhasil diubah. Silakan login dengan password baru.'
  );
END;
$$;

-- ------------------------------------------------------------
-- 4. get_dashboard_stats
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 5. Permissions — service_role only
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.change_admin_password(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.hash_admin_password(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO service_role;

REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.change_admin_password(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_admin_password(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hash_admin_password(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon, authenticated;

-- Re-grant service_role after REVOKE FROM PUBLIC (Supabase service_role is not superuser)
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.change_admin_password(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_admin_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.hash_admin_password(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO service_role;
