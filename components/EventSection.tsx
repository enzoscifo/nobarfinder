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

const REPORT_REASONS = [
  'Informasi tidak akurat / palsu',
  'Event sudah dibatalkan',
  'Spam atau promosi',
  'Konten tidak pantas',
  'Lainnya',
]

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

// ── Validasi kontak (sama dengan server) ──
function validateContact(v: string) {
  const isWA = /^(\+62|62|0)[\d]{9,12}$/.test(v.replace(/[\s-]/g, ''))
  const isSocmed = /^@[\w.]{3,30}$/.test(v)
  return isWA || isSocmed
}

// ─────────────────────────────────────────────
// Report Modal
// ─────────────────────────────────────────────
function ReportModal({ eventId, eventTitle, onClose }: { eventId: string; eventTitle: string; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function submit() {
    if (!reason) return
    setStatus('sending')
    const res = await fetch('/api/report-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, reason }),
    })
    const data = await res.json()
    if (data.success) setStatus('done')
    else { setErrMsg(data.message || 'Gagal melaporkan'); setStatus('error') }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        {status === 'done' ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">✅</div>
            <div className="font-bold text-stone-900 text-sm">Laporan diterima</div>
            <p className="text-xs text-stone-500 mt-1">Terima kasih. Admin akan meninjau event ini.</p>
            <button onClick={onClose} className="mt-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-5 py-2 rounded-full">
              Tutup
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-sm">🚩 Laporkan Event</h3>
              <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl leading-none">×</button>
            </div>
            <p className="text-xs text-stone-500 mb-3 line-clamp-2">
              <span className="font-medium text-stone-700">{eventTitle}</span>
            </p>
            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-colors ${
                    reason === r ? 'border-red-400 bg-red-50 text-red-800 font-semibold' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            {status === 'error' && (
              <p className="text-xs text-red-600 mb-3">⚠️ {errMsg}</p>
            )}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 bg-stone-100 text-stone-700 text-xs font-bold py-2.5 rounded-xl hover:bg-stone-200">
                Batal
              </button>
              <button onClick={submit} disabled={!reason || status === 'sending'}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
                {status === 'sending' ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Event Card
// ─────────────────────────────────────────────
function EventCard({ ev }: { ev: DBEvent }) {
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const { badge, date, urgent } = formatEventDate(ev.eventDate)

  const contactHref = ev.submitterContact
    ? ev.submitterContact.startsWith('08') || ev.submitterContact.startsWith('+62') || ev.submitterContact.startsWith('62')
      ? `https://wa.me/${ev.submitterContact.replace(/^0/, '62').replace(/\D/g, '')}`
      : ev.submitterContact.startsWith('@')
      ? `https://instagram.com/${ev.submitterContact.slice(1)}`
      : null
    : null

  return (
    <>
      {reporting && (
        <ReportModal
          eventId={ev.id}
          eventTitle={ev.title}
          onClose={() => { setReporting(false); setReported(true) }}
        />
      )}

      <div id={`event-${ev.id}`}
        className={`bg-white border rounded-2xl p-5 ${urgent ? 'border-amber-300' : 'border-stone-200'}`}>

        {/* ── LAPISAN 2: Disclaimer user-generated ── */}
        <div className="flex items-center gap-1.5 mb-3 bg-stone-50 border border-stone-100 rounded-lg px-3 py-1.5">
          <span className="text-[10px]">ℹ️</span>
          <span className="text-[10px] text-stone-500 leading-tight">
            Informasi ini dikirim oleh pengguna dan <strong>belum diverifikasi</strong> oleh NobarFinder.
            Hubungi kontak yang tertera untuk konfirmasi.
          </span>
        </div>

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
            <div className="text-xs text-stone-500 mt-1">🕐 {date}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {CAT_LABEL[ev.category]}
              {ev.submitterName && ` · oleh ${ev.submitterName}`}
            </div>
            {ev.description && (
              <p className="text-sm text-stone-600 mt-3 leading-relaxed whitespace-pre-line">{ev.description}</p>
            )}

            {/* ── LAPISAN 3: Kontak tervalidasi ── */}
            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
              {ev.submitterContact && contactHref && (
                <a href={contactHref} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium">
                  💬 Konfirmasi ke {ev.submitterContact}
                </a>
              )}
              {ev.submitterContact && !contactHref && (
                <span className="text-xs text-stone-400">{ev.submitterContact}</span>
              )}

              {/* ── LAPISAN 4: Tombol Laporkan ── */}
              {!reported ? (
                <button onClick={() => setReporting(true)}
                  className="text-[11px] text-stone-400 hover:text-red-600 transition-colors flex items-center gap-1 ml-auto">
                  🚩 Laporkan
                </button>
              ) : (
                <span className="text-[11px] text-stone-400 ml-auto">✓ Dilaporkan</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Main EventSection
// ─────────────────────────────────────────────
interface Props {
  venueId: string
  venueName: string
  initialEvents: DBEvent[]
}

export default function EventSection({ venueId, venueName, initialEvents }: Props) {
  const [events] = useState(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', eventDate: '', category: 'nobar-bola',
    submitterName: '', submitterContact: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [contactErr, setContactErr] = useState('')

  const wordCount = countWords(form.description)
  const wordOver = wordCount > MAX_WORDS

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'submitterContact') {
      setContactErr(v && !validateContact(v) ? 'Format: 08xxxxxxxxxx atau @namaakun' : '')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (wordOver || contactErr) return
    if (!validateContact(form.submitterContact)) {
      setContactErr('Format: 08xxxxxxxxxx atau @namaakun'); return
    }
    setStatus('sending'); setErrMsg('')
    const res = await fetch('/api/submit-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, venueId }),
    })
    const data = await res.json()
    if (data.success) {
      setStatus('success')
      setForm({ title: '', description: '', eventDate: '', category: 'nobar-bola', submitterName: '', submitterContact: '' })
      setTimeout(() => { setShowForm(false); setStatus('idle') }, 3500)
    } else {
      setErrMsg(data.message || 'Gagal mengirim'); setStatus('error')
    }
  }

  const minDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className="mt-10" id="events">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-stone-900 text-xl">🗓️ Event di Venue Ini</h2>
        <button onClick={() => { setShowForm(s => !s); setStatus('idle') }}
          className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors">
          {showForm ? '✕ Tutup' : '+ Tambah Event'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-green-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-stone-900 text-sm mb-1">📋 Tambah Acara di {venueName}</h3>

          {/* Disclaimer di form */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 text-[11px] text-amber-800 leading-relaxed">
            ⚠️ Pastikan informasi yang kamu masukkan <strong>akurat dan dapat diverifikasi</strong>.
            Event palsu atau menyesatkan akan dihapus dan dapat dilaporkan oleh pengguna lain.
            Cantumkan kontak aktif agar pengunjung bisa mengkonfirmasi langsung.
          </div>

          {status === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="font-bold text-green-800 text-sm">Event terkirim!</div>
              <div className="text-xs text-green-600 mt-1">Admin akan mereview dalam 1×24 jam. Terima kasih!</div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">Judul Acara *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Cth: Nobar Final Piala Dunia 2026"
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-100" />
              </div>

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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide">Deskripsi Kegiatan</label>
                  <span className={`text-[11px] font-medium ${wordOver ? 'text-red-600' : wordCount > 250 ? 'text-amber-600' : 'text-stone-400'}`}>
                    {wordCount}/{MAX_WORDS} kata
                  </span>
                </div>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={5} placeholder={`Ceritakan detail acara: siapa yang main, jam berapa, fasilitas khusus, dress code, dll. Maks ${MAX_WORDS} kata.`}
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none ${
                    wordOver ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-green-600 focus:ring-1 focus:ring-green-100'
                  }`} />
                {wordOver && <p className="text-xs text-red-600 mt-1">⚠️ Melebihi {MAX_WORDS} kata.</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">Nama / Komunitas</label>
                  <input value={form.submitterName} onChange={e => set('submitterName', e.target.value)}
                    placeholder="Opsional"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">
                    Kontak WA / IG * <span className="text-stone-300 font-normal normal-case">untuk verifikasi</span>
                  </label>
                  <input required value={form.submitterContact} onChange={e => set('submitterContact', e.target.value)}
                    placeholder="08xx... atau @akun"
                    className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                      contactErr ? 'border-red-400 focus:border-red-400' : 'border-stone-200 focus:border-green-600 focus:ring-1 focus:ring-green-100'
                    }`} />
                  {contactErr && <p className="text-[11px] text-red-600 mt-1">{contactErr}</p>}
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
                <button type="submit" disabled={status === 'sending' || wordOver || !!contactErr}
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
          {events.map(ev => <EventCard key={ev.id} ev={ev} />)}
        </div>
      )}
    </div>
  )
}
