/**
 * lib/validate.ts
 * Shared server-side validation helpers.
 */

const VALID_VENUE_TYPES = ['outdoor', 'cafe', 'resto', 'mall', 'komunitas'] as const
const VALID_EVENT_CATEGORIES = ['nobar-bola', 'nobar-film', 'nobar-anime', 'komunitas', 'lainnya'] as const

export const MAX = {
  NAME: 100,
  ADDRESS: 200,
  DESCRIPTION: 2000,
  EVENT_TITLE: 150,
  EVENT_DESC_WORDS: 300,
  PHONE: 20,
  URL: 300,
  CITY: 60,
}

export function sanitizeText(v: unknown, maxLen: number): string {
  if (typeof v !== 'string') return ''
  // Strip HTML tags, normalize whitespace, trim
  return v.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

export function isValidVenueType(v: string): v is typeof VALID_VENUE_TYPES[number] {
  return (VALID_VENUE_TYPES as readonly string[]).includes(v)
}

export function isValidEventCategory(v: string): v is typeof VALID_EVENT_CATEGORIES[number] {
  return (VALID_EVENT_CATEGORIES as readonly string[]).includes(v)
}

export function isValidContact(v: string): boolean {
  const isWA = /^(\+62|62|0)[\d]{9,12}$/.test(v.replace(/[\s-]/g, ''))
  const isSocmed = /^@[\w.]{3,30}$/.test(v)
  return isWA || isSocmed
}

export function isValidUrl(v: string): boolean {
  try { const u = new URL(v); return ['http:', 'https:'].includes(u.protocol) }
  catch { return false }
}

export function countWords(v: string): number {
  return v.trim().split(/\s+/).filter(Boolean).length
}

// Rate limit in-memory sederhana (per endpoint)
const ipCaches = new Map<string, Map<string, { count: number; resetAt: number }>>()

export function checkRateLimit(
  namespace: string,
  ip: string,
  maxPerWindow: number,
  windowMs: number
): boolean {
  if (!ipCaches.has(namespace)) ipCaches.set(namespace, new Map())
  const cache = ipCaches.get(namespace)!
  const now = Date.now()
  const entry = cache.get(ip)
  if (!entry || now > entry.resetAt) {
    cache.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxPerWindow) return false
  entry.count += 1
  return true
}
