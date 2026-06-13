import { NextResponse } from 'next/server'
import { insertSubmission, DB_ENABLED } from '@/lib/db'

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
  const citySlug = cityFinal.toLowerCase().replace(/\s+/g, '-')

  // Honeypot
  if (body.website) return NextResponse.json({ success: true, message: 'Terkirim' })

  // 1. Simpan ke database sebagai pending (jika DB aktif)
  if (DB_ENABLED) {
    try {
      await insertSubmission({
        name: body.venueName,
        city: citySlug,
        address: body.address,
        type: body.type,
        isFree: body.isFree === 'true',
        openTime: body.openTime || '',
        phone: body.phone,
        photoUrl: body.photoUrl,
        websiteUrl: body.websiteUrl,
        description: body.description,
        submitterName: body.submitterName,
        submitterContact: body.submitterContact,
      })
    } catch (e) {
      console.error('[submit-venue] DB insert error:', e)
    }
  }

  // 2. Kirim notifikasi email (opsional, jika Web3Forms aktif)
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY
  if (accessKey) {
    const emailBody = `
SUBMISSION VENUE NOBAR — Perlu Moderasi di /admin
${isNewCity ? '\n🆕 USULAN KOTA BARU: ' + cityFinal.toUpperCase() + '\n' : ''}
Nama     : ${body.venueName}
Kota     : ${cityFinal}${isNewCity ? ' (KOTA BARU)' : ''}
Alamat   : ${body.address}
Tipe     : ${body.type}
Biaya    : ${body.isFree === 'true' ? 'GRATIS' : 'Berbayar'}
Jam Buka : ${body.openTime || '-'}
Deskripsi: ${body.description || '-'}
Foto     : ${body.photoUrl || '(tidak ada)'}
Pengirim : ${body.submitterName || '-'} · ${body.submitterContact}

→ Approve/Hapus di nobarfinder.com/admin
`.trim()
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `[NOBARFINDER]${isNewCity ? ' 🆕 KOTA BARU +' : ''} ${body.venueName} (${cityFinal})`,
          from_name: 'NobarFinder', email: MODERATION_EMAIL, message: emailBody,
        }),
      })
    } catch { /* email gagal tidak fatal, data sudah di DB */ }
  }

  if (!DB_ENABLED && !accessKey) {
    return NextResponse.json({
      success: false, message: 'Sistem belum dikonfigurasi. Email ke ' + MODERATION_EMAIL, fallbackEmail: MODERATION_EMAIL,
    }, { status: 503 })
  }

  return NextResponse.json({ success: true, message: 'Terkirim! Review oleh admin dalam 1×24 jam.' })
}
