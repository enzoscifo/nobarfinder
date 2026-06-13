import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import PageWrapper from '@/components/PageWrapper'
import { CITY_LIST, getCityBySlug, venueSlug } from '@/lib/data'
import { getApprovedByCity, getEventsByVenue } from '@/lib/db'
import { NobarVenue } from '@/types'
import EventSection from '@/components/EventSection'

interface Props { params: Promise<{ city: string; venue: string }> }

export const revalidate = 60
export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

async function findVenue(citySlug: string, vSlug: string): Promise<NobarVenue | undefined> {
  const venues = await getApprovedByCity(citySlug)
  return venues.find(v => venueSlug(v) === vSlug)
}

const TYPE_LABEL: Record<string, string> = {
  outdoor: 'Outdoor / Lapangan', cafe: 'Kafe', resto: 'Resto / Warung', mall: 'Mall / Indoor', komunitas: 'Komunitas',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, venue: vSlug } = await params
  const city = getCityBySlug(citySlug)
  const venue = await findVenue(citySlug, vSlug)
  if (!city || !venue) return { title: 'Venue Tidak Ditemukan — NobarFinder' }

  const desc = `${venue.name} — tempat nobar ${TYPE_LABEL[venue.type].toLowerCase()} di ${city.name}. ${venue.isFree ? 'Gratis masuk' : 'Berbayar'}, buka ${venue.openTime} WIB. ${venue.address}.`
  return {
    title: `${venue.name} — Nobar di ${city.name} | NobarFinder`,
    description: desc,
    keywords: [venue.name, `nobar ${city.name.toLowerCase()}`, `nonton bareng ${city.name.toLowerCase()}`],
    openGraph: {
      title: `${venue.name} — Nobar ${city.name}`,
      description: desc,
      images: venue.photoUrl ? [venue.photoUrl] : undefined,
    },
  }
}

export default async function VenuePage({ params }: Props) {
  const { city: citySlug, venue: vSlug } = await params
  const city = getCityBySlug(citySlug)
  const venue = await findVenue(citySlug, vSlug)
  if (!city || !venue) notFound()

  const [cityVenues, events] = await Promise.all([
    getApprovedByCity(citySlug),
    getEventsByVenue(venue.id),
  ])
  const related = cityVenues.filter(v => venueSlug(v) !== vSlug).slice(0, 3)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: venue.name,
    address: { '@type': 'PostalAddress', streetAddress: venue.address, addressLocality: city.name, addressRegion: city.province, addressCountry: 'ID' },
    ...(venue.photoUrl && { image: venue.photoUrl }),
    ...(venue.phone && { telephone: venue.phone }),
    description: `Tempat nonton bareng di ${city.name}`,
    priceRange: venue.isFree ? 'Gratis' : 'Rp',
    url: `https://nobarfinder.com/${citySlug}/${vSlug}`,
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteHeader />

      <PageWrapper>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-xs text-stone-400 mb-4">
          <Link href="/" className="hover:text-green-700">Beranda</Link>
          {' / '}<Link href={`/${citySlug}`} className="hover:text-green-700">{city.name}</Link>
          {' / '}<span className="text-stone-600">{venue.name}</span>
        </div>

        {/* Photo hero */}
        <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 h-64 sm:h-80 flex items-center justify-center relative">
          {venue.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.photoUrl} alt={venue.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-7xl opacity-30">{venue.icon}</div>
          )}
          <span className={
            venue.isFree
              ? 'absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full bg-green-600 text-white'
              : 'absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500 text-white'
          }>
            {venue.isFree ? 'GRATIS MASUK' : 'BERBAYAR'}
          </span>
          {/* Tombol Maps di foto */}
          {venue.mapsUrl && (
            <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer"
              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-stone-800 text-xs font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5 transition-all">
              🗺️ Buka Maps
            </a>
          )}
        </div>

        {/* Info */}
        <div className="mt-6">
          <h1 className="font-display font-black text-stone-900 text-3xl sm:text-4xl leading-tight">{venue.name}</h1>
          <p className="text-stone-500 mt-2">📍 {venue.address}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs bg-green-50 text-green-800 border border-green-200 px-3 py-1 rounded-full font-semibold">
              {venue.icon} {TYPE_LABEL[venue.type]}
            </span>
            <span className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full font-medium">🕐 Buka {venue.openTime} WIB</span>
            {venue.tags.map(tag => (
              <span key={tag} className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>

          {/* Deskripsi venue */}
          {venue.description && (
            <div className="mt-5 bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4">
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {venue.description}
              </p>
            </div>
          )}

          {venue.phone && (
            <p className="text-sm text-stone-600 mt-4">📱 {venue.phone}</p>
          )}

          {venue.websiteUrl && (() => {
            let label = venue.websiteUrl
            let icon = '🔗'
            try {
              const u = new URL(venue.websiteUrl)
              const h = u.hostname.replace('www.', '')
              if (h.includes('instagram')) { icon = '📸'; label = '@' + (u.pathname.split('/').filter(Boolean)[0] || h) }
              else if (h.includes('tiktok')) { icon = '🎵'; label = '@' + (u.pathname.split('/').filter(Boolean)[0]?.replace('@','') || h) }
              else if (h.includes('facebook') || h.includes('fb.com')) { icon = '👥'; label = u.pathname.split('/').filter(Boolean)[0] || h }
              else if (h.includes('twitter') || h.includes('x.com')) { icon = '🐦'; label = '@' + (u.pathname.split('/').filter(Boolean)[0] || h) }
              else if (h.includes('youtube')) { icon = '▶️'; label = h }
              else { label = h }
            } catch { /* pakai url asli */ }
            return (
              <a href={venue.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-sm text-green-700 hover:text-green-900 font-medium group">
                <span>{icon}</span>
                <span className="underline underline-offset-2 group-hover:no-underline">{label}</span>
                <span className="text-stone-300 text-xs">↗</span>
              </a>
            )
          })()}

          <div className="flex gap-3 mt-6 flex-wrap">
            {venue.mapsUrl && (
              <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer"
                className="bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-6 py-3 rounded-full transition-colors">
                🗺️ Buka di Google Maps
              </a>
            )}
            <a href={`https://wa.me/?text=${encodeURIComponent(`Nobar bareng yuk di ${venue.name}, ${city.name}! https://nobarfinder.com/${citySlug}/${vSlug}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="bg-white border border-stone-300 hover:border-green-600 text-stone-700 font-bold text-sm px-6 py-3 rounded-full transition-colors">
              Share WA
            </a>
          </div>
        </div>

        {/* Photo CTA if no photo */}
        {!venue.photoUrl && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="text-sm text-green-800">📷 Belum ada foto venue ini. Punya fotonya?</div>
            <Link href="/tambah" className="text-xs font-bold text-green-700 whitespace-nowrap hover:text-green-900">Kirim foto →</Link>
          </div>
        )}

        {/* ── Events Section (client component) ── */}
        <EventSection venueId={venue.id} venueName={venue.name} initialEvents={events} />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display font-bold text-stone-900 text-xl mb-4">Nobar Lain di {city.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {related.map(v => (
                <Link key={v.id} href={`/${citySlug}/${venueSlug(v)}`}
                  className="bg-white border border-stone-200 rounded-xl p-4 hover:border-green-600 transition-all">
                  <div className="text-2xl mb-2">{v.icon}</div>
                  <div className="font-semibold text-sm text-stone-900">{v.name}</div>
                  <div className="text-xs text-stone-400 mt-1">{v.isFree ? 'Gratis' : 'Berbayar'} · {v.openTime} WIB</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      </PageWrapper>

      <footer className="bg-white border-t border-stone-200 py-8 text-center text-xs text-stone-400 mt-8">
        © 2026 NobarFinder.com · <Link href={`/${citySlug}`} className="hover:text-green-700">Kembali ke {city.name}</Link>
      </footer>
    </div>
  )
}
