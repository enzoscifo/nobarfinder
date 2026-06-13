import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { DB_ENABLED } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Wajib ada CRON_SECRET — jika belum di-set, tolak semua akses
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET belum dikonfigurasi' }, { status: 503 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!DB_ENABLED) {
    return NextResponse.json({ skipped: true, reason: 'DB not enabled' })
  }

  try {
    // Hapus events yang sudah lewat 24 jam
    const evResult = await sql`
      DELETE FROM events
      WHERE event_date < NOW() - INTERVAL '24 hours'
      RETURNING id, title
    `

    // Hapus orphan event_reports yang event-nya sudah dihapus
    await sql`
      DELETE FROM event_reports
      WHERE event_id NOT IN (SELECT id FROM events)
    `

    // Hapus foto orphan tidak bisa dari sini (butuh Vercel Blob API),
    // tapi minimal log supaya bisa dibersihkan manual
    const deleted = evResult.rows
    console.log(`[cron/cleanup] Deleted ${deleted.length} expired events + orphan reports`)

    return NextResponse.json({
      success: true,
      deletedEvents: deleted.length,
      events: deleted.map(r => ({ id: r.id, title: r.title })),
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[cron/cleanup-events]', e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
