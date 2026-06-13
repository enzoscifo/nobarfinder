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

export default function TambahPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Venue form
  const [form, setForm] = useState({
    venueName: '', city: '', cityCustom: '', address: '', type: '',
    isFree: 'true', openTime: '', description: '',
    submitterName: '', submitterContact: '', websiteUrl: '', website: '', // website = honeypot
  })

  // Event sub-form
  const [addEvent, setAddEvent] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: '', category: 'nobar-bola', eventDate: '', eventDescription: '',
    eventContact: '',
  })
  const [contactErr, setContactErr] = useState('')
  const wordCount = countWords(eventForm.eventDescription)
  const wordOver = wordCount > MAX_WORDS

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function updateEvent(field: string, value: string) {
    setEventForm(f => ({ ...f, [field]: value }))
    if (field === 'eventContact') {
      setContactErr(value && !validateContact(value) ? 'Format: 08xxxxxxxxxx atau @namaakun' : '')
    }
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
    } catch {
      setErrorMsg('Gagal upload foto. Coba lagi.'); setPhotoPreview('')
    } finally { setUploading(false) }
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
      // 1. Submit venue
      const venueRes = await fetch('/api/submit-venue', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photoUrl }),
      })
      const venueData = await venueRes.json()
      if (!venueData.success) {
        setStatus('error'); setErrorMsg(venueData.message || 'Gagal mengirim venue.'); return
      }

      // 2. Submit event (jika diisi) — venueId dari response, atau pakai placeholder
      //    Event akan di-attach ke venue saat admin approve venue
      if (addEvent && eventForm.title && eventForm.eventDate) {
        const eventContact = eventForm.eventContact || form.submitterContact
        // Kirim event dengan venueId sementara — backend akan link ke venue setelah approved
        // Untuk sekarang simpan ke pending dengan tag venueName sebagai referensi
        await fetch('/api/submit-event-pending', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venueName: form.venueName,
            venueCity: form.city === 'Lainnya' ? form.cityCustom : form.city,
            title: eventForm.title,
            category: eventForm.category,
            eventDate: eventForm.eventDate,
            description: eventForm.eventDescription,
            submitterName: form.submitterName,
            submitterContact: eventContact,
          }),
        })
      }

      setStatus('success')
    } catch {
      setStatus('error'); setErrorMsg('Koneksi gagal. Coba lagi.')
    }
  }

  const inputCls = 'w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all'
  const labelCls = 'block text-xs font-semibold text-stone-700 mb-1.5'
  const minDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16)

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#FAFAF9]">
        <SiteHeader />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center max-w-md w-full">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="font-display font-black text-stone-900 text-2xl mb-2">Terkirim!</h1>
            <p className="text-sm text-stone-500 mb-2">
              Venue <strong className="text-stone-700">{form.venueName}</strong> sudah masuk antrian moderasi.
            </p>
            {addEvent && eventForm.title && (
              <p className="text-sm text-stone-500 mb-2">
                Event <strong className="text-stone-700">{eventForm.title}</strong> juga sudah tercatat dan akan ditampilkan setelah venue disetujui.
              </p>
            )}
            <p className="text-xs text-stone-400 mb-8">
              Data akan direview dalam 1×24 jam. Jika disetujui, langsung tampil di halaman kota.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/" className="bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-colors">
                Ke Beranda
              </Link>
              <button onClick={() => {
                setStatus('idle'); removePhoto()
                setForm(f => ({ ...f, venueName: '', address: '', description: '' }))
                setEventForm({ title: '', category: 'nobar-bola', eventDate: '', eventDescription: '', eventContact: '' })
                setAddEvent(false)
              }} className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm px-5 py-2.5 rounded-full transition-colors">
                + Tambah Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <SiteHeader />
      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📍</div>
          <h1 className="font-display font-black text-stone-900 text-3xl mb-2">Daftarkan Tempat Nobar</h1>
          <p className="text-sm text-stone-500">Gratis selamanya. Semua submission dimoderasi dulu — biasanya kurang dari 1×24 jam.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Honeypot */}
          <input type="text" tabIndex={-1} autoComplete="off" value={form.website}
            onChange={e => update('website', e.target.value)}
            className="absolute opacity-0 pointer-events-none h-0 w-0" aria-hidden="true" />

          {/* ══ BAGIAN 1: VENUE ══ */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-1 border-b border-stone-100">
              <span className="text-lg">🏟️</span>
              <h2 className="font-display font-bold text-stone-900">Data Venue</h2>
            </div>

            {/* Photo upload */}
            <div>
              <label className={labelCls}>Foto Venue (opsional, maks 5MB)</label>
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="preview" className="w-full h-48 object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold">Mengupload...</div>
                  )}
                  {!uploading && photoUrl && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">✓ Foto terupload</div>
                  )}
                  <button type="button" onClick={removePhoto}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-stone-700 w-7 h-7 rounded-full flex items-center justify-center text-sm">✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-stone-300 hover:border-green-500 rounded-xl py-8 flex flex-col items-center gap-2 text-stone-400 hover:text-green-700 transition-colors">
                  <span className="text-3xl">📷</span>
                  <span className="text-sm font-semibold">Tap untuk upload foto</span>
                  <span className="text-xs">JPG, PNG, atau WebP</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="hidden" />
            </div>

            <div>
              <label className={labelCls}>Nama Venue *</label>
              <input required type="text" placeholder="contoh: Kafe Bola Jaya"
                value={form.venueName} onChange={e => update('venueName', e.target.value)} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Kota *</label>
                <select required value={form.city} onChange={e => update('city', e.target.value)} className={inputCls}>
                  <option value="">Pilih kota</option>
                  {CITY_LIST.map(c => <option key={c.slug} value={c.name}>{c.emoji} {c.name}</option>)}
                  <option value="Lainnya">🗺️ Kota Lainnya</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Tipe Venue *</label>
                <select required value={form.type} onChange={e => update('type', e.target.value)} className={inputCls}>
                  <option value="">Pilih tipe</option>
                  {VENUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {form.city === 'Lainnya' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <label className={labelCls}>Nama Kota Baru *</label>
                <input required type="text" placeholder="contoh: Pontianak"
                  value={form.cityCustom} onChange={e => update('cityCustom', e.target.value)} className={inputCls} />
                <p className="text-[11px] text-green-700 mt-2">💡 Kamu jadi pelopor nobar di kotamu!</p>
              </div>
            )}

            <div>
              <label className={labelCls}>Alamat Lengkap *</label>
              <input required type="text" placeholder="Jl. Contoh No.1, Kecamatan, Kota"
                value={form.address} onChange={e => update('address', e.target.value)} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Biaya Masuk</label>
                <select value={form.isFree} onChange={e => update('isFree', e.target.value)} className={inputCls}>
                  <option value="true">✅ Gratis</option>
                  <option value="false">💰 Berbayar / Min. Order</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Jam Buka</label>
                <input type="text" placeholder="contoh: 18.00–24.00"
                  value={form.openTime} onChange={e => update('openTime', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Website / Media Sosial</label>
              <input type="text" placeholder="https://instagram.com/namaakun atau https://namadomain.com"
                value={form.websiteUrl} onChange={e => update('websiteUrl', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Deskripsi & Fasilitas</label>
              <textarea rows={3} placeholder="Proyektor 120 inch, AC, kapasitas 50 orang, ada menu paket nobar..."
                value={form.description} onChange={e => update('description', e.target.value)} className={inputCls + ' resize-none'} />
            </div>

            <hr className="border-stone-100" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nama Kamu</label>
                <input type="text" placeholder="opsional"
                  value={form.submitterName} onChange={e => update('submitterName', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kontak (WA/Email) *</label>
                <input required type="text" placeholder="0812... / email"
                  value={form.submitterContact} onChange={e => update('submitterContact', e.target.value)} className={inputCls} />
              </div>
            </div>
            <p className="text-[11px] text-stone-400 -mt-2">Kontak hanya untuk konfirmasi moderasi, tidak ditampilkan publik.</p>
          </div>

          {/* ══ BAGIAN 2: EVENT (sub-menu, toggle) ══ */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <button type="button"
              onClick={() => setAddEvent(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-lg">🗓️</span>
                <div className="text-left">
                  <div className="font-bold text-stone-900 text-sm">Tambah Event Sekarang</div>
                  <div className="text-xs text-stone-400">Opsional · event otomatis hilang setelah 24 jam</div>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${addEvent ? 'bg-green-600' : 'bg-stone-200'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${addEvent ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            {addEvent && (
              <div className="px-6 pb-6 space-y-4 border-t border-stone-100 pt-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-[11px] text-amber-800 leading-relaxed">
                  ⚠️ Pastikan info event <strong>akurat</strong>. Event akan tampil setelah venue disetujui admin.
                  Event yang tidak akurat akan dihapus dan dapat dilaporkan pengunjung.
                </div>

                <div>
                  <label className={labelCls}>Judul Event *</label>
                  <input type="text" placeholder="cth: Nobar Final Piala Dunia 2026"
                    value={eventForm.title} onChange={e => updateEvent('title', e.target.value)}
                    className={inputCls} required={addEvent} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Kategori *</label>
                    <select value={eventForm.category} onChange={e => updateEvent('category', e.target.value)} className={inputCls}>
                      {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Tanggal & Jam *</label>
                    <input type="datetime-local" min={minDate}
                      value={eventForm.eventDate} onChange={e => updateEvent('eventDate', e.target.value)}
                      className={inputCls} required={addEvent} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls + ' mb-0'}>Deskripsi Event</label>
                    <span className={`text-[11px] font-medium ${wordOver ? 'text-red-600' : wordCount > 250 ? 'text-amber-600' : 'text-stone-400'}`}>
                      {wordCount}/{MAX_WORDS} kata
                    </span>
                  </div>
                  <textarea rows={4}
                    placeholder={`Ceritakan detail: siapa yang main, suasana, fasilitas khusus, dress code, dll. Maks ${MAX_WORDS} kata.`}
                    value={eventForm.eventDescription} onChange={e => updateEvent('eventDescription', e.target.value)}
                    className={inputCls + ` resize-none ${wordOver ? '!border-red-400' : ''}`} />
                  {wordOver && <p className="text-xs text-red-600 mt-1">⚠️ Melebihi {MAX_WORDS} kata.</p>}
                </div>

                <div>
                  <label className={labelCls}>
                    Kontak untuk Konfirmasi Event
                    <span className="text-stone-400 font-normal ml-1">(WA/IG — opsional, default pakai kontak venue)</span>
                  </label>
                  <input type="text" placeholder="08xx... atau @namaakun (kosongkan jika sama dengan kontak venue)"
                    value={eventForm.eventContact} onChange={e => updateEvent('eventContact', e.target.value)}
                    className={inputCls + (contactErr ? ' !border-red-400' : '')} />
                  {contactErr && <p className="text-[11px] text-red-600 mt-1">{contactErr}</p>}
                </div>
              </div>
            )}
          </div>

          {(status === 'error' || errorMsg) && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">⚠️ {errorMsg}</div>
          )}

          <button type="submit" disabled={status === 'sending' || uploading || wordOver || !!contactErr}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-colors">
            {uploading ? 'Tunggu upload foto...' : status === 'sending' ? 'Mengirim...' : addEvent ? '📨 Kirim Venue + Event' : '📨 Kirim untuk Moderasi'}
          </button>

          <p className="text-center text-xs text-stone-400 pb-4">
            Sudah punya venue terdaftar?{' '}
            <Link href="/" className="text-green-700 hover:underline font-medium">Cari venue kamu →</Link>
            {' '}lalu tambah event langsung dari halaman venue.
          </p>
        </form>
      </main>
    </div>
  )
}
