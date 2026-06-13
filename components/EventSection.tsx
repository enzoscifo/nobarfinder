'use client'

import { useState } from 'react'
import { DBEvent } from '@/lib/db'

const CATEGORIES = [
  { value: 'nobar-bola',  label: '⚽ Nobar Bola' },
  { value: 'nobar-film',  label: '🎬 Nobar Film' },
  { value: 'nobar-anime', label: '🎌 Nobar Anime' },
  { value: 'komunitas',   label: '🤝 Komunitas' },
  { value: 'lainnya',     label: '📅 Lainnya' },
]

const CAT_LABEL: Record<string, string> = {
  'nobar-bola': '⚽ Nobar Bola', 'nobar-film': '🎬 Nobar Film',
  'nobar-anime': '🎌 Nobar Anime', 'komunitas': '🤝 Komunitas', 'lainnya': '📅 Event',
}

function formatEventDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffH = diffMs / 3600000
  const diffD = Math.floor(diffMs / 86400000)
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
  const dateStr = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Jakarta' })

  if (diffH < 0 && diffH > -4) return { badge: '🔴 Sedang Berlangsung', date: timeStr, urgent: true }
  if (diffH < 24) return { badge: '🟡 Hari Ini!', date: timeStr, urgent: true }
  if (diffD === 1) return { badge: '🟠 Besok', date: `${dateStr} · ${timeStr}`, urgent: true }
  return { badge: null, date: `${dateStr} · ${timeStr}`, urgent: false }
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

const MAX_WORDS = 300

interface Props {
  venueId: string
  venueName: string
  initialEvents: DBEvent[]
}

export default function EventSection({ venueId, venueName, initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', eventDate: '', category: 'nobar-bola',
    submitterName: '', submitterContact: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  const wordCount = countWords(form.description)
  const wordOver = wordCount > MAX_WORDS

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (wordOver) return
    setStatus('sending'); setErrMsg('')
    const res = await fetch('/api/submit-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, venueId }),
    })
    const data = await res.json()
    if (data.success) {
      setStatus('success')
      setForm({ title: '', description: '', eventDate: '', category: 'nobar-bola', submitterName: '', submitterContact: '' })
      setTimeout(() => { setShowForm(false); setStatus('idle') }, 3000)
    } else {
      setErrMsg(data.message || 'Gagal mengirim'); setStatus('error')
    }
  }

  // Tanggal minimum: sekarang (format datetime-local)
  const minDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className="mt-10" id="events">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-stone-900 text-xl">
          🗓️ Event di Venue Ini
        </h2>
        <button onClick={() => { setShowForm(s => !s); setStatus('idle') }}
          className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors">
          {showForm ? '✕ Tutup' : '+ Tambah Event'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-green-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-stone-900 text-sm mb-4">📋 Tambah Acara di {venueName}</h3>

          {status === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="font-bold text-green-800 text-sm">Event terkirim!</div>
              <div className="text-xs text-green-600 mt-1">Admin akan mereview dalam 1×24 jam. Terima kasih!</div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">Judul Acara *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Cth: Nobar Final Piala Dunia 2026"
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100" />
              </div>

              {/* Kategori & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">Kategori *</label>
                  <select required value={form.category} onChange={e => set('category', e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-600">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">Tanggal & Jam *</label>
                  <input required type="datetime-local" min={minDate}
                    value={form.eventDate} onChange={e => set('eventDate', e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-600" />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide">Deskripsi Kegiatan</label>
                  <span className={`text-[11px] font-medium ${wordOver ? 'text-red-600' : wordCount > 250 ? 'text-amber-600' : 'text-stone-400'}`}>
                    {wordCount}/{MAX_WORDS} kata
                  </span>
                </div>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={5} placeholder={`Ceritakan detail acara: siapa yang main, jam berapa, fasilitas khusus, dress code, dll. Maksimal ${MAX_WORDS} kata.`}
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none ${
                    wordOver ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-100' : 'border-stone-200 focus:border-green-600 focus:ring-1 focus:ring-green-100'
                  }`} />
                {wordOver && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Deskripsi melebihi {MAX_WORDS} kata. Harap diperpendek.</p>
                )}
              </div>

              {/* Pengirim */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">Nama (opsional)</label>
                  <input value={form.submitterName} onChange={e => set('submitterName', e.target.value)}
                    placeholder="Nama / komunitas"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">Kontak WA / IG *</label>
                  <input required value={form.submitterContact} onChange={e => set('submitterContact', e.target.value)}
                    placeholder="08xx atau @akun"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-600" />
                </div>
              </div>

              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5">⚠️ {errMsg}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-bold py-2.5 rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={status === 'sending' || wordOver}
                  className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
                  {status === 'sending' ? '⏳ Mengirim...' : '📤 Kirim Event'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* List Events */}
      {events.length === 0 ? (
        <div className="bg-white border border-stone-200 border-dashed rounded-2xl py-10 text-center text-stone-400">
          <div className="text-3xl mb-2">📭</div>
          <p className="text-sm">Belum ada event di venue ini.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-3 text-xs font-bold text-green-700 hover:text-green-900 underline underline-offset-2">
            Jadilah yang pertama menambahkan event →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => {
            const { badge, date, urgent } = formatEventDate(ev.eventDate)
            return (
              <div key={ev.id} id={`event-${ev.id}`}
                className={`bg-white border rounded-2xl p-5 ${urgent ? 'border-amber-300' : 'border-stone-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <div className="text-2xl">{
                      ev.category === 'nobar-bola' ? '⚽' :
                      ev.category === 'nobar-film' ? '🎬' :
                      ev.category === 'nobar-anime' ? '🎌' :
                      ev.category === 'komunitas' ? '🤝' : '📅'
                    }</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm">{ev.title}</span>
                      {badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgent ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>
                          {badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      🕐 {date}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {CAT_LABEL[ev.category]}
                      {ev.submitterName && ` · oleh ${ev.submitterName}`}
                    </div>
                    {ev.description && (
                      <p className="text-sm text-stone-600 mt-3 leading-relaxed whitespace-pre-line">{ev.description}</p>
                    )}
                    {ev.submitterContact && (
                      <a href={
                        ev.submitterContact.startsWith('08') || ev.submitterContact.startsWith('+62')
                          ? `https://wa.me/${ev.submitterContact.replace(/^0/, '62').replace(/\D/g, '')}`
                          : ev.submitterContact.startsWith('@')
                          ? `https://instagram.com/${ev.submitterContact.slice(1)}`
                          : '#'
                      } target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-xs text-green-700 hover:text-green-900 font-medium">
                        💬 Hubungi {ev.submitterContact}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
