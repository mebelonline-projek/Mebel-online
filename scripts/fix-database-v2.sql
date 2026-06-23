-- FIX SCRIPT v2: Perbaikan Bug Kritis
-- Jalankan di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xczbowaotnvzduikgdad/sql/new

-- 1. UNIQUE constraint untuk SiteConfig.key
-- (Tanpa ini, upsert dengan onConflict: "key" gagal error 500)
ALTER TABLE "SiteConfig" DROP CONSTRAINT IF EXISTS "SiteConfig_key_key";
ALTER TABLE "SiteConfig" ADD CONSTRAINT "SiteConfig_key_key" UNIQUE ("key");

-- 2. Fungsi RPC shift_category_sort_orders (opsional, pendekatan database-level)
CREATE OR REPLACE FUNCTION shift_category_sort_orders(
  p_exclude_id UUID,
  p_from_sort_order INT,
  p_to_sort_order INT,
  p_direction INT
)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_direction > 0 THEN
    UPDATE "Category" SET "sortOrder" = "sortOrder" + 1
    WHERE id != p_exclude_id
      AND "sortOrder" >= p_from_sort_order
      AND "sortOrder" < p_to_sort_order;
  ELSE
    UPDATE "Category" SET "sortOrder" = "sortOrder" - 1
    WHERE id != p_exclude_id
      AND "sortOrder" > p_to_sort_order
      AND "sortOrder" <= p_from_sort_order;
  END IF;
END;
$$;

-- 3. Fungsi RPC shift_product_sort_orders (opsional)
CREATE OR REPLACE FUNCTION shift_product_sort_orders(
  p_exclude_id UUID,
  p_from_sort_order INT,
  p_to_sort_order INT,
  p_direction INT
)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_direction > 0 THEN
    UPDATE "Product" SET "sortOrder" = "sortOrder" + 1
    WHERE id != p_exclude_id
      AND "sortOrder" >= p_from_sort_order
      AND "sortOrder" < p_to_sort_order;
  ELSE
    UPDATE "Product" SET "sortOrder" = "sortOrder" - 1
    WHERE id != p_exclude_id
      AND "sortOrder" > p_to_sort_order
      AND "sortOrder" <= p_from_sort_order;
  END IF;
END;
$$;

-- Verifikasi
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'SiteConfig' AND constraint_type = 'UNIQUE';

SELECT '✅ FIX v2 SELESAI! Jalankan ulang aplikasi setelah ini.' AS status;