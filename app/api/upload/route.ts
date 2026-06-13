import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { checkRateLimit } from '@/lib/validate'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: Request) {
  // Rate limit: max 10 upload per IP per jam (mencegah flood storage)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit('upload', ip, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'Terlalu banyak upload. Coba lagi nanti.' }, { status: 429 })
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json({ success: false, message: 'Upload foto belum aktif. Hubungi admin.' }, { status: 503 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ success: false, message: 'Tidak ada file' }, { status: 400 })
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ success: false, message: 'Format harus JPG, PNG, atau WebP' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ success: false, message: 'Ukuran maks 5MB' }, { status: 400 })

    const ext = file.name.split('.').pop()?.replace(/[^a-z]/gi, '') || 'jpg'
    const filename = `pending/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const blob = await put(filename, file, { access: 'public', token, addRandomSuffix: false })
    return NextResponse.json({ success: true, url: blob.url })
  } catch (e) {
    console.error('[upload] error:', e)
    return NextResponse.json({ success: false, message: 'Gagal upload foto' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
