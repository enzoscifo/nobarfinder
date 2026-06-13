import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { DB_ENABLED } from '@/lib/db'

/**
 * Menyimpan event yang disubmit bersamaan dengan venue baru.
 * Karena venueId belum ada (venue masih pending), event disimpan
 * dengan venue_id = 'PENDING:{venueName}:{city}' sebagai referensi.
 * Admin bisa link-kan manual saat approve, atau sistem auto-link
 * saat venue pertama kali diakses.
 */
export async function POST(request: Request) {
  let body: Record<string, string>
  try { body = await request.json() }
  catch { return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 }) }

  if (!body.title?.trim() || !body.eventDate || !body.venueName)
    return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 })

  if (body.description) {
    const wordCount = body.description.trim().split(/\s+/).filter(Boolean).length
    if (wordCount > 300)
      return NextResponse.json({ success: false, message: 'Deskripsi maks 300 kata' }, { status: 400 })
  }

  const eventDate = new Date(body.eventDate)
  if (isNaN(eventDate.getTime()) || eventDate < new Date(Date.now() - 3 * 60 * 60 * 1000))
    return NextResponse.json({ success: false, message: 'Tanggal tidak valid atau sudah lampau' }, { status: 400 })

  if (!DB_ENABLED)
    return NextResponse.json({ success: false }, { status: 503 })

  try {
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS report_count INT DEFAULT 0`

    // Simpan dengan venue_id berisi referensi sementara ke nama venue
    const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const venueRef = `PENDING:${body.venueName.trim()}:${(body.venueCity || '').trim()}`

    await sql`
      INSERT INTO events (id, venue_id, title, description, event_date, category,
                          submitter_name, submitter_contact, status)
      VALUES (${id}, ${venueRef}, ${body.title.trim()},
              ${body.description?.trim() || null}, ${eventDate.toISOString()},
              ${body.category || 'lainnya'}, ${body.submitterName?.trim() || null},
              ${body.submitterContact?.trim() || null}, 'pending')
    `
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error('[submit-event-pending]', e)
    return NextResponse.json({ success: false, message: 'Gagal menyimpan' }, { status: 500 })
  }
}
