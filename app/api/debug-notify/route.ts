import { NextResponse } from 'next/server'
import { notify } from '@/lib/notify'

// TEMPORARY: endpoint diagnostik — hapus setelah email confirmed working
// Hanya bisa diakses dengan secret key
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const envCheck = {
    WEB3FORMS_ACCESS_KEY: process.env.WEB3FORMS_ACCESS_KEY
      ? `✓ Ada (${process.env.WEB3FORMS_ACCESS_KEY.slice(0, 8)}...)`
      : '✗ TIDAK ADA',
    POSTGRES_URL: process.env.POSTGRES_URL ? '✓ Ada' : '✗ TIDAK ADA',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? '✓ Ada' : '✗ TIDAK ADA',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? '✓ Ada' : '✗ TIDAK ADA',
    CRON_SECRET: process.env.CRON_SECRET ? '✓ Ada' : '✗ TIDAK ADA',
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? '✓ Ada' : '✗ TIDAK ADA',
  }

  console.log('[debug-notify] Env check:', JSON.stringify(envCheck))

  // Kirim email test
  const emailSent = await notify({
    subject: '[NobarFinder] TEST — Debug Email',
    message: [
      'Ini adalah email test diagnostik dari NobarFinder.',
      '',
      'Env vars:',
      ...Object.entries(envCheck).map(([k, v]) => `  ${k}: ${v}`),
      '',
      `Waktu: ${new Date().toISOString()}`,
    ].join('\n'),
  })

  return NextResponse.json({
    envCheck,
    emailSent,
    message: emailSent
      ? 'Email test berhasil dikirim — cek inbox java2borneo@gmail.com (dan folder Spam)'
      : 'Email GAGAL dikirim — cek log Vercel untuk detail error',
  })
}
