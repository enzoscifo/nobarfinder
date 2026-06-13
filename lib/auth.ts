import { cookies } from 'next/headers'

/**
 * Auth admin sederhana berbasis password + cookie.
 * Set ADMIN_PASSWORD di env Vercel.
 */

const COOKIE_NAME = 'nf_admin'

export async function isAdmin(): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return false
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value === pw
}

export async function setAdminCookie() {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return
  const store = await cookies()
  store.set(COOKIE_NAME, pw, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
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
