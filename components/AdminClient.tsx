'use client'

import { useState, useRef } from 'react'
import { DBVenue, DBEvent } from '@/lib/db'

const TYPE_OPTIONS = [
  { value: 'outdoor', label: '🌿 Outdoor' },
  { value: 'cafe',    label: '☕ Kafe' },
  { value: 'resto',   label: '🍽️ Resto' },
  { value: 'mall',    label: '🏬 Mall' },
  { value: 'komunitas', label: '🤝 Komunitas' },
]
const TYPE_LABEL: Record<string, string> = {
  outdoor: 'Outdoor', cafe: 'Kafe', resto: 'Resto', mall: 'Mall', komunitas: 'Komunitas',
}

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────
export function LoginForm() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr('')
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    const data = await res.json()
    if (data.success) location.reload()
    else { setErr(data.message || 'Gagal login'); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAF9]">
      <form onSubmit={login} className="bg-white border border-stone-200 rounded-2xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔐</div>
          <h1 className="font-display font-black text-2xl text-stone-900">Admin NobarFinder</h1>
          <p className="text-xs text-stone-400 mt-1">Masukkan password untuk lanjut</p>
        </div>
        <input
          type="password" value={pw} onChange={e => setPw(e.target.value)}
          placeholder="Password admin" autoFocus
          className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 mb-3"
        />
        {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5 mb-3">⚠️ {err}</div>}
        <button type="submit" disabled={loading}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-colors">
          {loading ? 'Memeriksa...' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────
// Input helper
// ─────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}
const inputCls = "w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100"

// ─────────────────────────────────────────────
// Edit Modal
// ─────────────────────────────────────────────
function EditModal({ venue, onClose, onSaved }: { venue: DBVenue; onClose: () => void; onSaved: (updated: Partial<DBVenue>) => void }) {
  const [form, setForm] = useState({
    name: venue.name,
    city: venue.city,
    address: venue.address,
    type: venue.type,
    isFree: venue.isFree,
    openTime: venue.openTime,
    mapsUrl: venue.mapsUrl,
    phone: venue.phone || '',
    photoUrl: venue.photoUrl || '',
    description: venue.description || '',
    icon: venue.icon,
    tags: venue.tags.join(', '),
    websiteUrl: venue.websiteUrl || '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function uploadPhoto(file: File) {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) set('photoUrl', data.url)
      else setErr('Gagal upload foto')
    } catch { setErr('Gagal upload foto') }
    setUploading(false)
  }

  async function save() {
    if (!form.name.trim() || !form.city.trim() || !form.address.trim()) {
      setErr('Nama, kota, dan alamat wajib diisi'); return
    }
    setBusy(true); setErr('')
    const data = {
      name: form.name.trim(),
      city: form.city.trim().toLowerCase().replace(/\s+/g, '-'),
      address: form.address.trim(),
      type: form.type,
      isFree: form.isFree,
      openTime: form.openTime,
      mapsUrl: form.mapsUrl,
      phone: form.phone || undefined,
      photoUrl: form.photoUrl || undefined,
      description: form.description || undefined,
      icon: form.icon,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      websiteUrl: form.websiteUrl || undefined,
    }
    const res = await fetch('/api/admin/action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', id: venue.id, data }),
    })
    const result = await res.json()
    if (result.success) {
      onSaved({ ...data, tags: data.tags, isFree: data.isFree })
      onClose()
    } else {
      setErr(result.message || 'Gagal menyimpan'); setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-900">✏️ Edit Venue</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <Field label="Nama Venue">
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kota (slug)">
              <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="yogyakarta" />
            </Field>
            <Field label="Tipe">
              <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Alamat">
            <textarea className={inputCls + ' h-16 resize-none'} value={form.address} onChange={e => set('address', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam Buka (cth: 18.00–24.00)">
              <input className={inputCls} value={form.openTime} onChange={e => set('openTime', e.target.value)} />
            </Field>
            <Field label="Icon Emoji">
              <input className={inputCls} value={form.icon} onChange={e => set('icon', e.target.value)} maxLength={4} />
            </Field>
          </div>
          <Field label="Google Maps URL">
            <input className={inputCls} value={form.mapsUrl} onChange={e => set('mapsUrl', e.target.value)} placeholder="https://maps.google.com/..." />
          </Field>
          <Field label="Nomor Telepon / WA">
            <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Website / Media Sosial (satu link)">
            <input className={inputCls} value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)}
              placeholder="https://instagram.com/namaakun atau https://namadomain.com" />
          </Field>
          <Field label="Tag (pisah koma, cth: WiFi, AC, Proyektor)">
            <input className={inputCls} value={form.tags} onChange={e => set('tags', e.target.value)} />
          </Field>
          <Field label="Deskripsi">
            <textarea className={inputCls + ' h-20 resize-none'} value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
          <Field label="Foto">
            <div className="space-y-2">
              {form.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photoUrl} alt="foto" className="w-full h-32 object-cover rounded-lg" />
              )}
              <input className={inputCls} value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} placeholder="URL foto (atau upload di bawah)" />
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full bg-stone-50 border border-stone-200 text-stone-600 text-xs font-bold py-2 rounded-lg hover:bg-stone-100 transition-colors">
                {uploading ? '⏳ Mengupload...' : '📷 Upload Foto Baru'}
              </button>
            </div>
          </Field>
          <Field label="Biaya">
            <div className="flex gap-3">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => set('isFree', v)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                    form.isFree === v ? 'bg-green-700 text-white border-green-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}>
                  {v ? '✓ Gratis' : '💰 Berbayar'}
                </button>
              ))}
            </div>
          </Field>
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5">⚠️ {err}</div>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-stone-100">
          <button onClick={onClose} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-bold py-2.5 rounded-xl">
            Batal
          </button>
          <button onClick={save} disabled={busy}
            className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
            {busy ? 'Menyimpan...' : '💾 Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tambah Venue Modal
// ─────────────────────────────────────────────
function AddVenueModal({ onClose, onAdded }: { onClose: () => void; onAdded: (v: DBVenue) => void }) {
  const [form, setForm] = useState({
    name: '', city: '', address: '', type: 'outdoor',
    isFree: true, openTime: '', mapsUrl: '',
    phone: '', photoUrl: '', description: '', icon: '📍', tags: '', websiteUrl: '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function uploadPhoto(file: File) {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) set('photoUrl', data.url)
      else setErr('Gagal upload foto')
    } catch { setErr('Gagal upload foto') }
    setUploading(false)
  }

  async function submit() {
    if (!form.name.trim() || !form.city.trim() || !form.address.trim()) {
      setErr('Nama, kota, dan alamat wajib diisi'); return
    }
    setBusy(true); setErr('')
    const data = {
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      type: form.type,
      isFree: form.isFree,
      openTime: form.openTime,
      mapsUrl: form.mapsUrl,
      phone: form.phone || undefined,
      photoUrl: form.photoUrl || undefined,
      description: form.description || undefined,
      icon: form.icon || '📍',
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      websiteUrl: form.websiteUrl || undefined,
    }
    const res = await fetch('/api/admin/action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', data }),
    })
    const result = await res.json()
    if (result.success) {
      const newVenue: DBVenue = {
        id: result.id,
        ...data,
        type: data.type as DBVenue['type'],
        tags: data.tags,
        status: 'approved',
        createdAt: new Date().toISOString(),
      }
      onAdded(newVenue)
      onClose()
    } else {
      setErr(result.message || 'Gagal menambah venue'); setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-900">➕ Tambah Venue Manual</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-xs text-green-800">
            ✅ Venue yang ditambah lewat form ini langsung <strong>approved</strong> dan tampil di situs publik.
          </div>
          <Field label="Nama Venue *">
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Cth: Warung Nobar Mbah Jono" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kota *">
              <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="yogyakarta" />
            </Field>
            <Field label="Tipe *">
              <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Alamat *">
            <textarea className={inputCls + ' h-16 resize-none'} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Jl. Malioboro No. 1, Yogyakarta" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam Buka">
              <input className={inputCls} value={form.openTime} onChange={e => set('openTime', e.target.value)} placeholder="18.00–24.00" />
            </Field>
            <Field label="Icon Emoji">
              <input className={inputCls} value={form.icon} onChange={e => set('icon', e.target.value)} maxLength={4} />
            </Field>
          </div>
          <Field label="Google Maps URL">
            <input className={inputCls} value={form.mapsUrl} onChange={e => set('mapsUrl', e.target.value)} placeholder="https://maps.app.goo.gl/..." />
          </Field>
          <Field label="Nomor Telepon / WA">
            <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08xx-xxxx-xxxx" />
          </Field>
          <Field label="Website / Media Sosial (satu link)">
            <input className={inputCls} value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)}
              placeholder="https://instagram.com/namaakun atau https://namadomain.com" />
          </Field>
          <Field label="Tag (pisah koma)">
            <input className={inputCls} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="WiFi, AC, Proyektor, Parkir Luas" />
          </Field>
          <Field label="Deskripsi">
            <textarea className={inputCls + ' h-20 resize-none'} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ceritakan suasana, fasilitas, atau keistimewaan venue ini..." />
          </Field>
          <Field label="Foto">
            <div className="space-y-2">
              {form.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photoUrl} alt="preview" className="w-full h-32 object-cover rounded-lg" />
              )}
              <input className={inputCls} value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} placeholder="URL foto (opsional)" />
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full bg-stone-50 border border-stone-200 text-stone-600 text-xs font-bold py-2 rounded-lg hover:bg-stone-100 transition-colors">
                {uploading ? '⏳ Mengupload...' : '📷 Upload Foto'}
              </button>
            </div>
          </Field>
          <Field label="Biaya">
            <div className="flex gap-3">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => set('isFree', v)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                    form.isFree === v ? 'bg-green-700 text-white border-green-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}>
                  {v ? '✓ Gratis' : '💰 Berbayar'}
                </button>
              ))}
            </div>
          </Field>
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5">⚠️ {err}</div>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-stone-100">
          <button onClick={onClose} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-bold py-2.5 rounded-xl">
            Batal
          </button>
          <button onClick={submit} disabled={busy}
            className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
            {busy ? 'Menambahkan...' : '✅ Tambah & Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Venue Row (dengan tombol Edit)
// ─────────────────────────────────────────────
function VenueRow({ venue: initialVenue }: { venue: DBVenue }) {
  const [venue, setVenue] = useState(initialVenue)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<'approved' | 'deleted' | null>(null)
  const [editing, setEditing] = useState(false)

  async function act(action: 'approve' | 'delete') {
    if (action === 'delete' && !confirm(`Hapus permanen "${venue.name}"?`)) return
    setBusy(true)
    const res = await fetch('/api/admin/action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id: venue.id }),
    })
    const data = await res.json()
    if (data.success) setDone(action === 'approve' ? 'approved' : 'deleted')
    else { alert(data.message || 'Gagal'); setBusy(false) }
  }

  function handleSaved(updated: Partial<DBVenue>) {
    setVenue(v => ({ ...v, ...updated }))
  }

  if (done === 'deleted') return null

  const isPending = venue.status === 'pending' && done !== 'approved'

  return (
    <>
      {editing && (
        <EditModal venue={venue} onClose={() => setEditing(false)} onSaved={handleSaved} />
      )}
      <div className={`bg-white border rounded-xl p-4 ${isPending ? 'border-amber-300' : 'border-stone-200'}`}>
        <div className="flex items-start gap-3">
          {venue.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.photoUrl} alt={venue.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center text-2xl shrink-0">{venue.icon}</div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-900 text-sm">{venue.name}</span>
              {isPending
                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">PENDING</span>
                : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">APPROVED</span>}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{venue.city}</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">📍 {venue.address}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {TYPE_LABEL[venue.type]} · {venue.isFree ? 'Gratis' : 'Berbayar'} · {venue.openTime || '-'} WIB
            </p>
            {venue.tags?.length > 0 && (
              <p className="text-[10px] text-stone-400 mt-0.5">{venue.tags.join(' · ')}</p>
            )}
            {venue.description && <p className="text-[11px] text-stone-500 mt-1 italic line-clamp-1">{venue.description}</p>}
            {venue.submitterContact && (
              <p className="text-[11px] text-stone-400 mt-1">👤 {venue.submitterName || '-'} · {venue.submitterContact}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100 flex-wrap">
          {isPending && (
            <button onClick={() => act('approve')} disabled={busy}
              className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-xs font-bold py-2 rounded-lg transition-colors min-w-[70px]">
              {busy ? '...' : '✓ Approve'}
            </button>
          )}
          {done === 'approved' && (
            <span className="flex-1 text-center text-xs font-bold text-green-700 py-2">✓ Disetujui</span>
          )}
          <button onClick={() => setEditing(true)}
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2 rounded-lg transition-colors border border-blue-200 min-w-[70px]">
            ✏️ Edit
          </button>
          <button onClick={() => act('delete')} disabled={busy}
            className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 text-xs font-bold py-2 rounded-lg transition-colors border border-red-200 min-w-[70px]">
            🗑️ Hapus
          </button>
          {venue.mapsUrl && (
            <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer"
              className="px-3 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold py-2 rounded-lg transition-colors flex items-center">
              Maps
            </a>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
export function AdminDashboard({ venues: initialVenues, events: initialEvents }: { venues: DBVenue[]; events: DBEvent[] }) {
  const [venues, setVenues] = useState(initialVenues)
  const [events, setEvents] = useState(initialEvents)
  const [tab, setTab] = useState<'venues' | 'events'>('venues')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const [showAdd, setShowAdd] = useState(false)

  const pendingVenues = venues.filter(v => v.status === 'pending')
  const approvedVenues = venues.filter(v => v.status === 'approved')
  const shownVenues = filter === 'all' ? venues : filter === 'pending' ? pendingVenues : approvedVenues

  const pendingEvents = events.filter(e => e.status === 'pending')
  const flaggedEvents = events.filter(e => e.status === 'flagged')
  const approvedEvents = events.filter(e => e.status === 'approved')
  const shownEvents = filter === 'all' ? events : filter === 'pending' ? [...pendingEvents, ...flaggedEvents] : approvedEvents

  function handleAdded(venue: DBVenue) {
    setVenues(vs => [venue, ...vs])
    setFilter('approved')
  }

  const totalPending = pendingVenues.length + pendingEvents.length + flaggedEvents.length

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {showAdd && (
        <AddVenueModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />
      )}

      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-display font-black text-xl">
            NOBAR<span className="text-green-700">FINDER</span> <span className="text-stone-400 text-sm font-normal">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            {tab === 'venues' && (
              <button onClick={() => setShowAdd(true)}
                className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors">
                ➕ Tambah Venue
              </button>
            )}
            <a href="/" className="text-xs text-stone-500 hover:text-green-700">← Situs</a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Venue', count: venues.length, color: 'stone' },
            { label: 'Event', count: events.length, color: 'stone' },
            { label: 'Pending', count: totalPending, color: totalPending > 0 ? 'amber' : 'stone' },
            { label: 'Approved', count: approvedVenues.length + approvedEvents.length, color: 'green' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-stone-200 rounded-xl p-3 text-center">
              <div className={`text-xl font-black ${s.color === 'amber' && s.count > 0 ? 'text-amber-600' : s.color === 'green' ? 'text-green-700' : 'text-stone-700'}`}>{s.count}</div>
              <div className="text-[10px] text-stone-500 font-medium uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => { setTab('venues'); setFilter('pending') }}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${tab === 'venues' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-900'}`}>
            🏟️ Venue {pendingVenues.length > 0 && <span className="ml-1 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingVenues.length}</span>}
          </button>
          <button onClick={() => { setTab('events'); setFilter('pending') }}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${tab === 'events' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-900'}`}>
            🗓️ Event {(pendingEvents.length + flaggedEvents.length) > 0 && <span className="ml-1 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingEvents.length + flaggedEvents.length}</span>}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { k: 'pending', label: `Perlu Tinjau (${tab === 'venues' ? pendingVenues.length : pendingEvents.length + flaggedEvents.length})` },
            { k: 'approved', label: `Approved (${tab === 'venues' ? approvedVenues.length : approvedEvents.length})` },
            { k: 'all', label: `Semua (${tab === 'venues' ? venues.length : events.length})` },
          ] as const).map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === f.k ? 'bg-green-700 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-900'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'venues' ? (
          shownVenues.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl py-16 text-center text-stone-400">
              <div className="text-3xl mb-2">{filter === 'pending' ? '📭' : '🏟️'}</div>
              <p className="text-sm">{filter === 'pending' ? 'Tidak ada venue pending' : 'Belum ada venue'}</p>
              {filter !== 'pending' && (
                <button onClick={() => setShowAdd(true)}
                  className="mt-4 bg-green-700 text-white text-xs font-bold px-5 py-2 rounded-full hover:bg-green-800 transition-colors">
                  ➕ Tambah Venue Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {shownVenues.map(v => <VenueRow key={v.id} venue={v} />)}
            </div>
          )
        ) : (
          shownEvents.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl py-16 text-center text-stone-400">
              <div className="text-3xl mb-2">{filter === 'pending' ? '📭' : '🗓️'}</div>
              <p className="text-sm">{filter === 'pending' ? 'Tidak ada event pending' : 'Belum ada event'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shownEvents.map(e => <EventRow key={e.id} event={e} />)}
            </div>
          )
        )}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────
// Event Row (admin)
// ─────────────────────────────────────────────

const CAT_LABEL_ADMIN: Record<string, string> = {
  'nobar-bola': '⚽ Nobar Bola', 'nobar-film': '🎬 Nobar Film',
  'nobar-anime': '🎌 Nobar Anime', 'komunitas': '🤝 Komunitas', 'lainnya': '📅 Event',
}

export function EventRow({ event: initial }: { event: DBEvent }) {
  const [ev, setEv] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<'approved' | 'deleted' | null>(null)

  async function act(action: 'approve-event' | 'delete-event') {
    if (action === 'delete-event' && !confirm(`Hapus event "${ev.title}"?`)) return
    setBusy(true)
    const res = await fetch('/api/admin/action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id: ev.id }),
    })
    const data = await res.json()
    if (data.success) setDone(action === 'approve-event' ? 'approved' : 'deleted')
    else { alert(data.message || 'Gagal'); setBusy(false) }
  }

  if (done === 'deleted') return null
  const isPending = ev.status === 'pending' && done !== 'approved'
  const isFlagged = ev.status === 'flagged'
  const d = new Date(ev.eventDate)
  const dateStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`bg-white border rounded-xl p-4 ${isFlagged ? 'border-red-300 bg-red-50/30' : isPending ? 'border-amber-300' : 'border-stone-200'}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">{
          ev.category === 'nobar-bola' ? '⚽' : ev.category === 'nobar-film' ? '🎬' :
          ev.category === 'nobar-anime' ? '🎌' : ev.category === 'komunitas' ? '🤝' : '📅'
        }</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-stone-900 text-sm">{ev.title}</span>
            {isFlagged
              ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">🚩 DILAPORKAN</span>
              : isPending
              ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">PENDING</span>
              : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">APPROVED</span>}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            📍 {ev.venueName || ev.venueId} · {CAT_LABEL_ADMIN[ev.category]}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">🕐 {dateStr} · {timeStr} WIB</p>
          {ev.description && <p className="text-[11px] text-stone-500 mt-1 italic line-clamp-2">{ev.description}</p>}
          {ev.submitterContact && (
            <p className="text-[11px] text-stone-400 mt-1">👤 {ev.submitterName || '-'} · {ev.submitterContact}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
        {(isPending || isFlagged) && (
          <button onClick={() => act('approve-event')} disabled={busy}
            className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-xs font-bold py-2 rounded-lg transition-colors">
            {busy ? '...' : isFlagged ? '✓ Pulihkan' : '✓ Approve'}
          </button>
        )}
        {done === 'approved' && (
          <span className="flex-1 text-center text-xs font-bold text-green-700 py-2">✓ Disetujui</span>
        )}
        <button onClick={() => act('delete-event')} disabled={busy}
          className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 text-xs font-bold py-2 rounded-lg transition-colors border border-red-200">
          🗑️ Hapus
        </button>
      </div>
    </div>
  )
}
