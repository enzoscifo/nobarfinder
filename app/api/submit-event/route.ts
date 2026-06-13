import { NextResponse } from 'next/server'
import { insertEvent, DB_ENABLED } from '@/lib/db'
import { sanitizeText, isValidEventCategory, isValidContact, countWords, checkRateLimit, MAX } from '@/lib/validate'

export async function POST(request: Request) {
  // Rate limit: max 5 event per IP per jam
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit('submit-event', ip, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'Terlalu banyak submission. Coba lagi dalam 1 jam.' }, { status: 429 })
  }

  let body: Record<string, string>
  try { body = await request.json() }
  catch { return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 }) }

  // Sanitasi
  const venueId  = sanitizeText(body.venueId, 60)
  const title    = sanitizeText(body.title, MAX.EVENT_TITLE)
  const desc     = sanitizeText(body.description, MAX.DESCRIPTION)
  const category = sanitizeText(body.category, 20)
  const contact  = sanitizeText(body.submitterContact, MAX.PHONE)
  const subName  = sanitizeText(body.submitterName, 80)

  // Validasi wajib
  if (!venueId) return NextResponse.json({ success: false, message: 'venueId wajib diisi' }, { status: 400 })
  if (!title)   return NextResponse.json({ success: false, message: 'Judul event wajib diisi' }, { status: 400 })
  if (!contact) return NextResponse.json({ success: false, message: 'Kontak wajib diisi' }, { status: 400 })
  if (!isValidEventCategory(category)) return NextResponse.json({ success: false, message: 'Kategori tidak valid' }, { status: 400 })
  if (!isValidContact(contact)) return NextResponse.json({ success: false, message: 'Kontak harus nomor WA (08xxx) atau akun medsos (@akun)' }, { status: 400 })

  // Validasi deskripsi
  if (desc && countWords(desc) > MAX.EVENT_DESC_WORDS) {
    return NextResponse.json({ success: false, message: `Deskripsi maksimal ${MAX.EVENT_DESC_WORDS} kata` }, { status: 400 })
  }

  // Validasi tanggal
  const eventDate = new Date(body.eventDate)
  if (isNaN(eventDate.getTime())) return NextResponse.json({ success: false, message: 'Format tanggal tidak valid' }, { status: 400 })
  if (eventDate < new Date(Date.now() - 3 * 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'Tanggal event tidak boleh lampau' }, { status: 400 })
  // Maks 90 hari ke depan
  if (eventDate > new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) return NextResponse.json({ success: false, message: 'Event maksimal 90 hari ke depan' }, { status: 400 })

  if (!DB_ENABLED) return NextResponse.json({ success: false, message: 'Database belum aktif' }, { status: 503 })

  try {
    const id = await insertEvent({
      venueId, title, description: desc || undefined,
      eventDate: eventDate.toISOString(),
      category, submitterName: subName || undefined, submitterContact: contact,
    })
    return NextResponse.json({ success: true, id, message: 'Event terkirim! Admin akan review dalam 1×24 jam.' })
  } catch (e) {
    console.error('[submit-event]', e)
    return NextResponse.json({ success: false, message: 'Gagal menyimpan event' }, { status: 500 })
  }
}
