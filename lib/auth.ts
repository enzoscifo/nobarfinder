import { cookies } from 'next/headers'
import { createHash } from 'crypto'

/**
 * Auth admin berbasis password + cookie.
 * Cookie menyimpan HASH password, bukan plaintext.
 * Set ADMIN_PASSWORD di env Vercel.
 */

const COOKIE_NAME = 'nf_admin_v2'

// Brute-force protection in-memory
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>()
const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000 // 15 menit

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw + 'nf_salt_2026').digest('hex')
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
  const now = Date.now()
  if (success) { loginAttempts.delete(ip); return }
  const entry = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 }
  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION
    entry.count = 0
  }
  loginAttempts.set(ip, entry)
}

export async function isAdmin(): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return false
  const store = await cookies()
  const stored = store.get(COOKIE_NAME)?.value
  return stored === hashPassword(pw)
}

export async function setAdminCookie() {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return
  const store = await cookies()
  store.set(COOKIE_NAME, hashPassword(pw), {
    httpOnly: true,
    secure: true,
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
  return !!pw && input === pw
}
