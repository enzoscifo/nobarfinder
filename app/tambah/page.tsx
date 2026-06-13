'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { CITY_LIST } from '@/lib/data'

type Status = 'idle' | 'sending' | 'success' | 'error'

const VENUE_TYPES = [
  { value: 'outdoor',   label: '🏟️ Outdoor / Lapangan' },
  { value: 'cafe',      label: '☕ Kafe / Coffee Shop' },
  { value: 'resto',     label: '🍽️ Resto / Warung' },
  { value: 'mall',      label: '🛍️ Mall / Indoor' },
  { value: 'komunitas', label: '⚽ Komunitas' },
]

const EVENT_CATEGORIES = [
  { value: 'nobar-bola',  label: '⚽ Nobar Bola' },
  { value: 'nobar-film',  label: '🎬 Nobar Film' },
  { value: 'nobar-anime', label: '🎌 Nobar Anime' },
  { value: 'komunitas',   label: '🤝 Komunitas' },
  { value: 'lainnya',     label: '📅 Lainnya' },
]

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function validateContact(v: string) {
  const isWA = /^(\+62|62|0)[\d]{9,12}$/.test(v.replace(/[\s-]/g, ''))
  const isSocmed = /^@[\w.]{3,30}$/.test(v)
  return isWA || isSocmed
}

const MAX_WORDS = 300

// ── Shared UI primitives ────────────────────────────────────────
// min-h-[48px] = target tap 48px (>= 44px rekomendasi Apple/Google)
const inputCls = [
  'w-full bg-white border border-stone-300 rounded-xl',
  'px-4 py-3 min-h-[48px]',           // padding cukup untuk jari
  'text-base text-stone-900',          // text-base (16px) cegah iOS auto-zoom
  'placeholder-stone-400',
  'focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100',
  'transition-all appearance-none',   // appearance-none: hapus native styling iOS
].join(' ')

const selectCls = inputCls + ' bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23888\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center] pr-10'

const labelCls = 'block text-sm font-semibold text-stone-700 mb-1.5'

// ── Field wrapper ────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
    </div>
  )
}

// ── Section header ───────────────────────────────────────────────
function SectionHead({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 mb-1 border-b border-stone-100">
      <span className="text-xl" aria-hidden="true">{emoji}</span>
      <h2 className="font-display font-bold text-stone-900 text-lg">{title}</h2>
    </div>
  )
}

export default function TambahPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    venueName: '', city: '', cityCustom: '', address: '', type: '',
    isFree: 'true', openTime: '', description: '',
    submitterName: '', submitterContact: '', websiteUrl: '',
    website: '', // honeypot
  })
  const [addEvent, setAddEvent] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: '', category: 'nobar-bola', eventDate: '', eventDescription: '', eventContact: '',
  })
  const [contactErr, setContactErr] = useState('')
  const wordCount = countWords(eventForm.eventDescription)
  const wordOver = wordCount > MAX_WORDS

  function update(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }
  function updateEvent(field: string, value: string) {
    setEventForm(f => ({ ...f, [field]: value }))
    if (field === 'eventContact')
      setContactErr(value && !validateContact(value) ? 'Format: 08xxxxxxxxxx atau @namaakun' : '')
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErrorMsg('Foto maks 5MB'); return }
    setPhotoPreview(URL.createObjectURL(file))
    setUploading(true); setErrorMsg('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) setPhotoUrl(data.url)
      else { setErrorMsg(data.message || 'Gagal upload foto'); setPhotoPreview('') }
    } catch { setErrorMsg('Gagal upload foto. Coba lagi.'); setPhotoPreview('') }
    finally { setUploading(false) }
  }

  function removePhoto() {
    setPhotoUrl(''); setPhotoPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (addEvent && wordOver) return
    if (addEvent && eventForm.eventContact && !validateContact(eventForm.eventContact)) {
      setContactErr('Format: 08xxxxxxxxxx atau @namaakun'); return
    }
    setStatus('sending'); setErrorMsg('')
    try {
      const venueRes = await fetch('/api/submit-venue', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photoUrl }),
      })
      const venueData = await venueRes.json()
      if (!venueData.success) {
        setStatus('error'); setErrorMsg(venueData.message || 'Gagal mengirim venue.'); return
      }
      if (addEvent && eventForm.title && eventForm.eventDate) {
        await fetch('/api/submit-event-pending', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venueName: form.venueName,
            venueCity: form.city === 'Lainnya' ? form.cityCustom : form.city,
            title: eventForm.title, category: eventForm.category,
            eventDate: eventForm.eventDate, description: eventForm.eventDescription,
            submitterName: form.submitterName,
            submitterContact: eventForm.eventContact || form.submitterContact,
          }),
        })
      }
      setStatus('success')
    } catch { setStatus('error'); setErrorMsg('Koneksi gagal. Coba lagi.') }
  }

  const minDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16)

  // ── Success screen ───────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#FAFAF9]">
        <SiteHeader />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center max-w-md w-full">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="font-display font-black text-stone-900 text-2xl mb-2">Terkirim!</h1>
            <p className="text-sm text-stone-600 mb-2">
              Venue <strong>{form.venueName}</strong> sudah masuk antrian moderasi.
            </p>
            {addEvent && eventForm.title && (
              <p className="text-sm text-stone-500 mb-2">
                Event <strong>{eventForm.title}</strong> juga tercatat — akan tampil setelah venue disetujui.
              </p>
            )}
            <p className="text-xs text-stone-400 mb-8">Review dalam 1×24 jam.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold text-sm py-3.5 rounded-xl text-center transition-colors">
                Ke Beranda
              </Link>
              <button onClick={() => {
                setStatus('idle'); removePhoto()
                setForm(f => ({ ...f, venueName: '', address: '', description: '' }))
                setEventForm({ title: '', category: 'nobar-bola', eventDate: '', eventDescription: '', eventContact: '' })
                setAddEvent(false)
              }} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm py-3.5 rounded-xl transition-colors">
                + Tambah Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <SiteHeader />
      <main className="max-w-xl mx-auto px-4 py-8 pb-20">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display font-black text-stone-900 text-3xl mb-1">Daftarkan Venue</h1>
          <p className="text-sm text-stone-500">Gratis · dimoderasi dalam 1×24 jam</p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {/* Honeypot */}
          <input type="text" tabIndex={-1} autoComplete="off" value={form.website}
            onChange={e => update('website', e.target.value)}
            className="absolute opacity-0 pointer-events-none h-0 w-0" aria-hidden="true" />

          {/* ══ VENUE ══════════════════════════════════════════════ */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-5">
            <SectionHead emoji="🏟️" title="Data Venue" />

            {/* Foto */}
            <Field label="Foto Venue (opsional, maks 5MB)">
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="preview" className="w-full h-52 object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-white rounded-full px-4 py-2 text-sm font-semibold text-stone-700">Mengupload…</div>
                    </div>
                  )}
                  {!uploading && photoUrl && (
                    <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Terupload</div>
                  )}
                  <button type="button" onClick={removePhoto}
                    className="absolute top-3 right-3 bg-white text-stone-600 w-9 h-9 rounded-full flex items-center justify-center shadow text-lg font-bold"
                    aria-label="Hapus foto">✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-stone-300 active:border-green-500 rounded-xl py-10 flex flex-col items-center gap-2 text-stone-400 active:text-green-700 transition-colors"
                  aria-label="Upload foto venue">
                  <span className="text-4xl">📷</span>
                  <span className="text-sm font-semibold">Tap untuk upload foto</span>
                  <span className="text-xs">JPG, PNG, atau WebP</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                onChange={handlePhoto} className="hidden" aria-hidden="true" />
            </Field>

            {/* Nama */}
            <Field label="Nama Venue *">
              <input required type="text" inputMode="text" autoCapitalize="words"
                placeholder="Cth: Kafe Bola Jaya"
                value={form.venueName} onChange={e => update('venueName', e.target.value)}
                className={inputCls} />
            </Field>

            {/* Kota & Tipe — full width di mobile, 2 kolom di sm+ */}
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <Field label="Kota *">
                <select required value={form.city} onChange={e => update('city', e.target.value)} className={selectCls}>
                  <option value="">Pilih kota…</option>
                  {CITY_LIST.map(c => <option key={c.slug} value={c.name}>{c.emoji} {c.name}</option>)}
                  <option value="Lainnya">🗺️ Kota Lainnya</option>
                </select>
              </Field>
              <Field label="Tipe Venue *">
                <select required value={form.type} onChange={e => update('type', e.target.value)} className={selectCls}>
                  <option value="">Pilih tipe…</option>
                  {VENUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
            </div>

            {/* Kota baru */}
            {form.city === 'Lainnya' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <Field label="Nama Kota Baru *" hint="💡 Kamu jadi pelopor nobar di kotamu!">
                  <input required type="text" inputMode="text" autoCapitalize="words"
                    placeholder="Cth: Pontianak"
                    value={form.cityCustom} onChange={e => update('cityCustom', e.target.value)}
                    className={inputCls} />
                </Field>
              </div>
            )}

            {/* Alamat */}
            <Field label="Alamat Lengkap *">
              <input required type="text" inputMode="text" autoCapitalize="sentences"
                placeholder="Jl. Contoh No.1, Kecamatan, Kota"
                value={form.address} onChange={e => update('address', e.target.value)}
                className={inputCls} />
            </Field>

            {/* Biaya & Jam — stacked di mobile */}
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <Field label="Biaya Masuk">
                <select value={form.isFree} onChange={e => update('isFree', e.target.value)} className={selectCls}>
                  <option value="true">✅ Gratis</option>
                  <option value="false">💰 Berbayar / Min. Order</option>
                </select>
              </Field>
              <Field label="Jam Buka">
                <input type="text" inputMode="text" placeholder="Cth: 18.00–24.00"
                  value={form.openTime} onChange={e => update('openTime', e.target.value)}
                  className={inputCls} />
              </Field>
            </div>

            {/* Website */}
            <Field label="Website / Media Sosial">
              <input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off"
                placeholder="https://instagram.com/namaakun"
                value={form.websiteUrl} onChange={e => update('websiteUrl', e.target.value)}
                className={inputCls} />
            </Field>

            {/* Deskripsi */}
            <Field label="Deskripsi & Fasilitas">
              <textarea rows={3} inputMode="text" autoCapitalize="sentences"
                placeholder="Proyektor 120 inch, AC, kapasitas 50 orang, menu paket nobar…"
                value={form.description} onChange={e => update('description', e.target.value)}
                className={inputCls + ' resize-none'} />
            </Field>

            <hr className="border-stone-100" />

            {/* Kontak pengirim — stacked di mobile */}
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <Field label="Nama Kamu">
                <input type="text" inputMode="text" autoCapitalize="words" placeholder="Opsional"
                  value={form.submitterName} onChange={e => update('submitterName', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Kontak (WA / Email) *"
                hint="Hanya untuk konfirmasi moderasi, tidak ditampilkan publik.">
                <input required type="text" inputMode="tel" autoCapitalize="none"
                  placeholder="0812… / email@…"
                  value={form.submitterContact} onChange={e => update('submitterContact', e.target.value)}
                  className={inputCls} />
              </Field>
            </div>
          </div>

          {/* ══ EVENT (toggle) ═══════════════════════════════════════ */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            {/* Toggle row — min-h-[64px] supaya mudah di-tap */}
            <button type="button" onClick={() => setAddEvent(v => !v)}
              className="w-full min-h-[64px] flex items-center justify-between px-5 py-4 active:bg-stone-50 transition-colors"
              aria-expanded={addEvent}>
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">🗓️</span>
                <div className="text-left">
                  <div className="font-bold text-stone-900 text-sm">Tambah Event Sekarang</div>
                  <div className="text-xs text-stone-400">Opsional · otomatis hilang setelah 24 jam</div>
                </div>
              </div>
              {/* Toggle switch */}
              <div className={`w-12 h-7 rounded-full transition-colors duration-200 flex items-center px-0.5 shrink-0 ${addEvent ? 'bg-green-600' : 'bg-stone-200'}`}
                role="switch" aria-checked={addEvent}>
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${addEvent ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>

            {addEvent && (
              <div className="px-5 pb-6 space-y-5 border-t border-stone-100 pt-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
                  ⚠️ Pastikan info event <strong>akurat</strong>. Event tampil setelah venue disetujui admin, dan otomatis hilang dalam 24 jam.
                </div>

                <Field label="Judul Event *">
                  <input type="text" inputMode="text" autoCapitalize="sentences"
                    placeholder="Cth: Nobar Final Piala Dunia 2026"
                    value={eventForm.title} onChange={e => updateEvent('title', e.target.value)}
                    className={inputCls} required={addEvent} />
                </Field>

                {/* Kategori & tanggal — stacked di mobile */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                  <Field label="Kategori *">
                    <select value={eventForm.category} onChange={e => updateEvent('category', e.target.value)}
                      className={selectCls}>
                      {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Tanggal & Jam *">
                    {/* Gunakan dua input terpisah agar lebih mobile-friendly */}
                    <input type="datetime-local" min={minDate}
                      value={eventForm.eventDate} onChange={e => updateEvent('eventDate', e.target.value)}
                      className={inputCls} required={addEvent} />
                  </Field>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls + ' mb-0'}>Deskripsi Event</label>
                    <span className={`text-xs font-semibold ${wordOver ? 'text-red-600' : wordCount > 250 ? 'text-amber-600' : 'text-stone-400'}`}>
                      {wordCount}/{MAX_WORDS} kata
                    </span>
                  </div>
                  <textarea rows={4} inputMode="text" autoCapitalize="sentences"
                    placeholder={`Detail acara: pertandingan apa, jam berapa, fasilitas, dll. Maks ${MAX_WORDS} kata.`}
                    value={eventForm.eventDescription} onChange={e => updateEvent('eventDescription', e.target.value)}
                    className={inputCls + ` resize-none ${wordOver ? '!border-red-400' : ''}`} />
                  {wordOver && <p className="text-xs text-red-600 mt-1">⚠️ Melebihi {MAX_WORDS} kata.</p>}
                </div>

                <Field label="Kontak Konfirmasi Event"
                  hint="WA atau IG. Kosongkan jika sama dengan kontak venue.">
                  <input type="text" inputMode="tel" autoCapitalize="none"
                    placeholder="08xx… atau @namaakun"
                    value={eventForm.eventContact} onChange={e => updateEvent('eventContact', e.target.value)}
                    className={inputCls + (contactErr ? ' !border-red-400' : '')} />
                  {contactErr && <p className="text-xs text-red-600 mt-1">{contactErr}</p>}
                </Field>
              </div>
            )}
          </div>

          {/* Error */}
          {(status === 'error' || errorMsg) && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
              <span>⚠️</span><span>{errorMsg}</span>
            </div>
          )}

          {/* Submit — besar dan sticky di mobile */}
          <div className="sticky bottom-4 pt-2">
            <button type="submit"
              disabled={status === 'sending' || uploading || wordOver || !!contactErr}
              className="w-full bg-green-700 hover:bg-green-800 active:bg-green-900 disabled:opacity-50 text-white font-bold text-base py-4 rounded-2xl transition-colors shadow-lg shadow-green-900/20">
              {uploading ? '📷 Mengunggah foto…'
                : status === 'sending' ? '⏳ Mengirim…'
                : addEvent ? '📨 Kirim Venue + Event'
                : '📨 Kirim untuk Moderasi'}
            </button>
          </div>

          <p className="text-center text-xs text-stone-400 pb-4">
            Sudah punya venue?{' '}
            <Link href="/" className="text-green-700 font-medium">Cari venue kamu →</Link>
            {' '}lalu tambah event langsung dari halamannya.
          </p>
        </form>
      </main>
    </div>
  )
}
