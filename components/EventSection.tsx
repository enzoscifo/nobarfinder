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
  const diffH = (d.getTime() - now.getTime()) / 3600000
  const diffD = Math.floor(diffH / 24)
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
  const dateStr = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Jakarta' })
  if (diffH < 0 && diffH > -4) return { badge: '🔴 Sedang Berlangsung', date: timeStr, urgent: true }
  if (diffH < 24) return { badge: '🟡 Hari Ini!', date: timeStr, urgent: true }
  if (diffD === 1) return { badge: '🟠 Besok', date: `${dateStr} · ${timeStr}`, urgent: true }
  return { badge: null, date: `${dateStr} · ${timeStr}`, urgent: false }
}

function countWords(text: string) { return text.trim().split(/\s+/).filter(Boolean).length }
const MAX_WORDS = 300

function validateContact(v: string) {
  return /^(\+62|62|0)[\d]{9,12}$/.test(v.replace(/[\s-]/g, '')) || /^@[\w.]{3,30}$/.test(v)
}

// ── Shared primitives ────────────────────────────────────────────
const inputCls = [
  'w-full bg-white border border-stone-200 rounded-xl',
  'px-4 py-3 min-h-[48px] text-base',
  'focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100',
  'transition-all appearance-none',
].join(' ')

const selectCls = inputCls + ' bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23888\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center] pr-10'

// ── Report Modal ─────────────────────────────────────────────────
function ReportModal({ eventId, eventTitle, onClose }: {
  eventId: string; eventTitle: string; onClose: () => void
}) {
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
      role="dialog" aria-modal="true" aria-label="Laporkan Event">
      {/* Backdrop tap-to-close */}
      <div className="absolute inset-0" onClick={onClose} />
      {/* Sheet — bottom sheet di mobile, modal di sm+ */}
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl px-5 pt-5 pb-8 sm:pb-5">
        {/* Drag handle di mobile */}
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4 sm:hidden" aria-hidden="true" />

        {status === 'done' ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-bold text-stone-900">Laporan diterima</div>
            <p className="text-sm text-stone-500 mt-1 mb-5">Terima kasih. Admin akan meninjau event ini.</p>
            <button onClick={onClose}
              className="w-full bg-stone-100 text-stone-700 font-bold py-3.5 rounded-xl text-sm">
              Tutup
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900">🚩 Laporkan Event</h3>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xl rounded-full"
                aria-label="Tutup">×</button>
            </div>
            <p className="text-xs text-stone-500 mb-4 line-clamp-2 bg-stone-50 rounded-lg px-3 py-2">
              {eventTitle}
            </p>
            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`w-full text-left text-sm px-4 py-3.5 min-h-[48px] rounded-xl border transition-colors ${
                    reason === r
                      ? 'border-red-400 bg-red-50 text-red-800 font-semibold'
                      : 'border-stone-200 text-stone-600 active:bg-stone-50'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            {status === 'error' && <p className="text-sm text-red-600 mb-3">⚠️ {errMsg}</p>}
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 bg-stone-100 text-stone-700 text-sm font-bold py-3.5 rounded-xl">
                Batal
              </button>
              <button onClick={submit} disabled={!reason || status === 'sending'}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold py-3.5 rounded-xl transition-colors">
                {status === 'sending' ? 'Mengirim…' : 'Kirim Laporan'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Event Card ───────────────────────────────────────────────────
function EventCard({ ev }: { ev: DBEvent }) {
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const { badge, date, urgent } = formatEventDate(ev.eventDate)

  const contactHref = ev.submitterContact
    ? /^(0|62|\+62)/.test(ev.submitterContact)
      ? `https://wa.me/${ev.submitterContact.replace(/^0/, '62').replace(/\D/g, '')}`
      : ev.submitterContact.startsWith('@')
      ? `https://instagram.com/${ev.submitterContact.slice(1)}`
      : null
    : null

  return (
    <>
      {reporting && (
        <ReportModal eventId={ev.id} eventTitle={ev.title}
          onClose={() => { setReporting(false); setReported(true) }} />
      )}
      <div id={`event-${ev.id}`}
        className={`bg-white border rounded-2xl p-4 sm:p-5 ${urgent ? 'border-amber-300' : 'border-stone-200'}`}>

        {/* Disclaimer */}
        <div className="flex items-start gap-1.5 mb-3 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
          <span className="text-xs shrink-0 mt-0.5" aria-hidden="true">ℹ️</span>
          <span className="text-xs text-stone-500 leading-snug">
            Dikirim pengguna · <strong>belum diverifikasi</strong> NobarFinder. Hubungi kontak untuk konfirmasi.
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0 mt-0.5" aria-hidden="true">{
            ev.category === 'nobar-bola' ? '⚽'
            : ev.category === 'nobar-film' ? '🎬'
            : ev.category === 'nobar-anime' ? '🎌'
            : ev.category === 'komunitas' ? '🤝' : '📅'
          }</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <span className="font-bold text-stone-900 text-base leading-snug">{ev.title}</span>
              {badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${urgent ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>
                  {badge}
                </span>
              )}
            </div>
            <div className="text-sm text-stone-500 mt-1">🕐 {date}</div>
            <div className="text-xs text-stone-400 mt-0.5">
              {CAT_LABEL[ev.category]}{ev.submitterName && ` · oleh ${ev.submitterName}`}
            </div>
            {ev.description && (
              <p className="text-sm text-stone-600 mt-3 leading-relaxed whitespace-pre-line">{ev.description}</p>
            )}
            {/* Aksi baris bawah */}
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              {contactHref ? (
                <a href={contactHref} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-green-700 font-semibold min-h-[44px]">
                  💬 Konfirmasi ke {ev.submitterContact}
                </a>
              ) : ev.submitterContact ? (
                <span className="text-sm text-stone-400">{ev.submitterContact}</span>
              ) : null}

              {!reported ? (
                <button onClick={() => setReporting(true)}
                  className="text-xs text-stone-400 hover:text-red-600 transition-colors min-h-[44px] px-2 ml-auto flex items-center gap-1">
                  🚩 Laporkan
                </button>
              ) : (
                <span className="text-xs text-stone-400 ml-auto">✓ Dilaporkan</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main EventSection ────────────────────────────────────────────
export default function EventSection({ venueId, venueName, initialEvents }: {
  venueId: string; venueName: string; initialEvents: DBEvent[]
}) {
  const [events] = useState(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', eventDate: '',
    category: 'nobar-bola', submitterName: '', submitterContact: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [contactErr, setContactErr] = useState('')

  const wordCount = countWords(form.description)
  const wordOver = wordCount > MAX_WORDS

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'submitterContact')
      setContactErr(v && !validateContact(v) ? 'Format: 08xxxxxxxxxx atau @namaakun' : '')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (wordOver || contactErr) return
    if (!validateContact(form.submitterContact)) { setContactErr('Format: 08xxxxxxxxxx atau @namaakun'); return }
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
    } else { setErrMsg(data.message || 'Gagal mengirim'); setStatus('error') }
  }

  const minDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className="mt-10" id="events">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-stone-900 text-xl">🗓️ Event di Venue Ini</h2>
        <button onClick={() => { setShowForm(s => !s); setStatus('idle') }}
          className="bg-green-700 hover:bg-green-800 active:bg-green-900 text-white text-sm font-bold px-4 py-2.5 rounded-full transition-colors min-h-[44px]">
          {showForm ? '✕ Tutup' : '+ Tambah Event'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-green-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-stone-900 mb-1">📋 Tambah Acara di {venueName}</h3>

          {status === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center mt-4">
              <div className="text-4xl mb-2">✅</div>
              <div className="font-bold text-green-800">Event terkirim!</div>
              <div className="text-sm text-green-600 mt-1">Admin akan mereview dalam 1×24 jam.</div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 mt-4" noValidate>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
                ⚠️ Pastikan info <strong>akurat</strong>. Event palsu akan dihapus dan dapat dilaporkan.
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Judul Acara *</label>
                <input required type="text" inputMode="text" autoCapitalize="sentences"
                  placeholder="Cth: Nobar Final Piala Dunia 2026"
                  value={form.title} onChange={e => set('title', e.target.value)}
                  className={inputCls} />
              </div>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Kategori *</label>
                  <select required value={form.category} onChange={e => set('category', e.target.value)}
                    className={selectCls}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Tanggal & Jam *</label>
                  <input required type="datetime-local" min={minDate}
                    value={form.eventDate} onChange={e => set('eventDate', e.target.value)}
                    className={inputCls} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-stone-700">Deskripsi</label>
                  <span className={`text-xs font-semibold ${wordOver ? 'text-red-600' : wordCount > 250 ? 'text-amber-600' : 'text-stone-400'}`}>
                    {wordCount}/{MAX_WORDS} kata
                  </span>
                </div>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={4} inputMode="text" autoCapitalize="sentences"
                  placeholder={`Detail: pertandingan apa, jam berapa, fasilitas khusus… Maks ${MAX_WORDS} kata.`}
                  className={inputCls + ` resize-none ${wordOver ? '!border-red-400' : ''}`} />
                {wordOver && <p className="text-xs text-red-600 mt-1">⚠️ Melebihi {MAX_WORDS} kata.</p>}
              </div>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Nama / Komunitas</label>
                  <input type="text" inputMode="text" autoCapitalize="words" placeholder="Opsional"
                    value={form.submitterName} onChange={e => set('submitterName', e.target.value)}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    Kontak WA / IG * <span className="text-stone-400 font-normal text-xs">untuk verifikasi</span>
                  </label>
                  <input required type="text" inputMode="tel" autoCapitalize="none"
                    placeholder="08xx… atau @akun"
                    value={form.submitterContact} onChange={e => set('submitterContact', e.target.value)}
                    className={inputCls + (contactErr ? ' !border-red-400' : '')} />
                  {contactErr && <p className="text-xs text-red-600 mt-1">{contactErr}</p>}
                </div>
              </div>

              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  ⚠️ {errMsg}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-bold py-3.5 rounded-xl min-h-[52px]">
                  Batal
                </button>
                <button type="submit" disabled={status === 'sending' || wordOver || !!contactErr}
                  className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm font-bold py-3.5 rounded-xl min-h-[52px] transition-colors">
                  {status === 'sending' ? '⏳ Mengirim…' : '📤 Kirim Event'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* List */}
      {events.length === 0 ? (
        <div className="bg-white border border-stone-200 border-dashed rounded-2xl py-12 text-center text-stone-400">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-sm">Belum ada event di venue ini.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-3 text-sm font-bold text-green-700 hover:text-green-900 underline underline-offset-2 min-h-[44px] inline-flex items-center">
            Jadilah yang pertama →
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
