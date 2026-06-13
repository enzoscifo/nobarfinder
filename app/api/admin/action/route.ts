import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/auth'
import { approveVenue, deleteVenue, updateVenue, updateVenueFull, insertVenueAdmin } from '@/lib/db'

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
      await approveVenue(body.id)

    } else if (body.action === 'delete') {
      await deleteVenue(body.id)

    } else if (body.action === 'update') {
      // legacy partial update
      await updateVenue(body.id, body.fields || {})

    } else if (body.action === 'edit') {
      // full edit semua field
      if (!body.id) return NextResponse.json({ success: false, message: 'ID tidak ada' }, { status: 400 })
      await updateVenueFull(body.id, body.data || {})

    } else if (body.action === 'add') {
      // tambah venue manual oleh admin (langsung approved)
      const d = body.data || {}
      if (!d.name || !d.city || !d.address || !d.type) {
        return NextResponse.json({ success: false, message: 'Field nama/kota/alamat/tipe wajib diisi' }, { status: 400 })
      }
      const id = await insertVenueAdmin({
        name: d.name,
        city: d.city.toLowerCase().replace(/\s+/g, '-'),
        address: d.address,
        type: d.type,
        isFree: d.isFree !== false,
        openTime: d.openTime || '',
        mapsUrl: d.mapsUrl || '',
        phone: d.phone || undefined,
        photoUrl: d.photoUrl || undefined,
        description: d.description || undefined,
        icon: d.icon || '📍',
        tags: d.tags || [],
      })
      revalidatePath('/', 'layout')
      return NextResponse.json({ success: true, id })

    } else {
      return NextResponse.json({ success: false, message: 'Action tidak dikenal' }, { status: 400 })
    }

    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[admin/action]', e)
    return NextResponse.json({ success: false, message: 'Gagal memproses' }, { status: 500 })
  }
}
