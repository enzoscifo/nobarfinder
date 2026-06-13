import { sql } from '@vercel/postgres'
import { NobarVenue } from '@/types'
import { VENUES as SEED_VENUES } from './data'

/**
 * lib/db.ts — database layer NobarFinder
 * Vercel Postgres (Neon). Fallback ke seed statis jika DB belum aktif.
 */

export const DB_ENABLED = !!process.env.POSTGRES_URL

// ── Interfaces ──────────────────────────────────────────────────
export interface DBVenue extends NobarVenue {
  status: 'pending' | 'approved'
  submitterName?: string
  submitterContact?: string
  createdAt?: string
}

export interface DBEvent {
  id: string
  venueId: string
  venueName?: string
  venueCity?: string
  title: string
  description?: string
  eventDate: string
  category: string
  submitterName?: string
  submitterContact?: string
  status: 'pending' | 'approved' | 'flagged'
  createdAt?: string
}

// ── Schema init (idempotent) ────────────────────────────────────
let schemaReady = false

export async function ensureSchema() {
  if (!DB_ENABLED || schemaReady) return
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
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      venue_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_date TIMESTAMPTZ NOT NULL,
      category TEXT DEFAULT 'lainnya',
      submitter_name TEXT,
      submitter_contact TEXT,
      status TEXT DEFAULT 'pending',
      report_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS event_reports (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      reason TEXT,
      ip TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  // Migrasi idempotent — kolom baru
  await sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS website_url TEXT`
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'lainnya'`
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS report_count INT DEFAULT 0`

  // Seed awal (sekali saja)
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
  schemaReady = true
}

// ── Row mappers ──────────────────────────────────────────────────
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

function rowToEvent(r: Record<string, unknown>): DBEvent {
  return {
    id: r.id as string,
    venueId: r.venue_id as string,
    venueName: r.venue_name as string | undefined,
    venueCity: r.venue_city as string | undefined,
    title: r.title as string,
    description: r.description as string | undefined,
    eventDate: r.event_date ? String(r.event_date) : '',
    category: (r.category as string) || 'lainnya',
    submitterName: r.submitter_name as string | undefined,
    submitterContact: r.submitter_contact as string | undefined,
    status: r.status as 'pending' | 'approved' | 'flagged',
    createdAt: r.created_at ? String(r.created_at) : undefined,
  }
}

// ── VENUES: READ ────────────────────────────────────────────────
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

export async function getAllVenuesAdmin(): Promise<DBVenue[]> {
  if (!DB_ENABLED) return SEED_VENUES.map(v => ({ ...v, status: 'approved' as const }))
  await ensureSchema()
  const { rows } = await sql`SELECT * FROM venues ORDER BY status ASC, created_at DESC`
  return rows.map(rowToVenue)
}

// ── VENUES: WRITE ───────────────────────────────────────────────
export async function insertSubmission(data: {
  name: string; city: string; address: string; type: string
  isFree: boolean; openTime: string; mapsUrl?: string; phone?: string
  photoUrl?: string; description?: string; submitterName?: string
  submitterContact?: string; websiteUrl?: string
}): Promise<string> {
  await ensureSchema()
  const id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  await sql`
    INSERT INTO venues (id, name, city, address, type, icon, is_free, open_time, maps_url, phone,
                        photo_url, website_url, description, submitter_name, submitter_contact, status)
    VALUES (${id}, ${data.name}, ${data.city}, ${data.address}, ${data.type}, '📍',
            ${data.isFree}, ${data.openTime}, ${data.mapsUrl || ''}, ${data.phone || null},
            ${data.photoUrl || null}, ${data.websiteUrl || null}, ${data.description || null},
            ${data.submitterName || null}, ${data.submitterContact || null}, 'pending')
  `
  return id
}

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
    INSERT INTO venues (id, name, city, address, type, icon, tags, is_free, open_time, maps_url,
                        phone, photo_url, website_url, description, status)
    VALUES (${id}, ${data.name}, ${data.city}, ${data.address}, ${data.type}, ${icon}, ${tags},
            ${data.isFree}, ${data.openTime}, ${data.mapsUrl || ''}, ${data.phone || null},
            ${data.photoUrl || null}, ${data.websiteUrl || null}, ${data.description || null}, 'approved')
  `
  return id
}

export async function approveVenue(id: string) {
  await ensureSchema()
  await sql`UPDATE venues SET status = 'approved' WHERE id = ${id}`
  // Auto-link event PENDING:{name}:{city} ke venue_id yang baru approved
  const { rows } = await sql`SELECT name, city FROM venues WHERE id = ${id}`
  if (rows[0]) {
    const venueRef = `PENDING:${rows[0].name}:${rows[0].city}`
    await sql`UPDATE events SET venue_id = ${id} WHERE venue_id = ${venueRef}`
  }
}

export async function updateVenueFull(id: string, data: {
  name?: string; city?: string; address?: string; type?: string
  isFree?: boolean; openTime?: string; mapsUrl?: string; phone?: string
  photoUrl?: string; description?: string; icon?: string; tags?: string[]; websiteUrl?: string
}) {
  await ensureSchema()
  // Batch semua update dalam satu transaksi logis
  if (data.name !== undefined)        await sql`UPDATE venues SET name = ${data.name} WHERE id = ${id}`
  if (data.city !== undefined)        await sql`UPDATE venues SET city = ${data.city} WHERE id = ${id}`
  if (data.address !== undefined)     await sql`UPDATE venues SET address = ${data.address} WHERE id = ${id}`
  if (data.type !== undefined)        await sql`UPDATE venues SET type = ${data.type} WHERE id = ${id}`
  if (data.isFree !== undefined)      await sql`UPDATE venues SET is_free = ${data.isFree} WHERE id = ${id}`
  if (data.openTime !== undefined)    await sql`UPDATE venues SET open_time = ${data.openTime} WHERE id = ${id}`
  if (data.mapsUrl !== undefined)     await sql`UPDATE venues SET maps_url = ${data.mapsUrl} WHERE id = ${id}`
  if (data.phone !== undefined)       await sql`UPDATE venues SET phone = ${data.phone} WHERE id = ${id}`
  if (data.photoUrl !== undefined)    await sql`UPDATE venues SET photo_url = ${data.photoUrl} WHERE id = ${id}`
  if (data.websiteUrl !== undefined)  await sql`UPDATE venues SET website_url = ${data.websiteUrl} WHERE id = ${id}`
  if (data.description !== undefined) await sql`UPDATE venues SET description = ${data.description} WHERE id = ${id}`
  if (data.icon !== undefined)        await sql`UPDATE venues SET icon = ${data.icon} WHERE id = ${id}`
  if (data.tags !== undefined)        await sql`UPDATE venues SET tags = ${data.tags.join('|')} WHERE id = ${id}`
}

export async function deleteVenue(id: string) {
  await ensureSchema()
  // Hapus venue + semua event-nya sekaligus
  await sql`DELETE FROM event_reports WHERE event_id IN (SELECT id FROM events WHERE venue_id = ${id})`
  await sql`DELETE FROM events WHERE venue_id = ${id}`
  await sql`DELETE FROM venues WHERE id = ${id}`
}

// ── EVENTS: READ ────────────────────────────────────────────────
export async function getEventsByVenue(venueId: string): Promise<DBEvent[]> {
  if (!DB_ENABLED) return []
  await ensureSchema()
  const { rows } = await sql`
    SELECT e.*, v.name AS venue_name, v.city AS venue_city
    FROM events e LEFT JOIN venues v ON v.id = e.venue_id
    WHERE e.venue_id = ${venueId} AND e.status = 'approved'
    ORDER BY e.event_date ASC
  `
  return rows.map(rowToEvent)
}

export async function getUpcomingEventsByCity(citySlug: string): Promise<DBEvent[]> {
  if (!DB_ENABLED) return []
  await ensureSchema()
  const { rows } = await sql`
    SELECT e.*, v.name AS venue_name, v.city AS venue_city
    FROM events e LEFT JOIN venues v ON v.id = e.venue_id
    WHERE v.city = ${citySlug} AND e.status = 'approved'
      AND e.event_date >= NOW() - INTERVAL '3 hours'
    ORDER BY e.event_date ASC
    LIMIT 10
  `
  return rows.map(rowToEvent)
}

export async function getAllEventsAdmin(): Promise<DBEvent[]> {
  if (!DB_ENABLED) return []
  await ensureSchema()
  const { rows } = await sql`
    SELECT e.*, v.name AS venue_name, v.city AS venue_city
    FROM events e LEFT JOIN venues v ON v.id = e.venue_id
    ORDER BY
      CASE e.status WHEN 'flagged' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
      e.event_date ASC
  `
  return rows.map(rowToEvent)
}

// ── EVENTS: WRITE ───────────────────────────────────────────────
export async function insertEvent(data: {
  venueId: string; title: string; description?: string
  eventDate: string; category: string
  submitterName?: string; submitterContact?: string
}): Promise<string> {
  await ensureSchema()
  const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  await sql`
    INSERT INTO events (id, venue_id, title, description, event_date, category, submitter_name, submitter_contact, status)
    VALUES (${id}, ${data.venueId}, ${data.title}, ${data.description || null},
            ${data.eventDate}, ${data.category}, ${data.submitterName || null},
            ${data.submitterContact || null}, 'pending')
  `
  return id
}

export async function approveEvent(id: string) {
  await ensureSchema()
  await sql`UPDATE events SET status = 'approved' WHERE id = ${id}`
}

export async function deleteEvent(id: string) {
  await ensureSchema()
  await sql`DELETE FROM event_reports WHERE event_id = ${id}`
  await sql`DELETE FROM events WHERE id = ${id}`
}
