import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { CITY_LIST } from '@/lib/data'
import { getApprovedVenues } from '@/lib/db'

export const revalidate = 60

export default async function HomePage() {
  const VENUES = await getApprovedVenues()
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <SiteHeader />

      <section className="relative bg-white border-b border-stone-200 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #166534 1px, transparent 1px)', backgroundSize: '60px 100%' }} />
        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 text-xs font-semibold text-green-800 mb-8">
            ⚽ Direktori Nobar #1 Indonesia
          </div>
          <h1 className="font-display font-black leading-[0.85] tracking-tight mb-6">
            <span className="block text-stone-900" style={{ fontSize: 'clamp(64px, 16vw, 160px)' }}>NOBAR</span>
            <span className="block text-green-700" style={{ fontSize: 'clamp(64px, 16vw, 160px)', marginTop: '-0.05em' }}>FINDER</span>
          </h1>
          <p className="text-stone-500 text-base md:text-lg max-w-lg mx-auto mb-10">
            Cari tempat nonton bareng terbaik di kotamu. Gratis maupun berbayar, outdoor sampai kafe ber-AC.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {CITY_LIST.slice(0, 6).map(c => (
              <Link key={c.slug} href={`/${c.slug}`}
                className="bg-white border border-stone-200 hover:border-green-600 hover:text-green-700 text-stone-700 text-sm font-semibold px-4 py-2 rounded-full transition-all">
                {c.emoji} {c.name}
              </Link>
            ))}
            <Link href="#kota" className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-semibold px-4 py-2 rounded-full transition-all">
              Semua kota →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-8 flex justify-center gap-12 md:gap-20">
          <div className="text-center">
            <div className="font-display font-black text-4xl text-green-700">{VENUES.length}+</div>
            <div className="text-xs text-stone-400 mt-1">Tempat Nobar</div>
          </div>
          <div className="text-center">
            <div className="font-display font-black text-4xl text-green-700">{CITY_LIST.length}</div>
            <div className="text-xs text-stone-400 mt-1">Kota</div>
          </div>
          <div className="text-center">
            <div className="font-display font-black text-4xl text-green-700">{VENUES.filter(v => v.isFree).length}</div>
            <div className="text-xs text-stone-400 mt-1">Venue Gratis</div>
          </div>
        </div>
      </section>

      <main id="kota" className="max-w-5xl mx-auto px-4 py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display font-bold text-2xl text-stone-900">Pilih Kotamu</h2>
          <span className="text-xs text-stone-400">Klik untuk lihat daftar venue</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CITY_LIST.map(city => {
            const count = VENUES.filter(v => v.city === city.slug).length
            return (
              <Link key={city.slug} href={`/${city.slug}`}
                className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-green-600 hover:shadow-md transition-all group">
                <div className="text-3xl mb-3">{city.emoji}</div>
                <div className="font-display font-bold text-stone-900 group-hover:text-green-700 transition-colors">{city.name}</div>
                <div className="text-[11px] text-stone-400 mt-0.5">{city.province}</div>
                <div className="mt-3 text-xs font-semibold">
                  {count > 0 ? <span className="text-green-700">{count} venue →</span> : <span className="text-stone-300">Segera hadir</span>}
                </div>
              </Link>
            )
          })}
        </div>
        <div className="mt-12 bg-green-700 rounded-3xl px-6 py-10 text-center">
          <div className="text-4xl mb-3">📍</div>
          <h3 className="font-display font-black text-white text-2xl md:text-3xl mb-2">Punya Tempat Nobar?</h3>
          <p className="text-green-100 text-sm mb-6 max-w-md mx-auto">
            Kafe, resto, atau komunitas — daftarkan gratis dengan foto, dan jangkau ribuan penggemar bola di kotamu.
          </p>
          <Link href="/tambah" className="inline-block bg-white text-green-800 font-bold text-sm px-7 py-3 rounded-full hover:bg-green-50 transition-colors">
            Daftarkan Tempat Gratis →
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-stone-200 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="font-display font-black text-lg tracking-tight">NOBAR<span className="text-green-700">FINDER</span></Link>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-stone-400">
              {CITY_LIST.slice(0, 5).map(c => (<Link key={c.slug} href={`/${c.slug}`} className="hover:text-green-700">Nobar {c.name}</Link>))}
              <Link href="/tambah" className="hover:text-green-700 font-semibold">Daftarkan Tempat</Link>
            </div>
          </div>
          <div className="text-center text-xs text-stone-400 mt-6 pt-6 border-t border-stone-100">
            © 2026 NobarFinder.com · Direktori tempat nonton bareng di Indonesia 🇮🇩
          </div>
        </div>
      </footer>
    </div>
  )
}
