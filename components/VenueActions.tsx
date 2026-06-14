'use client'

import { useState } from 'react'
import ClaimModal from './ClaimModal'

interface Props {
  venueId: string
  venueName: string
  isClaimed: boolean
  isVerified: boolean
  claimedBy?: string
}

export default function VenueActions({ venueId, venueName, isClaimed, isVerified, claimedBy }: Props) {
  const [showClaim, setShowClaim] = useState(false)

  // Venue sudah verified — tampilkan badge saja
  if (isVerified) {
    return (
      <div className="mt-5 flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
          ✓
        </div>
        <div>
          <div className="text-sm font-bold text-green-800">Venue Terverifikasi</div>
          <div className="text-xs text-green-600">Data dikelola langsung oleh pemilik venue</div>
        </div>
      </div>
    )
  }

  // Venue sudah diklaim, menunggu verifikasi
  if (isClaimed) {
    return (
      <div className="mt-5 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm shrink-0">
          ⏳
        </div>
        <div>
          <div className="text-sm font-bold text-amber-800">Verifikasi Sedang Diproses</div>
          <div className="text-xs text-amber-600">Klaim sedang direview admin dalam 1×24 jam</div>
        </div>
      </div>
    )
  }

  // Venue belum diklaim — tampilkan CTA
  return (
    <>
      {showClaim && (
        <ClaimModal
          venueId={venueId}
          venueName={venueName}
          onClose={() => setShowClaim(false)}
        />
      )}
      <div className="mt-5 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-stone-700">Apakah kamu pemilik venue ini?</div>
          <div className="text-xs text-stone-400 mt-0.5">
            Klaim & verifikasi untuk mendapat badge <span className="text-green-700 font-bold">✓ Verified</span> dan hak update data
          </div>
        </div>
        <button onClick={() => setShowClaim(true)}
          className="shrink-0 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-colors min-h-[44px]">
          Klaim →
        </button>
      </div>
    </>
  )
}
