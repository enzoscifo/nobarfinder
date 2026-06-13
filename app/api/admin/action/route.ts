import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/auth'
import { approveVenue, deleteVenue, updateVenueFull, insertVenueAdmin,
         approveEvent, deleteEvent, getApprovedVenues } from '@/lib/db'
import { sanitizeText, isValidVenueType, isValidUrl, MAX } from '@/lib/validate'

async function revalidateAll(venueCity?: string) {
  revalidatePath('/', 'layout')          // homepage + semua child
  if (venueCity) {
    revalidatePath(`/${venueCity}`, 'page')  // halaman kota spesifik
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.action) {
    return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 })
  }

  try {
    if (body.action === 'approve') {
      if (!body.id) return NextResponse.json({ success: false }, { status: 400 })
      await approveVenue(String(body.id))
      // Ambil city venue untuk revalidate spesifik
      const venues = await getApprovedVenues()
      const v = venues.find(x => x.id === body.id)
      await revalidateAll(v?.city)

    } else if (body.action === 'delete') {
      if (!body.id) return NextResponse.json({ success: false }, { status: 400 })
      await deleteVenue(String(body.id))
      await revalidateAll()

    } else if (body.action === 'edit') {
      if (!body.id) return NextResponse.json({ success: false, message: 'ID tidak ada' }, { status: 400 })
      const d = body.data || {}
      const clean: Record<string, unknown> = {}
      if (d.name !== undefined)        clean.name        = sanitizeText(d.name, MAX.NAME)
      if (d.city !== undefined)        clean.city        = sanitizeText(d.city, MAX.CITY).toLowerCase().replace(/\s+/g, '-')
      if (d.address !== undefined)     clean.address     = sanitizeText(d.address, MAX.ADDRESS)
      if (d.type !== undefined)        clean.type        = isValidVenueType(sanitizeText(d.type, 20)) ? sanitizeText(d.type, 20) : 'outdoor'
      if (d.isFree !== undefined)      clean.isFree      = Boolean(d.isFree)
      if (d.openTime !== undefined)    clean.openTime    = sanitizeText(d.openTime, 30)
      if (d.mapsUrl !== undefined)     clean.mapsUrl     = isValidUrl(d.mapsUrl) ? sanitizeText(d.mapsUrl, MAX.URL) : ''
      if (d.phone !== undefined)       clean.phone       = sanitizeText(d.phone, MAX.PHONE)
      if (d.photoUrl !== undefined)    clean.photoUrl    = isValidUrl(d.photoUrl) ? sanitizeText(d.photoUrl, MAX.URL) : undefined
      if (d.websiteUrl !== undefined)  clean.websiteUrl  = d.websiteUrl && isValidUrl(d.websiteUrl) ? sanitizeText(d.websiteUrl, MAX.URL) : undefined
      if (d.description !== undefined) clean.description = sanitizeText(d.description, MAX.DESCRIPTION)
      if (d.icon !== undefined)        clean.icon        = sanitizeText(d.icon, 4)
      if (d.tags !== undefined)        clean.tags        = Array.isArray(d.tags) ? d.tags.map((t: unknown) => sanitizeText(String(t), 30)).filter(Boolean) : []
      await updateVenueFull(String(body.id), clean)
      await revalidateAll(typeof clean.city === 'string' ? clean.city : undefined)

    } else if (body.action === 'add') {
      const d = body.data || {}
      const name    = sanitizeText(d.name, MAX.NAME)
      const city    = sanitizeText(d.city, MAX.CITY)
      const address = sanitizeText(d.address, MAX.ADDRESS)
      const type    = sanitizeText(d.type, 20)
      if (!name || !city || !address || !isValidVenueType(type)) {
        return NextResponse.json({ success: false, message: 'Field nama/kota/alamat/tipe wajib & valid' }, { status: 400 })
      }
      const citySlug = city.toLowerCase().replace(/\s+/g, '-')
      const id = await insertVenueAdmin({
        name, city: citySlug, address, type,
        isFree: d.isFree !== false,
        openTime: sanitizeText(d.openTime, 30),
        mapsUrl: d.mapsUrl && isValidUrl(d.mapsUrl) ? sanitizeText(d.mapsUrl, MAX.URL) : '',
        phone: sanitizeText(d.phone, MAX.PHONE) || undefined,
        photoUrl: d.photoUrl && isValidUrl(d.photoUrl) ? sanitizeText(d.photoUrl, MAX.URL) : undefined,
        websiteUrl: d.websiteUrl && isValidUrl(d.websiteUrl) ? sanitizeText(d.websiteUrl, MAX.URL) : undefined,
        description: sanitizeText(d.description, MAX.DESCRIPTION) || undefined,
        icon: sanitizeText(d.icon, 4) || '📍',
        tags: Array.isArray(d.tags) ? d.tags.map((t: unknown) => sanitizeText(String(t), 30)).filter(Boolean) : [],
      })
      await revalidateAll(citySlug)
      return NextResponse.json({ success: true, id })

    } else if (body.action === 'approve-event') {
      if (!body.id) return NextResponse.json({ success: false }, { status: 400 })
      await approveEvent(String(body.id))
      await revalidateAll()

    } else if (body.action === 'delete-event') {
      if (!body.id) return NextResponse.json({ success: false }, { status: 400 })
      await deleteEvent(String(body.id))
      await revalidateAll()

    } else {
      return NextResponse.json({ success: false, message: 'Action tidak dikenal' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[admin/action]', e)
    return NextResponse.json({ success: false, message: 'Gagal memproses' }, { status: 500 })
  }
}
