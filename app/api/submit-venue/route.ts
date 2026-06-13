import { NextResponse } from 'next/server'
import { insertSubmission, DB_ENABLED } from '@/lib/db'
import { sanitizeText, isValidVenueType, isValidUrl, MAX } from '@/lib/validate'
import { rateLimit, rlKey } from '@/lib/redis'

const MODERATION_EMAIL = 'java2borneo@gmail.com'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limit: max 3 submission per IP per jam (persistent via Redis)
  const allowed = await rateLimit(rlKey('submit-venue', ip), 3, 3600)
  if (!allowed) {
    return NextResponse.json({ success: false, message: 'Terlalu banyak submission. Coba lagi dalam 1 jam.' }, { status: 429 })
  }

  let body: Record<string, string>
  try { body = await request.json() }
  catch { return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 }) }

  // Honeypot
  if (body.website) return NextResponse.json({ success: true, message: 'Terkirim' })

  const name            = sanitizeText(body.venueName, MAX.NAME)
  const address         = sanitizeText(body.address, MAX.ADDRESS)
  const cityRaw         = sanitizeText(body.city, MAX.CITY)
  const cityCustom      = sanitizeText(body.cityCustom, MAX.CITY)
  const type            = sanitizeText(body.type, 20)
  const openTime        = sanitizeText(body.openTime, 30)
  const description     = sanitizeText(body.description, MAX.DESCRIPTION)
  const submitterName   = sanitizeText(body.submitterName, 80)
  const submitterContact = sanitizeText(body.submitterContact, MAX.PHONE)
  const websiteUrl      = sanitizeText(body.websiteUrl, MAX.URL)
  const phone           = sanitizeText(body.phone, MAX.PHONE)

  if (!name)    return NextResponse.json({ success: false, message: 'Nama venue wajib diisi' }, { status: 400 })
  if (!cityRaw) return NextResponse.json({ success: false, message: 'Kota wajib dipilih' }, { status: 400 })
  if (!address) return NextResponse.json({ success: false, message: 'Alamat wajib diisi' }, { status: 400 })
  if (!isValidVenueType(type)) return NextResponse.json({ success: false, message: 'Tipe venue tidak valid' }, { status: 400 })
  if (!submitterContact) return NextResponse.json({ success: false, message: 'Kontak wajib diisi' }, { status: 400 })
  if (websiteUrl && !isValidUrl(websiteUrl)) return NextResponse.json({ success: false, message: 'URL website tidak valid (harus diawali https://)' }, { status: 400 })

  const isNewCity  = cityRaw === 'Lainnya'
  if (isNewCity && !cityCustom) return NextResponse.json({ success: false, message: 'Nama kota baru wajib diisi' }, { status: 400 })
  const cityFinal  = isNewCity ? cityCustom : cityRaw
  const citySlug   = cityFinal.toLowerCase().replace(/\s+/g, '-')

  if (DB_ENABLED) {
    try {
      await insertSubmission({
        name, city: citySlug, address, type,
        isFree: body.isFree === 'true', openTime,
        phone: phone || undefined,
        photoUrl: body.photoUrl && isValidUrl(body.photoUrl) ? body.photoUrl : undefined,
        websiteUrl: websiteUrl || undefined,
        description: description || undefined,
        submitterName: submitterName || undefined,
        submitterContact,
      })
    } catch (e) { console.error('[submit-venue] DB error:', e) }
  }

  // Email notifikasi
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY
  if (accessKey) {
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `[NOBARFINDER]${isNewCity ? ' 🆕 KOTA BARU +' : ''} ${name} (${cityFinal})`,
          from_name: 'NobarFinder', email: MODERATION_EMAIL,
          message: `Venue: ${name}\nKota: ${cityFinal}\nAlamat: ${address}\nTipe: ${type}\nBiaya: ${body.isFree === 'true' ? 'GRATIS' : 'Berbayar'}\nJam: ${openTime || '-'}\nWebsite: ${websiteUrl || '-'}\nPengirim: ${submitterName || '-'} · ${submitterContact}\n\n→ nobarfinder.com/admin`,
        }),
      })
    } catch { /* tidak fatal */ }
  }

  if (!DB_ENABLED && !accessKey) {
    return NextResponse.json({ success: false, message: 'Sistem belum dikonfigurasi.' }, { status: 503 })
  }

  return NextResponse.json({ success: true, message: 'Terkirim! Review dalam 1×24 jam.' })
}
