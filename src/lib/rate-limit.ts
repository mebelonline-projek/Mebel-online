/**
 * Rate limiter berbasis database (Supabase).
 * Data persist meski server restart — cocok untuk Vercel serverless.
 *
 * Untuk production multi-instance skala besar, ganti dengan Redis/Vercel KV.
 */

import { getSupabase } from "./supabase";

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

/**
 * Generate UUID v4 sederhana (tanpa crypto.webcrypto dependency)
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Membuat rate limiter function.
 * Otomatis membersihkan entry expired setiap 5 menit.
 *
 * @param windowMs - Jendela waktu dalam milidetik
 * @param maxRequests - Maksimum request dalam jendela waktu
 * @returns Function yang return { allowed, remaining }
 */
export function createRateLimiter({ windowMs, maxRequests }: RateLimiterConfig) {
  return async (identifier: string, action: string): Promise<{ allowed: boolean; remaining: number }> => {
    try {
      const now = new Date();
      const supabase = getSupabase();

      // Cari record yang sudah ada
      const { data: existing } = await supabase
        .from("RateLimit")
        .select("*")
        .eq("identifier", identifier)
        .eq("action", action)
        .single();

      if (!existing || new Date(existing.expiresAt) <= now) {
        // Buat baru (atau reset) — hapus dulu record lama jika ada
        if (existing) {
          await supabase
            .from("RateLimit")
            .delete()
            .eq("id", existing.id);
        }

        const { error } = await supabase.from("RateLimit").insert({
          id: generateUUID(),
          identifier,
          action,
          count: 1,
          expiresAt: new Date(now.getTime() + windowMs).toISOString(),
        });

        if (error) {
          console.error("Rate limiter insert error:", error);
          return { allowed: true, remaining: maxRequests };
        }

        return { allowed: true, remaining: maxRequests - 1 };
      }

      if (existing.count >= maxRequests) {
        return { allowed: false, remaining: 0 };
      }

      // Increment counter
      const { error: updateError } = await supabase
        .from("RateLimit")
        .update({ count: existing.count + 1 })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Rate limiter update error:", updateError);
        return { allowed: true, remaining: maxRequests };
      }

      return { allowed: true, remaining: maxRequests - existing.count - 1 };
    } catch (error) {
      // Kalau database error, izinkan request (fail open)
      console.error("Rate limiter error:", error);
      return { allowed: true, remaining: maxRequests };
    }
  };
}

// Hapus entry expired setiap 5 menit (hanya jalan di server non-serverless)
if (typeof setInterval !== "undefined") {
  setInterval(async () => {
    try {
      await getSupabase()
        .from("RateLimit")
        .delete()
        .lte("expiresAt", new Date().toISOString());
    } catch {
      // Silent fail
    }
  }, 5 * 60 * 1000);
}

// Rate limiter presets
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 menit
  maxRequests: 5,
});

export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 menit
  maxRequests: 3,
});

// Rate limiter untuk endpoint publik (produk, kategori, dll)
export const publicApiRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 menit
  maxRequests: 60, // 60 request per menit
});