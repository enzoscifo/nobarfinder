import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { DB_ENABLED } from '@/lib/db'
import { sanitizeText, checkRateLimit } from '@/lib/validate'

const VALID_REASONS = [
  'Informasi tidak akurat / palsu',
  'Event sudah dibatalkan',
  'Spam atau promosi',
  'Konten tidak pantas',
  'Lainnya',
]

export async function POST(request: Request) {
  // Rate limit: 1 laporan per IP per event per 24 jam
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  let body: { eventId?: string; reason?: string }
  try { body = await request.json() }
  catch { return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 }) }

  const eventId = sanitizeText(body.eventId, 60)
  const reason  = sanitizeText(body.reason, 100)

  if (!eventId) return NextResponse.json({ success: false, message: 'eventId wajib diisi' }, { status: 400 })
  if (reason && !VALID_REASONS.includes(reason)) return NextResponse.json({ success: false, message: 'Alasan tidak valid' }, { status: 400 })

  // Rate limit per IP + eventId (pakai namespace unik)
  if (!checkRateLimit(`report:${eventId}`, ip, 1, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'Kamu sudah melaporkan event ini.' }, { status: 429 })
  }

  if (!DB_ENABLED) return NextResponse.json({ success: false, message: 'Database belum aktif' }, { status: 503 })

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS event_reports (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        reason TEXT,
        ip TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    const id = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    await sql`INSERT INTO event_reports (id, event_id, reason, ip) VALUES (${id}, ${eventId}, ${reason || null}, ${ip})`

    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS report_count INT DEFAULT 0`
    await sql`UPDATE events SET report_count = COALESCE(report_count, 0) + 1 WHERE id = ${eventId}`
    await sql`UPDATE events SET status = 'flagged' WHERE id = ${eventId} AND COALESCE(report_count, 0) >= 3 AND status = 'approved'`

    return NextResponse.json({ success: true, message: 'Laporan diterima. Terima kasih!' })
  } catch (e) {
    console.error('[report-event]', e)
    return NextResponse.json({ success: false, message: 'Gagal menyimpan laporan' }, { status: 500 })
  }
}
