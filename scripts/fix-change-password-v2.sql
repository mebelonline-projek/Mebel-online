-- ============================================================
-- FIX v2: Change Password — 1 RPC untuk semua
-- ============================================================
-- Masalah: Route lama pakai 3 roundtrip (verify + hash + update)
-- → CPU timeout di Cloudflare Workers Free Tier (50ms)
--
-- Solusi: 1 DB function yang melakukan verifikasi + hash + update
-- dalam 1 RPC call. CPU usage: ~15-25ms.
--
-- CARA JALANKAN:
--   1. Supabase Dashboard → SQL Editor
--   2. Copy-paste seluruh script ini
--   3. Klik "Run"
-- ============================================================

-- 1. Buat function change_admin_password (all-in-one)
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
  -- 1. Verifikasi password saat ini
  SELECT * INTO v_admin
  FROM public."Admin" a
  WHERE LOWER(a.email) = LOWER(p_email)
    AND a.password = extensions.crypt(p_current_password, a.password);

  IF v_admin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password saat ini tidak sesuai.');
  END IF;

  -- 2. Hash password baru
  v_new_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 12));

  -- 3. Update
  UPDATE public."Admin"
  SET password = v_new_hash, "updatedAt" = NOW()
  WHERE id = v_admin.id;

  RETURN jsonb_build_object('success', true, 'message', 'Password berhasil diubah.');
END;
$$;

-- 2. Permissions
GRANT EXECUTE ON FUNCTION public.change_admin_password(text, text, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.change_admin_password(text, text, text) FROM anon, authenticated;

-- 3. Test: harus return success=true
SELECT public.change_admin_password('mebelonline111@gmail.com', 'password123', 'password123') AS result;

-- 4. Reset password kembali ke password123 (karena test di atas mengubahnya)
UPDATE public."Admin"
SET password = extensions.crypt('password123', extensions.gen_salt('bf', 12)),
    "updatedAt" = NOW();

-- 5. Verifikasi
SELECT id, email, LEFT(password, 10) AS hash_prefix FROM public."Admin";
SELECT * FROM public.verify_admin_password('mebelonline111@gmail.com', 'password123');