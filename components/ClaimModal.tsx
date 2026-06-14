'use client'

import { useState, useRef } from 'react'

interface Props {
  venueId: string
  venueName: string
  onClose: () => void
}

function validateContact(v: string) {
  return /^(\+62|62|0)[\d]{9,12}$/.test(v.replace(/[\s-]/g, '')) || /^@[\w.]{3,30}$/.test(v)
}

export default function ClaimModal({ venueId, venueName, onClose }: Props) {
  const [form, setForm] = useState({ ownerName: '', ownerContact: '', ownerProof: '' })
  const [status, setStatus] = useState<'idle' | 'uploading' | 'sending' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [contactErr, setContactErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'ownerContact')
      setContactErr(v && !validateContact(v) ? 'Format: 08xxxxxxxxxx atau @namaakun' : '')
  }

  async function uploadProof(file: File) {
    if (file.size > 5 * 1024 * 1024) { setErrMsg('File maks 5MB'); return }
    setStatus('uploading')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) set('ownerProof', data.url)
      else setErrMsg('Gagal upload foto bukti')
    } catch { setErrMsg('Gagal upload') }
    setStatus('idle')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.ownerName.trim() || !form.ownerContact.trim()) return
    if (!validateContact(form.ownerContact)) { setContactErr('Format tidak valid'); return }
    setStatus('sending'); setErrMsg('')
    const res = await fetch('/api/claim-venue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId, ...form }),
    })
    const data = await res.json()
    if (data.success) setStatus('success')
    else { setErrMsg(data.message || 'Gagal mengirim klaim'); setStatus('error') }
  }

  const inputCls = 'w-full bg-white border border-stone-200 rounded-xl px-4 py-3 min-h-[48px] text-base focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
      role="dialog" aria-modal="true" aria-label="Klaim Venue">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl px-5 pt-5 pb-8 sm:pb-5">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4 sm:hidden" aria-hidden="true" />

        {status === 'success' ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="font-bold text-stone-900 text-lg mb-2">Klaim Terkirim!</h3>
            <p className="text-sm text-stone-500 mb-2">
              Tim NobarFinder akan memverifikasi kepemilikan dalam <strong>1×24 jam</strong>.
            </p>
            <p className="text-xs text-stone-400 mb-6">
              Setelah terverifikasi, venue kamu akan mendapat badge <span className="text-green-700 font-bold">✓ Verified</span> dan muncul lebih menonjol di halaman pencarian.
            </p>
            <button onClick={onClose}
              className="w-full bg-green-700 text-white font-bold py-3.5 rounded-xl text-sm">
              Tutup
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-stone-900">🏷️ Klaim Venue Ini</h3>
              <button onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-stone-400 text-xl rounded-full"
                aria-label="Tutup">×</button>
            </div>
            <p className="text-sm text-stone-500 mb-4">
              <span className="font-medium text-stone-700">{venueName}</span> — klaim sebagai pemilik untuk mendapat badge Verified dan hak update data.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-xs text-green-800 leading-relaxed">
              ✅ Venue terverifikasi mendapat:
              <ul className="mt-1.5 space-y-0.5 list-disc list-inside">
                <li>Badge <strong>✓ Verified</strong> di halaman venue</li>
                <li>Tampil lebih menonjol di halaman kota</li>
                <li>Hak update data, jam, foto, dan event langsung</li>
              </ul>
            </div>

            <form onSubmit={submit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Nama Pemilik / Pengelola *</label>
                <input required type="text" inputMode="text" autoCapitalize="words"
                  placeholder="Nama lengkap atau nama usaha"
                  value={form.ownerName} onChange={e => set('ownerName', e.target.value)}
                  className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Kontak WA / IG * <span className="text-stone-400 font-normal text-xs">untuk verifikasi</span>
                </label>
                <input required type="text" inputMode="tel" autoCapitalize="none"
                  placeholder="08xx… atau @namaakun"
                  value={form.ownerContact} onChange={e => set('ownerContact', e.target.value)}
                  className={inputCls + (contactErr ? ' !border-red-400' : '')} />
                {contactErr && <p className="text-xs text-red-600 mt-1">{contactErr}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Bukti Kepemilikan <span className="text-stone-400 font-normal text-xs">(foto SIUP, nota sewa, dll — mempercepat verifikasi)</span>
                </label>
                {form.ownerProof ? (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <span className="text-green-700 text-sm">✓ Foto terupload</span>
                    <button type="button" onClick={() => set('ownerProof', '')}
                      className="ml-auto text-xs text-stone-400 hover:text-red-600">Hapus</button>
                  </div>
                ) : (
                  <>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      disabled={status === 'uploading'}
                      className="w-full border-2 border-dashed border-stone-200 rounded-xl py-4 text-sm text-stone-400 hover:border-green-400 hover:text-green-700 transition-colors disabled:opacity-50">
                      {status === 'uploading' ? '⏳ Mengupload…' : '📎 Upload Foto Bukti (opsional)'}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadProof(e.target.files[0])} />
                  </>
                )}
              </div>

              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  ⚠️ {errMsg}
                </div>
              )}

              <p className="text-xs text-stone-400">
                Data kontak hanya digunakan untuk proses verifikasi dan tidak ditampilkan publik.
              </p>

              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 bg-stone-100 text-stone-700 font-bold py-3.5 rounded-xl text-sm min-h-[52px]">
                  Batal
                </button>
                <button type="submit"
                  disabled={status === 'sending' || status === 'uploading' || !!contactErr}
                  className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm min-h-[52px] transition-colors">
                  {status === 'sending' ? '⏳ Mengirim…' : '🏷️ Ajukan Klaim'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
