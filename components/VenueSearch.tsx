'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { NobarVenue } from '@/types'

const TYPE_LABEL: Record<string, string> = {
  outdoor: '🏟️ Outdoor', cafe: '☕ Kafe', resto: '🍽️ Resto',
  mall: '🛍️ Mall', komunitas: '⚽ Komunitas',
}

const FILTERS = [
  { key: 'all',      label: 'Semua' },
  { key: 'free',     label: '✅ Gratis' },
  { key: 'outdoor',  label: '🏟️ Outdoor' },
  { key: 'cafe',     label: '☕ Kafe' },
  { key: 'resto',    label: '🍽️ Resto' },
  { key: 'mall',     label: '🛍️ Mall' },
  { key: 'komunitas',label: '⚽ Komunitas' },
] as const

type FilterKey = typeof FILTERS[number]['key']

function venueSlugLocal(v: NobarVenue) {
  return v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface Props {
  venues: NobarVenue[]
  citySlug: string
  cityName: string
}

export default function VenueSearch({ venues, citySlug, cityName }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return venues.filter(v => {
      // Filter tipe / gratis
      if (filter === 'free' && !v.isFree) return false
      if (filter !== 'all' && filter !== 'free' && v.type !== filter) return false
      // Search teks
      if (!q) return true
      return (
        v.name.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        v.tags.some(t => t.toLowerCase().includes(q)) ||
        (v.description?.toLowerCase().includes(q))
      )
    })
  }, [venues, query, filter])

  const hasQuery = query.trim().length > 0 || filter !== 'all'

  return (
    <div>
      {/* Search + filter bar */}
      <div className="mb-5 space-y-3">
        {/* Search input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Cari venue di ${cityName}...`}
            className="w-full bg-white border border-stone-200 rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all ${
                filter === f.key
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-green-400 hover:text-green-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      {hasQuery && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-stone-500">
            {filtered.length === 0
              ? 'Tidak ada venue ditemukan'
              : `${filtered.length} venue ditemukan`}
          </p>
          <button
            onClick={() => { setQuery(''); setFilter('all') }}
            className="text-xs text-green-700 hover:text-green-900 font-medium"
          >
            Reset ×
          </button>
        </div>
      )}

      {/* Venue grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl py-14 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-bold text-stone-900 text-sm mb-1">Tidak ada venue ditemukan</p>
          <p className="text-xs text-stone-400 mb-4">Coba kata kunci lain atau ubah filter</p>
          <button
            onClick={() => { setQuery(''); setFilter('all') }}
            className="text-xs font-bold text-green-700 underline underline-offset-2"
          >
            Lihat semua venue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(venue => {
            const slug = venueSlugLocal(venue)
            return (
              <div key={venue.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-green-600 hover:shadow-md transition-all relative group">
                {/* Photo */}
                <Link href={`/${citySlug}/${slug}`} className="block">
                  <div className="h-44 bg-stone-100 relative flex items-center justify-center">
                    {venue.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={venue.photoUrl} alt={venue.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-5xl opacity-30">{venue.icon}</div>
                    )}
                    <span className={
                      venue.isFree
                        ? 'absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-600 text-white'
                        : 'absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white'
                    }>
                      {venue.isFree ? 'GRATIS' : 'BAYAR'}
                    </span>
                  </div>
                </Link>
                {/* Tombol Maps */}
                {venue.mapsUrl && (
                  <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white text-stone-700 hover:text-green-700 text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-all z-10 md:opacity-0 md:group-hover:opacity-100">
                    🗺️ Maps
                  </a>
                )}
                {/* Info */}
                <Link href={`/${citySlug}/${slug}`} className="block p-5">
                  <h2 className="font-display font-bold text-stone-900 text-lg leading-tight">
                    {/* Highlight teks yang cocok dengan query */}
                    {query ? <Highlight text={venue.name} query={query} /> : venue.name}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">📍 {venue.address}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">{TYPE_LABEL[venue.type]}</span>
                    {venue.tags.slice(0, 3).map(tag => (
                      <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full ${
                        query && tag.toLowerCase().includes(query.toLowerCase())
                          ? 'bg-green-100 text-green-800 font-semibold'
                          : 'bg-stone-100 text-stone-500'
                      }`}>{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                    <span className="text-xs text-stone-400">🕐 Buka {venue.openTime} WIB</span>
                    <span className="text-xs font-bold text-green-700">Lihat detail →</span>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Highlight teks yang cocok query
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 rounded px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}
