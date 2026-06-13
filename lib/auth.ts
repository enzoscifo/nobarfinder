import { cookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'nf_admin_v2'
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>()
const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000

function hashPassword(pw: string): string {
  // Salt dari env supaya tidak hardcoded — fallback ke static jika belum diset
  const salt = process.env.AUTH_SALT || 'nf_salt_2026_fallback'
  return createHash('sha256').update(pw + salt).digest('hex')
}

// Timing-safe password compare — mencegah timing attack
function safeCompare(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8')
    const bb = Buffer.from(b, 'utf8')
    if (ba.length !== bb.length) {
      // Tetap jalankan timingSafeEqual dengan buffer sama panjang untuk prevent length oracle
      timingSafeEqual(ba, ba)
      return false
    }
    return timingSafeEqual(ba, bb)
  } catch { return false }
}

export function checkLoginRateLimit(ip: string): { allowed: boolean; waitMs: number } {
  const entry = loginAttempts.get(ip)
  const now = Date.now()
  if (entry && now < entry.blockedUntil) {
    return { allowed: false, waitMs: entry.blockedUntil - now }
  }
  return { allowed: true, waitMs: 0 }
}

export function recordLoginAttempt(ip: string, success: boolean) {
  if (success) { loginAttempts.delete(ip); return }
  const entry = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 }
  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_DURATION
    entry.count = 0
  }
  loginAttempts.set(ip, entry)
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
