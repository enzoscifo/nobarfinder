'use client'

import { useState } from 'react'
import { DBVenue } from '@/lib/db'

const TYPE_LABEL: Record<string, string> = {
  outdoor: 'Outdoor', cafe: 'Kafe', resto: 'Resto', mall: 'Mall', komunitas: 'Komunitas',
}

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

function VenueRow({ venue }: { venue: DBVenue }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<'approved' | 'deleted' | null>(null)

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

  if (done === 'deleted') return null

  const isPending = venue.status === 'pending' && done !== 'approved'

  return (
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
          {venue.description && <p className="text-[11px] text-stone-500 mt-1 italic">{venue.description}</p>}
          {venue.submitterContact && (
            <p className="text-[11px] text-stone-400 mt-1">👤 {venue.submitterName || '-'} · {venue.submitterContact}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
        {isPending && (
          <button onClick={() => act('approve')} disabled={busy}
            className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-xs font-bold py-2 rounded-lg transition-colors">
            {busy ? '...' : '✓ Approve'}
          </button>
        )}
        {done === 'approved' && (
          <span className="flex-1 text-center text-xs font-bold text-green-700 py-2">✓ Disetujui</span>
        )}
        <button onClick={() => act('delete')} disabled={busy}
          className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 text-xs font-bold py-2 rounded-lg transition-colors border border-red-200">
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
  )
}

export function AdminDashboard({ venues }: { venues: DBVenue[] }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const pending = venues.filter(v => v.status === 'pending')
  const approved = venues.filter(v => v.status === 'approved')
  const shown = filter === 'all' ? venues : filter === 'pending' ? pending : approved

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-display font-black text-xl">
            NOBAR<span className="text-green-700">FINDER</span> <span className="text-stone-400 text-sm font-normal">Admin</span>
          </div>
          <a href="/" className="text-xs text-stone-500 hover:text-green-700">← Lihat Situs</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          {([
            { k: 'pending', label: `Pending (${pending.length})` },
            { k: 'approved', label: `Approved (${approved.length})` },
            { k: 'all', label: `Semua (${venues.length})` },
          ] as const).map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === f.k ? 'bg-green-700 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-900'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl py-16 text-center text-stone-400">
            <div className="text-3xl mb-2">📭</div>
            {filter === 'pending' ? 'Tidak ada submission pending' : 'Belum ada venue'}
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(v => <VenueRow key={v.id} venue={v} />)}
          </div>
        )}
      </main>
    </div>
  )
}
