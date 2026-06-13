import { NextResponse } from 'next/server'
import { clearAdminCookie, isAdmin } from '@/lib/auth'

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ success: false }, { status: 401 })
  }
  await clearAdminCookie()
  return NextResponse.json({ success: true })
}
