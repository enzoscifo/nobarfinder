import { NextResponse } from 'next/server'
import { insertEvent, DB_ENABLED } from '@/lib/db'

export async function POST(request: Request) {
  let body: Record<string, string>
  try { body = await request.json() }
  catch { return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 }) }

  const required = ['venueId', 'title', 'eventDate', 'category', 'submitterContact']
  for (const f of required) {
    if (!body[f]?.trim())
      return NextResponse.json({ success: false, message: `Field "${f}" wajib diisi` }, { status: 400 })
  }

  if (body.description) {
    const wordCount = body.description.trim().split(/\s+/).filter(Boolean).length
    if (wordCount > 300)
      return NextResponse.json({ success: false, message: 'Deskripsi maksimal 300 kata' }, { status: 400 })
  }

  const eventDate = new Date(body.eventDate)
  if (isNaN(eventDate.getTime()))
    return NextResponse.json({ success: false, message: 'Format tanggal tidak valid' }, { status: 400 })
  if (eventDate < new Date(Date.now() - 3 * 60 * 60 * 1000))
    return NextResponse.json({ success: false, message: 'Tanggal event tidak boleh lampau' }, { status: 400 })

  if (!DB_ENABLED)
    return NextResponse.json({ success: false, message: 'Database belum aktif' }, { status: 503 })

  try {
    const id = await insertEvent({
      venueId: body.venueId,
      title: body.title.trim(),
      description: body.description?.trim() || undefined,
      eventDate: eventDate.toISOString(),
      category: body.category,
      submitterName: body.submitterName?.trim() || undefined,
      submitterContact: body.submitterContact.trim(),
    })
    return NextResponse.json({ success: true, id, message: 'Event terkirim! Admin akan review dalam 1×24 jam.' })
  } catch (e) {
    console.error('[submit-event]', e)
    return NextResponse.json({ success: false, message: 'Gagal menyimpan event' }, { status: 500 })
  }
}
