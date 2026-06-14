import { NextResponse } from 'next/server'
import { insertSubmission, DB_ENABLED } from '@/lib/db'
import { sanitizeText, isValidVenueType, isValidUrl, MAX } from '@/lib/validate'
import { rateLimit, rlKey } from '@/lib/redis'
import { notify } from '@/lib/notify'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  console.log('[submit-venue] Request masuk dari IP:', ip)

  const allowed = await rateLimit(rlKey('submit-venue', ip), 3, 3600)
  if (!allowed) {
    console.log('[submit-venue] Rate limited:', ip)
    return NextResponse.json({ success: false, message: 'Terlalu banyak submission. Coba lagi dalam 1 jam.' }, { status: 429 })
  }

  let body: Record<string, string>
  try { body = await request.json() }
  catch (e) {
    console.error('[submit-venue] JSON parse error:', e)
    return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 })
  }

  console.log('[submit-venue] Body diterima, fields:', Object.keys(body).join(', '))

  // Honeypot
  if (body.website) {
    console.log('[submit-venue] Honeypot triggered')
    return NextResponse.json({ success: true, message: 'Terkirim' })
  }

  const name             = sanitizeText(body.venueName, MAX.NAME)
  const address          = sanitizeText(body.address, MAX.ADDRESS)
  const cityRaw          = sanitizeText(body.city, MAX.CITY)
  const cityCustom       = sanitizeText(body.cityCustom, MAX.CITY)
  const type             = sanitizeText(body.type, 20)
  const openTime         = sanitizeText(body.openTime, 30)
  const description      = sanitizeText(body.description, MAX.DESCRIPTION)
  const submitterName    = sanitizeText(body.submitterName, 80)
  const submitterContact = sanitizeText(body.submitterContact, MAX.PHONE)
  const websiteUrl       = sanitizeText(body.websiteUrl, MAX.URL)
  const phone            = sanitizeText(body.phone, MAX.PHONE)

  if (!name)    return NextResponse.json({ success: false, message: 'Nama venue wajib diisi' }, { status: 400 })
  if (!cityRaw) return NextResponse.json({ success: false, message: 'Kota wajib dipilih' }, { status: 400 })
  if (!address) return NextResponse.json({ success: false, message: 'Alamat wajib diisi' }, { status: 400 })
  if (!isValidVenueType(type)) return NextResponse.json({ success: false, message: 'Tipe venue tidak valid' }, { status: 400 })
  if (!submitterContact) return NextResponse.json({ success: false, message: 'Kontak wajib diisi' }, { status: 400 })
  if (websiteUrl && !isValidUrl(websiteUrl)) return NextResponse.json({ success: false, message: 'URL website tidak valid' }, { status: 400 })

  const isNewCity = cityRaw === 'Lainnya'
  if (isNewCity && !cityCustom) return NextResponse.json({ success: false, message: 'Nama kota baru wajib diisi' }, { status: 400 })
  const cityFinal = isNewCity ? cityCustom : cityRaw
  const citySlug  = cityFinal.toLowerCase().replace(/\s+/g, '-')

  console.log('[submit-venue] Validasi OK. DB_ENABLED:', DB_ENABLED, '| Venue:', name, '| Kota:', cityFinal)

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
      console.log('[submit-venue] DB insert OK')
    } catch (e) { console.error('[submit-venue] DB error:', e) }
  }

  console.log('[submit-venue] Memanggil notify()...')

  // Notifikasi email
  await notify({
    subject: `[NobarFinder]${isNewCity ? ' 🆕 KOTA BARU' : ''} Venue Baru: ${name} (${cityFinal})`,
    message: [
      `Venue    : ${name}`,
      `Kota     : ${cityFinal}${isNewCity ? ' ← KOTA BARU' : ''}`,
      `Alamat   : ${address}`,
      `Tipe     : ${type}`,
      `Biaya    : ${body.isFree === 'true' ? 'GRATIS' : 'Berbayar'}`,
      `Jam Buka : ${openTime || '-'}`,
      `Website  : ${websiteUrl || '-'}`,
      `Pengirim : ${submitterName || '-'} · ${submitterContact}`,
      ``,
      `→ Review di: https://nobarfinder.com/admin`,
    ].join('\n'),
    replyTo: submitterContact,
  })

  console.log('[submit-venue] notify() selesai dipanggil')

  if (!DB_ENABLED) {
    return NextResponse.json({ success: false, message: 'Sistem belum dikonfigurasi.' }, { status: 503 })
  }

  return NextResponse.json({ success: true, message: 'Terkirim! Review dalam 1×24 jam.' })
}
