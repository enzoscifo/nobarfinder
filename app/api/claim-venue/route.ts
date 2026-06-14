import { NextResponse } from 'next/server'
import { claimVenue, DB_ENABLED } from '@/lib/db'
import { sanitizeText, isValidContact, isValidUrl, MAX } from '@/lib/validate'
import { rateLimit, rlKey } from '@/lib/redis'
import { notify } from '@/lib/notify'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const allowed = await rateLimit(rlKey('claim-venue', ip), 2, 86400)
  if (!allowed) {
    return NextResponse.json({ success: false, message: 'Terlalu banyak permintaan klaim hari ini.' }, { status: 429 })
  }

  let body: Record<string, string>
  try { body = await request.json() }
  catch { return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 }) }

  const venueId      = sanitizeText(body.venueId, 60)
  const ownerName    = sanitizeText(body.ownerName, 80)
  const ownerContact = sanitizeText(body.ownerContact, MAX.PHONE)
  const ownerProof   = sanitizeText(body.ownerProof, MAX.URL)

  if (!venueId)      return NextResponse.json({ success: false, message: 'venueId wajib diisi' }, { status: 400 })
  if (!ownerName)    return NextResponse.json({ success: false, message: 'Nama pemilik wajib diisi' }, { status: 400 })
  if (!ownerContact) return NextResponse.json({ success: false, message: 'Kontak wajib diisi' }, { status: 400 })
  if (!isValidContact(ownerContact)) {
    return NextResponse.json({ success: false, message: 'Kontak harus nomor WA (08xxx) atau @akun medsos' }, { status: 400 })
  }
  if (ownerProof && !isValidUrl(ownerProof)) {
    return NextResponse.json({ success: false, message: 'URL bukti tidak valid' }, { status: 400 })
  }

  if (!DB_ENABLED) return NextResponse.json({ success: false, message: 'Database belum aktif' }, { status: 503 })

  try {
    const claimedBy = `${ownerName} · ${ownerContact}${ownerProof ? ` · Bukti: ${ownerProof}` : ''}`
    await claimVenue(venueId, claimedBy)

    await notify({
      subject: `[NobarFinder] 🏷️ Klaim Venue Baru`,
      message: [
        `Venue ID : ${venueId}`,
        `Pemilik  : ${ownerName}`,
        `Kontak   : ${ownerContact}`,
        `Bukti    : ${ownerProof || '(tidak dilampirkan)'}`,
        ``,
        `→ Review di: https://nobarfinder.com/admin (tab Klaim)`,
      ].join('\n'),
      replyTo: ownerContact,
    })

    return NextResponse.json({ success: true, message: 'Klaim terkirim! Admin akan memverifikasi dalam 1×24 jam.' })
  } catch (e) {
    console.error('[claim-venue]', e)
    return NextResponse.json({ success: false, message: 'Gagal memproses klaim' }, { status: 500 })
  }
}
