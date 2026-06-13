import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Tentang NobarFinder — Direktori Nobar Indonesia',
  description: 'NobarFinder adalah direktori tempat nonton bareng terlengkap di Indonesia. Gratis untuk pengunjung dan untuk venue yang ingin terdaftar.',
}

export default function TentangPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-display font-black text-stone-900 text-4xl mb-6">Tentang NobarFinder</h1>

        <div className="space-y-5 text-stone-600 leading-relaxed">
          <p>
            <strong className="text-stone-900">NobarFinder</strong> lahir dari satu masalah sederhana:
            mencari tempat nonton bareng (nobar) di Indonesia itu ribet. Informasinya tersebar
            di story Instagram yang hilang 24 jam, thread Twitter, dan grup WhatsApp yang susah dilacak.
          </p>
          <p>
            Kami mengumpulkan tempat-tempat nobar di berbagai kota — dari layar tancap di alun-alun,
            kafe ber-AC dengan proyektor, sampai komunitas suporter — dalam satu direktori yang mudah dicari.
          </p>
          <p>
            Semua gratis. Pengunjung bebas mencari, dan pemilik venue bisa
            <Link href="/tambah" className="text-green-700 font-semibold hover:text-green-900"> mendaftarkan tempatnya</Link> tanpa biaya.
            Setiap submission kami moderasi dulu agar informasinya akurat.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔍', title: 'Mudah Dicari', desc: 'Cari per kota dalam hitungan detik' },
            { icon: '✅', title: 'Terverifikasi', desc: 'Semua venue dimoderasi dulu' },
            { icon: '🆓', title: 'Gratis', desc: 'Untuk pengunjung & pemilik venue' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-stone-200 rounded-2xl p-5 text-center">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-display font-bold text-stone-900">{f.title}</div>
              <div className="text-xs text-stone-400 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-green-700 rounded-2xl px-6 py-8 text-center">
          <h2 className="font-display font-bold text-white text-xl mb-2">Punya tempat nobar?</h2>
          <p className="text-green-100 text-sm mb-5">Daftarkan gratis dan jangkau penggemar bola di kotamu.</p>
          <Link href="/tambah" className="inline-block bg-white text-green-800 font-bold text-sm px-6 py-3 rounded-full hover:bg-green-50 transition-colors">
            Daftarkan Tempat →
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-stone-200 py-8 text-center text-xs text-stone-400">
        © 2026 NobarFinder.com · <Link href="/" className="hover:text-green-700">Beranda</Link>
      </footer>
    </div>
  )
}
