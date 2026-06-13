import { cookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'crypto'

/**
 * lib/auth.ts — Admin authentication
 * Cookie menyimpan SHA-256 hash password (bukan plaintext).
 * Brute-force protection sekarang dihandle via Redis di login route.
 */

const COOKIE_NAME = 'nf_admin_v2'

function hashPassword(pw: string): string {
  const salt = process.env.AUTH_SALT || 'nf_salt_2026_fallback'
  return createHash('sha256').update(pw + salt).digest('hex')
}

// Timing-safe compare — mencegah timing attack
function safeCompare(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8')
    const bb = Buffer.from(b, 'utf8')
    if (ba.length !== bb.length) { timingSafeEqual(ba, ba); return false }
    return timingSafeEqual(ba, bb)
  } catch { return false }
}

export async function isAdmin(): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return false
  const store = await cookies()
  const stored = store.get(COOKIE_NAME)?.value || ''
  return safeCompare(stored, hashPassword(pw))
}

export async function setAdminCookie() {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return
  const store = await cookies()
  store.set(COOKIE_NAME, hashPassword(pw), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function clearAdminCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export function checkPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || !input) return false
  return safeCompare(input, pw)
}
