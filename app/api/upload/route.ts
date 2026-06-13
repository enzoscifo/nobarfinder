import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

/**
 * POST /api/upload
 * Upload foto venue ke Vercel Blob (folder pending/).
 * Foto masuk status PENDING — baru tampil setelah moderasi approve.
 *
 * Setup di Vercel:
 * 1. Project → Storage → Create → Blob
 * 2. Token otomatis tersedia sebagai BLOB_READ_WRITE_TOKEN
 */

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Upload foto belum aktif. Hubungi admin.' },
      { status: 503 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: 'Tidak ada file' }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Format harus JPG, PNG, atau WebP' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'Ukuran maks 5MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `pending/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
      token,
      addRandomSuffix: false,
    })

    return NextResponse.json({ success: true, url: blob.url })
  } catch (e) {
    console.error('[upload] error:', e)
    return NextResponse.json({ success: false, message: 'Gagal upload foto' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
