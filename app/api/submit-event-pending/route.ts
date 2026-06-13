import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { DB_ENABLED } from '@/lib/db'
import { sanitizeText, isValidEventCategory, isValidContact, countWords, checkRateLimit, MAX } from '@/lib/validate'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit('submit-event-pending', ip, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'Terlalu banyak submission.' }, { status: 429 })
  }

  let body: Record<string, string>
  try { body = await request.json() }
  catch { return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 }) }

  const venueName = sanitizeText(body.venueName, MAX.NAME)
  const venueCity = sanitizeText(body.venueCity, MAX.CITY)
  const title     = sanitizeText(body.title, MAX.EVENT_TITLE)
  const desc      = sanitizeText(body.description, MAX.DESCRIPTION)
  const category  = sanitizeText(body.category, 20)
  const contact   = sanitizeText(body.submitterContact, MAX.PHONE)
  const subName   = sanitizeText(body.submitterName, 80)

  if (!title || !venueName) return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 })
  if (!isValidEventCategory(category)) return NextResponse.json({ success: false, message: 'Kategori tidak valid' }, { status: 400 })

  // Kontak opsional di sini (bisa fallback ke kontak venue), tapi kalau diisi harus valid
  if (contact && !isValidContact(contact)) {
    return NextResponse.json({ success: false, message: 'Format kontak tidak valid' }, { status: 400 })
  }

  if (desc && countWords(desc) > MAX.EVENT_DESC_WORDS) {
    return NextResponse.json({ success: false, message: `Deskripsi maksimal ${MAX.EVENT_DESC_WORDS} kata` }, { status: 400 })
  }

  const eventDate = new Date(body.eventDate)
  if (isNaN(eventDate.getTime()) || eventDate < new Date(Date.now() - 3 * 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'Tanggal tidak valid atau sudah lampau' }, { status: 400 })
  }
  if (eventDate > new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'Event maksimal 90 hari ke depan' }, { status: 400 })
  }

  if (!DB_ENABLED) return NextResponse.json({ success: false }, { status: 503 })

  try {
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS report_count INT DEFAULT 0`
    const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    // venue_id diawali PENDING: agar admin bisa identifikasi & link setelah venue approved
    const venueRef = `PENDING:${venueName}:${venueCity}`
    await sql`
      INSERT INTO events (id, venue_id, title, description, event_date, category,
                          submitter_name, submitter_contact, status)
      VALUES (${id}, ${venueRef}, ${title}, ${desc || null},
              ${eventDate.toISOString()}, ${category},
              ${subName || null}, ${contact || null}, 'pending')
    `
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error('[submit-event-pending]', e)
    return NextResponse.json({ success: false, message: 'Gagal menyimpan' }, { status: 500 })
  }
}
