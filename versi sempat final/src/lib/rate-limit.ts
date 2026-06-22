/**
 * Rate limiter berbasis database (Prisma).
 * Data persist meski server restart — cocok untuk Vercel serverless.
 *
 * Untuk production multi-instance skala besar, ganti dengan Redis/Vercel KV.
 */

import { prisma } from "./prisma";

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
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
      const key = `${action}:${identifier}`;

      // Cari record yang ada
      const existing = await prisma.rateLimit.findUnique({
        where: { identifier_action: { identifier, action } },
      });

      if (!existing || existing.expiresAt <= now) {
        // Buat baru (atau reset)
        await prisma.rateLimit.upsert({
          where: { identifier_action: { identifier, action } },
          update: {
            count: 1,
            expiresAt: new Date(now.getTime() + windowMs),
          },
          create: {
            identifier,
            action,
            count: 1,
            expiresAt: new Date(now.getTime() + windowMs),
          },
        });
        return { allowed: true, remaining: maxRequests - 1 };
      }

      if (existing.count >= maxRequests) {
        return { allowed: false, remaining: 0 };
      }

      // Increment counter
      await prisma.rateLimit.update({
        where: { id: existing.id },
        data: { count: existing.count + 1 },
      });

      return { allowed: true, remaining: maxRequests - existing.count - 1 };
    } catch (error) {
      // Kalau database error, izinkan request (fail open)
      console.error("Rate limiter error:", error);
      return { allowed: true, remaining: maxRequests };
    }
  };
}

// Hapus entry expired setiap 5 menit
setInterval(async () => {
  try {
    await prisma.rateLimit.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  } catch {
    // Silent fail
  }
}, 5 * 60 * 1000);

// Rate limiter presets
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 menit
  maxRequests: 5,
});

export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 menit
  maxRequests: 3,
});
