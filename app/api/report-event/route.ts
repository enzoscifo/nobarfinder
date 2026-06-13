import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { DB_ENABLED } from '@/lib/db'

// Rate limit in-memory: 1 laporan per IP per event per 24 jam
const reportCache = new Map<string, { count: number; resetAt: number }>()

function getRateKey(request: Request, eventId: string) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  return `${ip}:${eventId}`
}

export async function POST(request: Request) {
  let body: { eventId?: string; reason?: string }
  try { body = await request.json() }
  catch { return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 }) }

  if (!body.eventId?.trim())
    return NextResponse.json({ success: false, message: 'eventId wajib diisi' }, { status: 400 })

  // Rate limit
  const key = getRateKey(request, body.eventId)
  const now = Date.now()
  const entry = reportCache.get(key)
  if (entry && entry.count >= 1 && now < entry.resetAt)
    return NextResponse.json({ success: false, message: 'Kamu sudah melaporkan event ini.' }, { status: 429 })
  reportCache.set(key, { count: (entry?.count || 0) + 1, resetAt: now + 24 * 60 * 60 * 1000 })

  if (!DB_ENABLED)
    return NextResponse.json({ success: false, message: 'Database belum aktif' }, { status: 503 })

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
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await sql`
      INSERT INTO event_reports (id, event_id, reason, ip)
      VALUES (${id}, ${body.eventId}, ${body.reason?.trim() || null}, ${ip})
    `
    // Tambah kolom report_count jika belum ada, lalu increment
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS report_count INT DEFAULT 0`
    await sql`UPDATE events SET report_count = COALESCE(report_count, 0) + 1 WHERE id = ${body.eventId}`

    // Auto-hide jika laporan >= 3
    await sql`
      UPDATE events SET status = 'flagged'
      WHERE id = ${body.eventId} AND COALESCE(report_count, 0) >= 3 AND status = 'approved'
    `
    return NextResponse.json({ success: true, message: 'Laporan diterima. Terima kasih!' })
  } catch (e) {
    console.error('[report-event]', e)
    return NextResponse.json({ success: false, message: 'Gagal menyimpan laporan' }, { status: 500 })
  }
}
