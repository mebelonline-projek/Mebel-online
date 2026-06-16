/**
 * In-memory rate limiter.
 * Sederhana, cukup untuk single-server deployment.
 * Untuk production dengan banyak instance, ganti dengan Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Bersihkan entry expired setiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

/**
 * Membuat rate limiter function.
 *
 * @param windowMs - Jendela waktu dalam milidetik
 * @param maxRequests - Maksimum request dalam jendela waktu
 * @returns Function yang return true jika rate limit terpenuhi, false jika belum
 */
export function createRateLimiter({ windowMs, maxRequests }: RateLimiterConfig) {
  return (identifier: string): { allowed: boolean; remaining: number } => {
    const now = Date.now();
    const entry = store.get(identifier);

    if (!entry || entry.resetAt <= now) {
      // Reset atau buat entry baru
      store.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: maxRequests - entry.count };
  };
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
