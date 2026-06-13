import Link from 'next/link'

export default function SiteHeader() {
  return (
    <header className="bg-white/90 backdrop-blur border-b border-stone-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center text-lg">📍</div>
          <span className="font-display font-black text-xl tracking-tight text-stone-900">
            NOBAR<span className="text-green-700">FINDER</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/tentang" className="hidden sm:block text-sm font-medium text-stone-500 hover:text-stone-900 px-3 py-2 transition-colors">
            Tentang
          </Link>
          <Link
            href="/tambah"
            className="bg-green-700 hover:bg-green-800 text-white text-sm font-bold px-4 py-2 rounded-full transition-colors"
          >
            + Daftarkan Tempat
          </Link>
        </div>
      </div>
    </header>
  )
}
