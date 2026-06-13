import { NextResponse } from 'next/server'

const MODERATION_EMAIL = 'java2borneo@gmail.com'

export async function POST(request: Request) {
  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 })
  }

  const required = ['venueName', 'city', 'address', 'type', 'submitterContact']
  for (const field of required) {
    if (!body[field]?.trim()) {
      return NextResponse.json({ success: false, message: `Field "${field}" wajib diisi` }, { status: 400 })
    }
  }

  const isNewCity = body.city === 'Lainnya'
  if (isNewCity && !body.cityCustom?.trim()) {
    return NextResponse.json({ success: false, message: 'Nama kota baru wajib diisi' }, { status: 400 })
  }
  const cityFinal = isNewCity ? body.cityCustom.trim() : body.city

  // Honeypot
  if (body.website) return NextResponse.json({ success: true, message: 'Terkirim' })

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY
  if (!accessKey) {
    return NextResponse.json({
      success: false,
      message: 'Sistem moderasi belum aktif. Kirim manual ke ' + MODERATION_EMAIL,
      fallbackEmail: MODERATION_EMAIL,
    }, { status: 503 })
  }

  const citySlug = cityFinal.toLowerCase().replace(/\s+/g, '-')
  const emailBody = `
SUBMISSION VENUE NOBAR — Perlu Moderasi
${isNewCity ? '\n🆕 USULAN KOTA BARU: ' + cityFinal.toUpperCase() + '\n' : ''}
═══════════════════════════════════
📍 VENUE
═══════════════════════════════════
Nama     : ${body.venueName}
Kota     : ${cityFinal}${isNewCity ? ' (KOTA BARU)' : ''}
Alamat   : ${body.address}
Tipe     : ${body.type}
Biaya    : ${body.isFree === 'true' ? 'GRATIS' : 'Berbayar / Min. Order'}
Jam Buka : ${body.openTime || '-'}

Deskripsi:
${body.description || '-'}

📷 FOTO: ${body.photoUrl ? body.photoUrl : '(tidak ada foto)'}
${body.photoUrl ? '   ⚠️ Foto status PENDING — review dulu sebelum approve' : ''}

═══════════════════════════════════
👤 PENGIRIM
═══════════════════════════════════
Nama   : ${body.submitterName || '-'}
Kontak : ${body.submitterContact}

═══════════════════════════════════
✅ CARA APPROVE (edit lib/data.ts):
${isNewCity ? `1. Tambah ke CITY_LIST:
   { slug: '${citySlug}', name: '${cityFinal}', emoji: '🏙️', province: '...', description: '...' }
2. Tambah venue ke VENUES dengan city: '${citySlug}'` : `Tambah venue ke VENUES dengan city: '${citySlug}'`}
${body.photoUrl ? '3. Set photoUrl: ' + body.photoUrl + ' (atau pindahkan dari folder pending/)' : ''}
4. git push → auto-deploy
═══════════════════════════════════
nobarfinder.com/tambah
`.trim()

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `[NOBARFINDER]${isNewCity ? ' 🆕 KOTA BARU +' : ''} ${body.venueName} (${cityFinal})`,
        from_name: 'NobarFinder',
        email: MODERATION_EMAIL,
        message: emailBody,
      }),
    })
    const result = await res.json()
    if (result.success) {
      return NextResponse.json({ success: true, message: 'Terkirim! Review dalam 1×24 jam.' })
    }
    return NextResponse.json({
      success: false, message: 'Gagal. Email langsung ke ' + MODERATION_EMAIL, fallbackEmail: MODERATION_EMAIL,
    }, { status: 502 })
  } catch {
    return NextResponse.json({
      success: false, message: 'Koneksi gagal. Email ke ' + MODERATION_EMAIL, fallbackEmail: MODERATION_EMAIL,
    }, { status: 502 })
  }
}
