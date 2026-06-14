import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { CITY_LIST, VENUES } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Tentang NobarFinder — Direktori Tempat Nonton Bareng Indonesia',
  description: 'NobarFinder adalah direktori tempat nobar terlengkap di Indonesia. Gratis, komunitas-driven, dan selalu update.',
}

const STATS = [
  { value: `${VENUES.length}+`, label: 'Venue Terdaftar' },
  { value: `${CITY_LIST.length}`, label: 'Kota' },
  { value: '100%', label: 'Gratis' },
]

const FITUR = [
  {
    icon: '📍',
    title: 'Cari Venue di Kotamu',
    desc: 'Filter berdasarkan tipe (kafe, outdoor, mall, komunitas), biaya masuk, dan cari nama venue langsung dari halaman kota.',
  },
  {
    icon: '🗓️',
    title: 'Event Nobar Real-Time',
    desc: 'Siapa pun bisa tambahkan event nobar di suatu venue. Event otomatis hilang setelah 24 jam, jadi informasi selalu segar.',
  },
  {
    icon: '📲',
    title: 'Bisa Diinstall di HP',
    desc: 'NobarFinder adalah Progressive Web App — bisa diinstall di layar utama Android dan iOS. Akses cepat seperti aplikasi native.',
  },
  {
    icon: '🔗',
    title: 'Terhubung ke Google Maps',
    desc: 'Setiap venue dilengkapi tombol Maps. Satu tap langsung navigasi ke lokasi venue dari mana pun kamu berada.',
  },
  {
    icon: '📤',
    title: 'Daftarkan Venue Gratis',
    desc: 'Punya warung, kafe, atau komunitas yang rutin nobar? Daftarkan gratis dengan foto. Biasanya disetujui dalam 1×24 jam.',
  },
  {
    icon: '🚩',
    title: 'Komunitas Moderasi',
    desc: 'Event dan venue yang tidak akurat bisa dilaporkan oleh pengunjung. Sistem berlapis menjaga kualitas informasi.',
  },
]

const FAQ = [
  {
    q: 'Apakah NobarFinder gratis?',
    a: 'Sepenuhnya gratis — untuk pengguna maupun pemilik venue. Tidak ada iklan, tidak ada biaya pendaftaran.',
  },
  {
    q: 'Bagaimana cara mendaftarkan venue?',
    a: 'Klik tombol "+ Daftarkan Tempat" di pojok kanan atas, isi form dengan data venue dan (opsional) event pertama, lalu submit. Admin akan mereview dalam 1×24 jam.',
  },
  {
    q: 'Venue saya sudah disetujui, bagaimana update informasinya?',
    a: 'Hubungi admin via tombol Share di halaman venue. Kami akan update informasi sesuai permintaan. Ke depan akan ada fitur klaim venue.',
  },
  {
    q: 'Apakah event yang ditambahkan langsung tampil?',
    a: 'Event masuk antrian moderasi terlebih dahulu dan akan tampil setelah disetujui admin. Event otomatis dihapus 24 jam setelah waktu pelaksanaan.',
  },
  {
    q: 'Kota saya belum ada di daftar, bisa didaftarkan?',
    a: 'Bisa! Saat submit venue, pilih "Kota Lainnya" dan isi nama kotamu. Kamu akan jadi pelopor komunitas nobar di kota tersebut.',
  },
]

export default function TentangPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">📍</div>
          <h1 className="font-display font-black text-stone-900 text-4xl sm:text-5xl mb-4 leading-tight">
            Tentang<br /><span className="text-green-700">NobarFinder</span>
          </h1>
          <p className="text-stone-500 text-lg max-w-xl mx-auto leading-relaxed">
            Direktori tempat nonton bareng terlengkap di Indonesia.
            Dibuat untuk komunitas, dikelola bersama komunitas.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-10 mt-10">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display font-black text-4xl text-green-700">{s.value}</div>
                <div className="text-xs text-stone-400 mt-1 font-medium uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-16">

        {/* Misi */}
        <section>
          <h2 className="font-display font-bold text-stone-900 text-2xl mb-4">Kenapa NobarFinder Ada?</h2>
          <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed space-y-4">
            <p>
              Nobar adalah tradisi Indonesia. Setiap Piala Dunia, Piala Asia, atau Liga Champions,
              jutaan orang Indonesia turun ke jalan, kafe, dan lapangan untuk nonton bareng —
              karena bola lebih seru kalau ditonton ramai-ramai.
            </p>
            <p>
              Masalahnya, informasi venue nobar selalu tersebar — di grup WhatsApp, story Instagram,
              atau dari mulut ke mulut. Tidak ada satu tempat yang mengumpulkan semua informasi ini.
              NobarFinder hadir untuk mengisi kekosongan itu.
            </p>
            <p>
              Kami bukan korporasi besar. NobarFinder adalah proyek komunitas yang dibuat
              sederhana dan berfokus pada satu hal: membantu kamu menemukan tempat nobar terbaik
              di kotamu — secepat mungkin, semudah mungkin.
            </p>
          </div>
        </section>

        {/* Fitur */}
        <section>
          <h2 className="font-display font-bold text-stone-900 text-2xl mb-6">Yang Bisa Kamu Lakukan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FITUR.map(f => (
              <div key={f.title} className="bg-white border border-stone-200 rounded-2xl p-5">
                <div className="text-3xl mb-3" aria-hidden="true">{f.icon}</div>
                <h3 className="font-bold text-stone-900 text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cara kerja */}
        <section>
          <h2 className="font-display font-bold text-stone-900 text-2xl mb-6">Cara Kerja</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Siapapun bisa submit venue atau event', desc: 'Pengunjung mengisi form dengan data venue/event. Proses hanya butuh 2 menit.' },
              { step: '2', title: 'Admin review dalam 1×24 jam', desc: 'Tim moderasi NobarFinder memeriksa akurasi data sebelum ditampilkan ke publik.' },
              { step: '3', title: 'Venue tampil permanen, event hilang setelah 24 jam', desc: 'Data venue tersimpan selamanya. Event otomatis dihapus 24 jam setelah waktu pelaksanaan agar informasi selalu relevan.' },
              { step: '4', title: 'Komunitas jaga kualitas', desc: 'Pengunjung bisa laporkan event yang tidak akurat. Event dengan 3 laporan otomatis disembunyikan untuk direview ulang.' },
            ].map(item => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <div className="font-semibold text-stone-900 text-sm">{item.title}</div>
                  <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Kota */}
        <section>
          <h2 className="font-display font-bold text-stone-900 text-2xl mb-4">Kota yang Tersedia</h2>
          <div className="flex flex-wrap gap-2">
            {CITY_LIST.map(c => (
              <Link key={c.slug} href={`/${c.slug}`}
                className="bg-white border border-stone-200 hover:border-green-600 hover:text-green-700 text-stone-700 text-sm font-semibold px-4 py-2 rounded-full transition-all">
                {c.emoji} {c.name}
              </Link>
            ))}
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-2 rounded-full">
              + kotamu?
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-3">
            Kotamu belum ada?{' '}
            <Link href="/tambah" className="text-green-700 font-medium hover:underline">
              Daftarkan venue pertama di kotamu →
            </Link>
          </p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="font-display font-bold text-stone-900 text-2xl mb-6">FAQ</h2>
          <div className="space-y-4">
            {FAQ.map(item => (
              <div key={item.q} className="bg-white border border-stone-200 rounded-2xl px-5 py-4">
                <div className="font-semibold text-stone-900 text-sm mb-1.5">{item.q}</div>
                <div className="text-sm text-stone-500 leading-relaxed">{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-green-700 rounded-3xl px-6 py-10 text-center">
          <div className="text-4xl mb-3">⚽</div>
          <h2 className="font-display font-black text-white text-3xl mb-2">Siap Nobar?</h2>
          <p className="text-green-100 text-sm mb-6">
            Temukan venue di kotamu atau daftarkan tempat nobarmu sekarang.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="bg-white text-green-800 font-bold text-sm px-6 py-3.5 rounded-full hover:bg-green-50 transition-colors">
              Cari Venue →
            </Link>
            <Link href="/tambah" className="bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-6 py-3.5 rounded-full transition-colors border border-green-500">
              + Daftarkan Venue
            </Link>
          </div>
        </section>

      </main>

      <footer className="bg-white border-t border-stone-200 py-8 text-center text-xs text-stone-400 mt-4">
        © 2026 NobarFinder.com · Dibuat dengan ❤️ untuk komunitas nobar Indonesia 🇮🇩
      </footer>
    </div>
  )
}
