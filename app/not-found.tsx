import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { CITY_LIST } from '@/lib/data'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <SiteHeader />
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔍⚽</div>
        <h1 className="font-display font-black text-stone-900 text-4xl mb-3">Halaman Tidak Ditemukan</h1>
        <p className="text-stone-500 mb-8">Mungkin venue atau kota yang kamu cari belum terdaftar. Coba pilih kota lain:</p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CITY_LIST.slice(0, 6).map(c => (
            <Link key={c.slug} href={`/${c.slug}`}
              className="bg-white border border-stone-200 hover:border-green-600 text-stone-700 text-sm font-semibold px-4 py-2 rounded-full transition-all">
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>
        <Link href="/" className="inline-block bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-6 py-3 rounded-full transition-colors">
          Kembali ke Beranda
        </Link>
      </main>
    </div>
  )
}
