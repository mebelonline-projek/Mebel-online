-- ============================================================
-- RESET PASSWORD SETELAH UBAH SANDI GAGAL
-- ============================================================
-- Reset password admin kembali ke 'password123'
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- Reset password
UPDATE public."Admin"
SET password = extensions.crypt('password123', extensions.gen_salt('bf', 12)),
    "updatedAt" = NOW();

-- Verifikasi
SELECT id, email, name, LEFT(password, 10) AS hash_prefix
FROM public."Admin";

-- Test login
SELECT * FROM public.verify_admin_password('mebelonline111@gmail.com', 'password123');