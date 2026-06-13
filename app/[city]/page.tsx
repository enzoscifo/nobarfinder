import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import { CITY_LIST, getCityBySlug, venueSlug } from '@/lib/data'
import { getApprovedByCity, getUpcomingEventsByCity } from '@/lib/db'

interface Props { params: Promise<{ city: string }> }

export const revalidate = 60

export async function generateStaticParams() {
  return CITY_LIST.map(c => ({ city: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params
  const city = getCityBySlug(slug)
  if (!city) return { title: 'Kota Tidak Ditemukan — NobarFinder' }
  return {
    title: `Tempat Nobar di ${city.name} — NobarFinder`,
    description: city.description,
    keywords: [`nobar ${city.name.toLowerCase()}`, `tempat nonton bareng ${city.name.toLowerCase()}`, `nobar bola ${city.name.toLowerCase()}`],
    openGraph: { title: `Tempat Nobar di ${city.name}`, description: city.description },
  }
}

const TYPE_LABEL: Record<string, string> = {
  outdoor: '🏟️ Outdoor', cafe: '☕ Kafe', resto: '🍽️ Resto', mall: '🛍️ Mall', komunitas: '⚽ Komunitas',
}

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
  const dateStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })

  if (diffH < 0) return { label: 'Sedang berlangsung', sub: timeStr, urgent: true }
  if (diffH < 24) return { label: 'Hari ini!', sub: timeStr, urgent: true }
  if (diffD === 1) return { label: 'Besok', sub: timeStr, urgent: true }
  if (diffD <= 7) return { label: `${diffD} hari lagi`, sub: `${dateStr} · ${timeStr}`, urgent: false }
  return { label: dateStr, sub: timeStr, urgent: false }
}

export default async function CityPage({ params }: Props) {
  const { city: slug } = await params
  const city = getCityBySlug(slug)
  if (!city) notFound()

  const [venues, events] = await Promise.all([
    getApprovedByCity(slug),
    getUpcomingEventsByCity(slug),
  ])
  const freeCount = venues.filter(v => v.isFree).length

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Tempat Nobar di ${city.name}`,
    numberOfItems: venues.length,
    itemListElement: venues.map((v, i) => ({
      '@type': 'ListItem', position: i + 1, name: v.name,
      url: `https://nobarfinder.com/${slug}/${venueSlug(v)}`,
    })),
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteHeader />

      <section className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-xs text-stone-400 mb-4">
            <Link href="/" className="hover:text-green-700">Beranda</Link>
            {' / '}<span className="text-stone-600">{city.name}</span>
          </div>
          <h1 className="font-display font-black text-stone-900 text-3xl sm:text-4xl">
            {city.emoji} Nobar di {city.name}
          </h1>
          <p className="text-stone-500 mt-2 text-sm max-w-xl">{city.description}</p>
          <div className="flex gap-4 mt-5">
            <div className="text-center">
              <div className="font-black text-2xl text-green-700">{venues.length}</div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wide">Venue</div>
            </div>
            <div className="text-center">
              <div className="font-black text-2xl text-green-700">{freeCount}</div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wide">Gratis</div>
            </div>
            {events.length > 0 && (
              <div className="text-center">
                <div className="font-black text-2xl text-amber-600">{events.length}</div>
                <div className="text-[10px] text-stone-400 uppercase tracking-wide">Event</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Upcoming Events ── */}
        {events.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display font-bold text-stone-900 text-xl mb-4">
              🗓️ Event Mendatang di {city.name}
            </h2>
            <div className="flex flex-col gap-3">
              {events.map(ev => {
                const { label, sub, urgent } = formatEventDate(ev.eventDate)
                return (
                  <Link key={ev.id} href={`/${slug}/${ev.venueCity === slug ? '' : ''}#event-${ev.id}`}
                    className="bg-white border border-stone-200 hover:border-green-500 rounded-2xl px-5 py-4 flex items-center gap-4 transition-all">
                    <div className={`shrink-0 w-14 text-center rounded-xl py-2 ${urgent ? 'bg-amber-50 border border-amber-200' : 'bg-stone-50 border border-stone-100'}`}>
                      <div className={`text-xs font-black ${urgent ? 'text-amber-700' : 'text-stone-600'}`}>{label}</div>
                      <div className="text-[9px] text-stone-400 leading-tight mt-0.5">{sub}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-stone-900 text-sm truncate">{ev.title}</div>
                      <div className="text-xs text-stone-500 mt-0.5 truncate">
                        📍 {ev.venueName} · <span className="text-stone-400">{CAT_LABEL[ev.category] || '📅 Event'}</span>
                      </div>
                      {ev.description && (
                        <div className="text-[11px] text-stone-400 mt-1 line-clamp-1">{ev.description}</div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-green-700 shrink-0">Lihat →</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Venue Grid ── */}
        {venues.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-display font-bold text-stone-900 text-lg mb-1">Belum Ada Venue di {city.name}</div>
            <p className="text-sm text-stone-500 mb-6">Jadilah yang pertama mendaftarkan tempat nobar di kotamu!</p>
            <Link href="/tambah" className="inline-block bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-6 py-2.5 rounded-full transition-colors">
              + Daftarkan Venue Pertama
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display font-bold text-stone-900 text-xl mb-4">Semua Venue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {venues.map(venue => (
                  <div key={venue.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-green-600 hover:shadow-md transition-all relative group">
                  {/* Photo — klik ke detail */}
                  <Link href={`/${slug}/${venueSlug(venue)}`} className="block">
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
                      {/* Tombol Maps — pojok kanan atas, link terpisah dari Link wrapper */}
                    </div>
                  </Link>
                  {venue.mapsUrl && (
                    <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white text-stone-700 hover:text-green-700 text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-all backdrop-blur-sm border border-white/60 z-10 opacity-0 group-hover:opacity-100">
                      🗺️ Maps
                    </a>
                  )}
                  {/* Info — klik ke detail */}
                  <Link href={`/${slug}/${venueSlug(venue)}`} className="block p-5">
                    <h2 className="font-display font-bold text-stone-900 text-lg leading-tight">{venue.name}</h2>
                    <p className="text-xs text-stone-500 mt-1">📍 {venue.address}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">{TYPE_LABEL[venue.type]}</span>
                      {venue.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                      <span className="text-xs text-stone-400">🕐 Buka {venue.openTime} WIB</span>
                      <span className="text-xs font-bold text-green-700">Lihat detail →</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Other cities */}
        <div className="mt-10">
          <h3 className="font-display font-bold text-stone-900 mb-4">Kota Lainnya</h3>
          <div className="flex flex-wrap gap-2">
            {CITY_LIST.filter(c => c.slug !== slug).map(c => (
              <Link key={c.slug} href={`/${c.slug}`} className="bg-white border border-stone-200 hover:border-green-600 text-stone-700 text-xs font-semibold px-4 py-2 rounded-full transition-all">
                {c.emoji} {c.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 bg-green-700 rounded-2xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-display font-bold text-white">Punya venue di {city.name}?</div>
            <div className="text-green-100 text-xs mt-0.5">Daftarkan gratis dengan foto · review max 1×24 jam</div>
          </div>
          <Link href="/tambah" className="bg-white text-green-800 font-bold text-sm px-5 py-2.5 rounded-full hover:bg-green-50 transition-colors whitespace-nowrap">
            + Daftarkan Sekarang
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-stone-200 py-8 text-center text-xs text-stone-400">
        © 2026 NobarFinder.com · <Link href="/" className="hover:text-green-700">Semua Kota</Link>
      </footer>
    </div>
  )
}
