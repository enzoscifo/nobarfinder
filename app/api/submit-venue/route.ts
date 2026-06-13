import { NextResponse } from 'next/server'
import { insertSubmission, DB_ENABLED } from '@/lib/db'
import { sanitizeText, isValidVenueType, isValidUrl, isValidContact, checkRateLimit, MAX } from '@/lib/validate'

const MODERATION_EMAIL = 'java2borneo@gmail.com'

export async function POST(request: Request) {
  // Rate limit: max 3 submission per IP per jam
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit('submit-venue', ip, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'Terlalu banyak submission. Coba lagi dalam 1 jam.' }, { status: 429 })
  }

  let body: Record<string, string>
  try { body = await request.json() }
  catch { return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 }) }

  // Honeypot
  if (body.website) return NextResponse.json({ success: true, message: 'Terkirim' })

  // Sanitasi semua input
  const name      = sanitizeText(body.venueName, MAX.NAME)
  const address   = sanitizeText(body.address, MAX.ADDRESS)
  const cityRaw   = sanitizeText(body.city, MAX.CITY)
  const cityCustom = sanitizeText(body.cityCustom, MAX.CITY)
  const type      = sanitizeText(body.type, 20)
  const openTime  = sanitizeText(body.openTime, 30)
  const description = sanitizeText(body.description, MAX.DESCRIPTION)
  const submitterName    = sanitizeText(body.submitterName, 80)
  const submitterContact = sanitizeText(body.submitterContact, MAX.PHONE)
  const websiteUrl = sanitizeText(body.websiteUrl, MAX.URL)
  const phone = sanitizeText(body.phone, MAX.PHONE)

  // Validasi wajib
  if (!name) return NextResponse.json({ success: false, message: 'Nama venue wajib diisi' }, { status: 400 })
  if (!cityRaw) return NextResponse.json({ success: false, message: 'Kota wajib dipilih' }, { status: 400 })
  if (!address) return NextResponse.json({ success: false, message: 'Alamat wajib diisi' }, { status: 400 })
  if (!isValidVenueType(type)) return NextResponse.json({ success: false, message: 'Tipe venue tidak valid' }, { status: 400 })
  if (!submitterContact) return NextResponse.json({ success: false, message: 'Kontak wajib diisi' }, { status: 400 })

  // Validasi kota baru
  const isNewCity = cityRaw === 'Lainnya'
  if (isNewCity && !cityCustom) return NextResponse.json({ success: false, message: 'Nama kota baru wajib diisi' }, { status: 400 })
  const cityFinal = isNewCity ? cityCustom : cityRaw
  const citySlug = cityFinal.toLowerCase().replace(/\s+/g, '-')

  // Validasi URL website jika ada
  if (websiteUrl && !isValidUrl(websiteUrl)) {
    return NextResponse.json({ success: false, message: 'URL website tidak valid (harus diawali https://)' }, { status: 400 })
  }

  if (DB_ENABLED) {
    try {
      await insertSubmission({
        name, city: citySlug, address, type,
        isFree: body.isFree === 'true',
        openTime,
        phone: phone || undefined,
        photoUrl: body.photoUrl && isValidUrl(body.photoUrl) ? body.photoUrl : undefined,
        websiteUrl: websiteUrl || undefined,
        description: description || undefined,
        submitterName: submitterName || undefined,
        submitterContact,
      })
    } catch (e) {
      console.error('[submit-venue] DB insert error:', e)
    }
  }

  // Notifikasi email
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY
  if (accessKey) {
    const emailBody = `
SUBMISSION VENUE NOBAR — Perlu Moderasi di /admin
${isNewCity ? '\n🆕 USULAN KOTA BARU: ' + cityFinal.toUpperCase() + '\n' : ''}
Nama     : ${name}
Kota     : ${cityFinal}${isNewCity ? ' (KOTA BARU)' : ''}
Alamat   : ${address}
Tipe     : ${type}
Biaya    : ${body.isFree === 'true' ? 'GRATIS' : 'Berbayar'}
Jam Buka : ${openTime || '-'}
Website  : ${websiteUrl || '-'}
Deskripsi: ${description || '-'}
Foto     : ${body.photoUrl || '(tidak ada)'}
Pengirim : ${submitterName || '-'} · ${submitterContact}

→ Approve/Hapus di nobarfinder.com/admin
`.trim()
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `[NOBARFINDER]${isNewCity ? ' 🆕 KOTA BARU +' : ''} ${name} (${cityFinal})`,
          from_name: 'NobarFinder', email: MODERATION_EMAIL, message: emailBody,
        }),
      })
    } catch { /* email gagal tidak fatal */ }
  }

  if (!DB_ENABLED && !accessKey) {
    return NextResponse.json({ success: false, message: 'Sistem belum dikonfigurasi. Email ke ' + MODERATION_EMAIL, fallbackEmail: MODERATION_EMAIL }, { status: 503 })
  }

  return NextResponse.json({ success: true, message: 'Terkirim! Review oleh admin dalam 1×24 jam.' })
}
