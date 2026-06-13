import { NextResponse } from 'next/server'
import { checkPassword, setAdminCookie } from '@/lib/auth'
import { rateLimit, rlKey } from '@/lib/redis'

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, message: 'ADMIN_PASSWORD belum di-set di Vercel' }, { status: 503 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limit: max 5 percobaan per IP per 15 menit (persistent via Redis)
  const allowed = await rateLimit(rlKey('login', ip), 5, 900)
  if (!allowed) {
    return NextResponse.json({ success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }, { status: 429 })
  }

  const { password } = await request.json().catch(() => ({ password: '' }))
  const ok = checkPassword(password)

  if (!ok) {
    return NextResponse.json({ success: false, message: 'Password salah' }, { status: 401 })
  }

  await setAdminCookie()
  return NextResponse.json({ success: true })
}
