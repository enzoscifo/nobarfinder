import { NextResponse } from 'next/server'
import { claimVenue, DB_ENABLED } from '@/lib/db'
import { sanitizeText, isValidContact, isValidUrl, checkRateLimit, MAX } from '@/lib/validate'
import { rateLimit, rlKey } from '@/lib/redis'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limit: max 2 klaim per IP per hari
  const allowed = await rateLimit(rlKey('claim-venue', ip), 2, 86400)
  if (!allowed) {
    return NextResponse.json({ success: false, message: 'Terlalu banyak permintaan klaim hari ini.' }, { status: 429 })
  }

  let body: Record<string, string>
  try { body = await request.json() }
  catch { return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 }) }

  const venueId    = sanitizeText(body.venueId, 60)
  const ownerName  = sanitizeText(body.ownerName, 80)
  const ownerContact = sanitizeText(body.ownerContact, MAX.PHONE)
  const ownerProof = sanitizeText(body.ownerProof, MAX.URL) // URL foto bukti (opsional)

  if (!venueId)       return NextResponse.json({ success: false, message: 'venueId wajib diisi' }, { status: 400 })
  if (!ownerName)     return NextResponse.json({ success: false, message: 'Nama pemilik wajib diisi' }, { status: 400 })
  if (!ownerContact)  return NextResponse.json({ success: false, message: 'Kontak wajib diisi' }, { status: 400 })
  if (!isValidContact(ownerContact)) {
    return NextResponse.json({ success: false, message: 'Kontak harus nomor WA (08xxx) atau @akun medsos' }, { status: 400 })
  }
  if (ownerProof && !isValidUrl(ownerProof)) {
    return NextResponse.json({ success: false, message: 'URL bukti tidak valid' }, { status: 400 })
  }

  if (!DB_ENABLED) return NextResponse.json({ success: false, message: 'Database belum aktif' }, { status: 503 })

  try {
    const claimedBy = `${ownerName} · ${ownerContact}${ownerProof ? ` · ${ownerProof}` : ''}`
    await claimVenue(venueId, claimedBy)

    // Notifikasi ke admin via Web3Forms
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY
    if (accessKey) {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `[NOBARFINDER] 🏷️ Klaim Venue Baru`,
          from_name: 'NobarFinder',
          email: 'java2borneo@gmail.com',
          message: `Venue ID: ${venueId}\nPemilik: ${ownerName}\nKontak: ${ownerContact}\nBukti: ${ownerProof || '-'}\n\n→ Review di nobarfinder.com/admin (tab Klaim)`,
        }),
      }).catch(() => {/* tidak fatal */})
    }

    return NextResponse.json({ success: true, message: 'Klaim terkirim! Admin akan memverifikasi dalam 1×24 jam.' })
  } catch (e) {
    console.error('[claim-venue]', e)
    return NextResponse.json({ success: false, message: 'Gagal memproses klaim' }, { status: 500 })
  }
}
