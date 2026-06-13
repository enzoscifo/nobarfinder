/**
 * lib/redis.ts
 * Upstash Redis client — dipakai untuk rate limiting persistent.
 *
 * Setup:
 * 1. Daftar di upstash.com → buat Redis database
 * 2. Di Vercel: Settings → Environment Variables → tambah:
 *    UPSTASH_REDIS_REST_URL = https://xxx.upstash.io
 *    UPSTASH_REDIS_REST_TOKEN = xxx
 * 3. Atau connect langsung via Vercel Marketplace → Upstash → Connect
 *
 * Jika env belum ada, semua rate limit check otomatis return true (allow).
 * Artinya fallback ke perilaku sebelumnya tanpa error.
 */

import { Redis } from '@upstash/redis'

let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

/**
 * Rate limit persistent via Upstash Redis.
 * Menggunakan pattern INCR + EXPIRE — atomic dan aman di multi-instance.
 *
 * @param key       Unique key, cth: 'rl:submit-venue:203.0.113.1'
 * @param limit     Max requests per window
 * @param windowSec Window durasi dalam detik
 * @returns true jika boleh lanjut, false jika limit tercapai
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const redis = getRedis()

  // Fallback: jika Redis belum dikonfigurasi, izinkan semua request
  if (!redis) return true

  try {
    const current = await redis.incr(key)
    // Set TTL hanya pada hit pertama (key baru)
    if (current === 1) {
      await redis.expire(key, windowSec)
    }
    return current <= limit
  } catch (e) {
    // Jika Redis error (timeout, dll), fail open — jangan blokir user
    console.warn('[redis/rateLimit] error, failing open:', e)
    return true
  }
}

/**
 * Helper: buat key rate limit standar
 * Format: rl:{namespace}:{ip}
 */
export function rlKey(namespace: string, ip: string): string {
  // Sanitasi IP supaya tidak ada karakter aneh di Redis key
  const safeIp = ip.replace(/[^a-zA-Z0-9.:]/g, '_').slice(0, 45)
  return `rl:${namespace}:${safeIp}`
}

export { getRedis }
