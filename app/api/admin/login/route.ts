import { NextResponse } from 'next/server'
import { checkPassword, setAdminCookie } from '@/lib/auth'

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: '' }))
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, message: 'ADMIN_PASSWORD belum di-set di Vercel' }, { status: 503 })
  }
  if (!checkPassword(password)) {
    return NextResponse.json({ success: false, message: 'Password salah' }, { status: 401 })
  }
  await setAdminCookie()
  return NextResponse.json({ success: true })
}
