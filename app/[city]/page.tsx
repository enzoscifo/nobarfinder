import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import { CITY_LIST, getCityBySlug, venueSlug } from '@/lib/data'
import { getApprovedByCity } from '@/lib/db'

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

export default async function CityPage({ params }: Props) {
  const { city: slug } = await params
  const city = getCityBySlug(slug)
  if (!city) notFound()
  const venues = await getApprovedByCity(slug)
  const freeCount = venues.filter(v => v.isFree).length

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Tempat Nobar di ${city.name}`,
    numberOfItems: venues.length,
    itemListElement: venues.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: v.name,
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
          <div className="flex items-center gap-4">
            <div className="text-5xl">{city.emoji}</div>
            <div>
              <h1 className="font-display font-black text-stone-900 leading-tight" style={{ fontSize: 'clamp(30px, 5vw, 46px)' }}>
                Nobar di {city.name}
              </h1>
              <p className="text-stone-500 text-sm mt-1">{venues.length} venue · {freeCount} gratis · {city.province}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {venues.map(venue => (
              <Link key={venue.id} href={`/${slug}/${venueSlug(venue)}`} className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-green-600 hover:shadow-md transition-all block">
                {/* Photo */}
                <div className="h-44 bg-stone-100 relative flex items-center justify-center">
                  {venue.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={venue.photoUrl} alt={venue.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-5xl opacity-30">{venue.icon}</div>
                  )}
                  <span className={
                    venue.isFree
                      ? 'absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-600 text-white'
                      : 'absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white'
                  }>
                    {venue.isFree ? 'GRATIS' : 'BAYAR'}
                  </span>
                </div>
                {/* Info */}
                <div className="p-5">
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
                </div>
              </Link>
            ))}
          </div>
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
