import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { DB_ENABLED } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Proteksi: hanya Vercel Cron (via CRON_SECRET) yang boleh akses
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!DB_ENABLED) {
    return NextResponse.json({ skipped: true, reason: 'DB not enabled' })
  }

  try {
    // Hapus event yang event_date-nya sudah lebih dari 24 jam yang lalu
    const result = await sql`
      DELETE FROM events
      WHERE event_date < NOW() - INTERVAL '24 hours'
      RETURNING id, title, event_date
    `

    const deleted = result.rows
    console.log(`[cron/cleanup-events] Deleted ${deleted.length} expired events`)

    return NextResponse.json({
      success: true,
      deleted: deleted.length,
      events: deleted.map(r => ({ id: r.id, title: r.title, eventDate: r.event_date })),
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[cron/cleanup-events]', e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
