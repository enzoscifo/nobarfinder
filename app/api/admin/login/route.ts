import { NextResponse } from 'next/server'
import { checkPassword, setAdminCookie, checkLoginRateLimit, recordLoginAttempt } from '@/lib/auth'

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, message: 'ADMIN_PASSWORD belum di-set di Vercel' }, { status: 503 })
  }

  // Brute-force protection
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { allowed, waitMs } = checkLoginRateLimit(ip)
  if (!allowed) {
    const menit = Math.ceil(waitMs / 60000)
    return NextResponse.json({ success: false, message: `Terlalu banyak percobaan. Coba lagi dalam ${menit} menit.` }, { status: 429 })
  }

  const { password } = await request.json().catch(() => ({ password: '' }))
  const ok = checkPassword(password)
  recordLoginAttempt(ip, ok)

  if (!ok) {
    return NextResponse.json({ success: false, message: 'Password salah' }, { status: 401 })
  }
  await setAdminCookie()
  return NextResponse.json({ success: true })
}
