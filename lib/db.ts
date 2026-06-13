import { sql } from '@vercel/postgres'
import { NobarVenue } from '@/types'
import { VENUES as SEED_VENUES } from './data'

/**
 * lib/db.ts
 * Layer database venue. Pakai Vercel Postgres (Neon).
 * Jika DB belum dikonfigurasi (POSTGRES_URL kosong), fallback ke data statis seed.
 */

const DB_ENABLED = !!process.env.POSTGRES_URL

export interface DBVenue extends NobarVenue {
  status: 'pending' | 'approved'
  description?: string
  submitterName?: string
  submitterContact?: string
  createdAt?: string
}

// ── Inisialisasi tabel + seed pertama kali ──
let initialized = false
export async function ensureSchema() {
  if (!DB_ENABLED || initialized) return
  await sql`
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT DEFAULT '📍',
      tags TEXT DEFAULT '',
      is_free BOOLEAN DEFAULT true,
      open_time TEXT DEFAULT '',
      maps_url TEXT DEFAULT '',
      phone TEXT,
      photo_url TEXT,
      website_url TEXT,
      description TEXT,
      submitter_name TEXT,
      submitter_contact TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  // Migrasi kolom baru (idempotent — aman dijalankan berkali-kali)
  await sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS website_url TEXT`

  // Seed venue awal (sekali saja) sebagai approved
  const { rows } = await sql`SELECT COUNT(*)::int AS n FROM venues`
  if (rows[0].n === 0) {
    for (const v of SEED_VENUES) {
      await sql`
        INSERT INTO venues (id, name, city, address, type, icon, tags, is_free, open_time, maps_url, phone, status)
        VALUES (${v.id}, ${v.name}, ${v.city}, ${v.address}, ${v.type}, ${v.icon},
                ${v.tags.join('|')}, ${v.isFree}, ${v.openTime}, ${v.mapsUrl}, ${v.phone || null}, 'approved')
        ON CONFLICT (id) DO NOTHING
      `
    }
  }
  initialized = true
}

function rowToVenue(r: Record<string, unknown>): DBVenue {
  return {
    id: r.id as string,
    name: r.name as string,
    city: r.city as string,
    address: r.address as string,
    type: r.type as NobarVenue['type'],
    icon: (r.icon as string) || '📍',
    tags: r.tags ? (r.tags as string).split('|').filter(Boolean) : [],
    isFree: r.is_free as boolean,
    openTime: (r.open_time as string) || '',
    mapsUrl: (r.maps_url as string) || '',
    phone: (r.phone as string) || undefined,
    photoUrl: (r.photo_url as string) || undefined,
    websiteUrl: (r.website_url as string) || undefined,
    description: (r.description as string) || undefined,
    submitterName: (r.submitter_name as string) || undefined,
    submitterContact: (r.submitter_contact as string) || undefined,
    status: r.status as 'pending' | 'approved',
    createdAt: r.created_at ? String(r.created_at) : undefined,
  }
}

// ── READ: approved venues (untuk halaman publik) ──
export async function getApprovedVenues(): Promise<NobarVenue[]> {
  if (!DB_ENABLED) return SEED_VENUES
  await ensureSchema()
  const { rows } = await sql`SELECT * FROM venues WHERE status = 'approved' ORDER BY created_at DESC`
  return rows.map(rowToVenue)
}

export async function getApprovedByCity(citySlug: string): Promise<NobarVenue[]> {
  if (!DB_ENABLED) return SEED_VENUES.filter(v => v.city === citySlug)
  await ensureSchema()
  const { rows } = await sql`SELECT * FROM venues WHERE status = 'approved' AND city = ${citySlug} ORDER BY created_at DESC`
  return rows.map(rowToVenue)
}

// ── READ: semua (untuk admin) ──
export async function getAllVenuesAdmin(): Promise<DBVenue[]> {
  if (!DB_ENABLED) return SEED_VENUES.map(v => ({ ...v, status: 'approved' as const }))
  await ensureSchema()
  const { rows } = await sql`SELECT * FROM venues ORDER BY status ASC, created_at DESC`
  return rows.map(rowToVenue)
}

// ── CREATE: submission baru (status pending) ──
export async function insertSubmission(data: {
  name: string; city: string; address: string; type: string
  isFree: boolean; openTime: string; mapsUrl?: string; phone?: string
  photoUrl?: string; description?: string; submitterName?: string; submitterContact?: string; websiteUrl?: string
}): Promise<string> {
  await ensureSchema()
  const id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  await sql`
    INSERT INTO venues (id, name, city, address, type, icon, is_free, open_time, maps_url, phone, photo_url, website_url, description, submitter_name, submitter_contact, status)
    VALUES (${id}, ${data.name}, ${data.city}, ${data.address}, ${data.type}, '📍',
            ${data.isFree}, ${data.openTime}, ${data.mapsUrl || ''}, ${data.phone || null},
            ${data.photoUrl || null}, ${data.websiteUrl || null}, ${data.description || null}, ${data.submitterName || null},
            ${data.submitterContact || null}, 'pending')
  `
  return id
}

// ── CREATE: tambah venue manual oleh admin (langsung approved) ──
export async function insertVenueAdmin(data: {
  name: string; city: string; address: string; type: string
  isFree: boolean; openTime: string; mapsUrl?: string; phone?: string
  photoUrl?: string; description?: string; icon?: string; tags?: string[]; websiteUrl?: string
}): Promise<string> {
  await ensureSchema()
  const id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const icon = data.icon || '📍'
  const tags = data.tags?.join('|') || ''
  await sql`
    INSERT INTO venues (id, name, city, address, type, icon, tags, is_free, open_time, maps_url, phone, photo_url, website_url, description, status)
    VALUES (${id}, ${data.name}, ${data.city}, ${data.address}, ${data.type}, ${icon}, ${tags},
            ${data.isFree}, ${data.openTime}, ${data.mapsUrl || ''}, ${data.phone || null},
            ${data.photoUrl || null}, ${data.websiteUrl || null}, ${data.description || null}, 'approved')
  `
  return id
}

// ── UPDATE: approve ──
export async function approveVenue(id: string) {
  await ensureSchema()
  await sql`UPDATE venues SET status = 'approved' WHERE id = ${id}`
}

// ── UPDATE: edit venue lengkap ──
export async function updateVenueFull(id: string, data: {
  name?: string; city?: string; address?: string; type?: string
  isFree?: boolean; openTime?: string; mapsUrl?: string; phone?: string
  photoUrl?: string; description?: string; icon?: string; tags?: string[]; websiteUrl?: string
}) {
  await ensureSchema()
  if (data.name !== undefined)      await sql`UPDATE venues SET name = ${data.name} WHERE id = ${id}`
  if (data.city !== undefined)      await sql`UPDATE venues SET city = ${data.city} WHERE id = ${id}`
  if (data.address !== undefined)   await sql`UPDATE venues SET address = ${data.address} WHERE id = ${id}`
  if (data.type !== undefined)      await sql`UPDATE venues SET type = ${data.type} WHERE id = ${id}`
  if (data.isFree !== undefined)    await sql`UPDATE venues SET is_free = ${data.isFree} WHERE id = ${id}`
  if (data.openTime !== undefined)  await sql`UPDATE venues SET open_time = ${data.openTime} WHERE id = ${id}`
  if (data.mapsUrl !== undefined)   await sql`UPDATE venues SET maps_url = ${data.mapsUrl} WHERE id = ${id}`
  if (data.phone !== undefined)     await sql`UPDATE venues SET phone = ${data.phone} WHERE id = ${id}`
  if (data.photoUrl !== undefined)  await sql`UPDATE venues SET photo_url = ${data.photoUrl} WHERE id = ${id}`
  if (data.websiteUrl !== undefined) await sql`UPDATE venues SET website_url = ${data.websiteUrl} WHERE id = ${id}`
  if (data.description !== undefined) await sql`UPDATE venues SET description = ${data.description} WHERE id = ${id}`
  if (data.icon !== undefined)      await sql`UPDATE venues SET icon = ${data.icon} WHERE id = ${id}`
  if (data.tags !== undefined)      await sql`UPDATE venues SET tags = ${data.tags.join('|')} WHERE id = ${id}`
}

// ── UPDATE: partial (legacy, masih dipakai action route) ──
export async function updateVenue(id: string, fields: Partial<{ icon: string; tags: string; mapsUrl: string }>) {
  await ensureSchema()
  if (fields.icon !== undefined)    await sql`UPDATE venues SET icon = ${fields.icon} WHERE id = ${id}`
  if (fields.tags !== undefined)    await sql`UPDATE venues SET tags = ${fields.tags} WHERE id = ${id}`
  if (fields.mapsUrl !== undefined) await sql`UPDATE venues SET maps_url = ${fields.mapsUrl} WHERE id = ${id}`
}

// ── DELETE ──
export async function deleteVenue(id: string) {
  await ensureSchema()
  await sql`DELETE FROM venues WHERE id = ${id}`
}

export { DB_ENABLED }
