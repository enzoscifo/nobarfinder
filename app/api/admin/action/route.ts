import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/auth'
import { approveVenue, deleteVenue, updateVenue } from '@/lib/db'

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ success: false, message: 'Tidak diizinkan' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.action || !body?.id) {
    return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 })
  }

  try {
    if (body.action === 'approve') {
      await approveVenue(body.id)
    } else if (body.action === 'delete') {
      await deleteVenue(body.id)
    } else if (body.action === 'update') {
      await updateVenue(body.id, body.fields || {})
    } else {
      return NextResponse.json({ success: false, message: 'Action tidak dikenal' }, { status: 400 })
    }

    // Revalidate halaman publik agar perubahan langsung tampil
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[admin/action]', e)
    return NextResponse.json({ success: false, message: 'Gagal memproses' }, { status: 500 })
  }
}
