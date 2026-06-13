'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { CITY_LIST } from '@/lib/data'

type Status = 'idle' | 'sending' | 'success' | 'error'

const VENUE_TYPES = [
  { value: 'outdoor', label: '🏟️ Outdoor / Lapangan' },
  { value: 'cafe', label: '☕ Kafe / Coffee Shop' },
  { value: 'resto', label: '🍽️ Resto / Warung' },
  { value: 'mall', label: '🛍️ Mall / Indoor' },
  { value: 'komunitas', label: '⚽ Komunitas' },
]

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
    submitterName: '', submitterContact: '', website: '',
  })

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Foto maks 5MB')
      return
    }
    setPhotoPreview(URL.createObjectURL(file))
    setUploading(true)
    setErrorMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setPhotoUrl(data.url)
      } else {
        setErrorMsg(data.message || 'Gagal upload foto')
        setPhotoPreview('')
      }
    } catch {
      setErrorMsg('Gagal upload foto. Coba lagi.')
      setPhotoPreview('')
    } finally {
      setUploading(false)
    }
  }

  function removePhoto() {
    setPhotoUrl('')
    setPhotoPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/submit-venue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photoUrl }),
      })
      const data = await res.json()
      if (data.success) setStatus('success')
      else { setStatus('error'); setErrorMsg(data.message || 'Gagal mengirim.') }
    } catch {
      setStatus('error'); setErrorMsg('Koneksi gagal. Coba lagi.')
    }
  }

  const inputCls = 'w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all'
  const labelCls = 'block text-xs font-semibold text-stone-700 mb-1.5'

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
            <p className="text-xs text-stone-400 mb-8">
              {photoUrl ? 'Foto & data akan direview' : 'Data akan direview'} dalam 1×24 jam. Jika disetujui, langsung tampil di halaman kota.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/" className="bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-colors">
                Ke Beranda
              </Link>
              <button onClick={() => { setStatus('idle'); removePhoto(); setForm(f => ({ ...f, venueName: '', address: '', description: '' })) }}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm px-5 py-2.5 rounded-full transition-colors">
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

        <form onSubmit={submit} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
          <input type="text" tabIndex={-1} autoComplete="off" value={form.website}
            onChange={e => update('website', e.target.value)}
            className="absolute opacity-0 pointer-events-none h-0 w-0" aria-hidden="true" />

          {/* PHOTO UPLOAD */}
          <div>
            <label className={labelCls}>Foto Venue (opsional, maks 5MB)</label>
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="preview" className="w-full h-48 object-cover" />
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold">
                    Mengupload...
                  </div>
                )}
                {!uploading && photoUrl && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    ✓ Foto terupload
                  </div>
                )}
                <button type="button" onClick={removePhoto}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-stone-700 w-7 h-7 rounded-full flex items-center justify-center text-sm">
                  ✕
                </button>
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
            <p className="text-[11px] text-stone-400 mt-2">Foto akan tampil setelah disetujui moderasi.</p>
          </div>

          <hr className="border-stone-100" />

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
                {CITY_LIST.map(c => (<option key={c.slug} value={c.name}>{c.emoji} {c.name}</option>))}
                <option value="Lainnya">🗺️ Kota Lainnya (usulkan baru)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipe Venue *</label>
              <select required value={form.type} onChange={e => update('type', e.target.value)} className={inputCls}>
                <option value="">Pilih tipe</option>
                {VENUE_TYPES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            </div>
          </div>

          {form.city === 'Lainnya' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <label className={labelCls}>Nama Kota Baru *</label>
              <input required type="text" placeholder="contoh: Pontianak"
                value={form.cityCustom} onChange={e => update('cityCustom', e.target.value)} className={inputCls} />
              <p className="text-[11px] text-green-700 mt-2">💡 Kota baru ditambahkan setelah moderasi — kamu jadi pelopor nobar di kotamu!</p>
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
              <input type="text" placeholder="contoh: 20:00"
                value={form.openTime} onChange={e => update('openTime', e.target.value)} className={inputCls} />
            </div>
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

          {(status === 'error' || errorMsg) && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">⚠️ {errorMsg}</div>
          )}

          <button type="submit" disabled={status === 'sending' || uploading}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-colors">
            {uploading ? 'Tunggu upload foto...' : status === 'sending' ? 'Mengirim...' : '📨 Kirim untuk Moderasi'}
          </button>
        </form>
      </main>
    </div>
  )
}
