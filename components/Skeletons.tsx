// Skeleton components — dipakai di loading.tsx tiap route

// ── Blok dasar ──
export function Sk({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

// ── Header skeleton ──
export function HeaderSkeleton() {
  return (
    <header className="bg-white border-b border-stone-200 h-16 flex items-center px-4">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <Sk className="h-7 w-40 rounded-lg" />
        <div className="flex gap-3">
          <Sk className="h-8 w-20 rounded-full" />
          <Sk className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </header>
  )
}

// ── Kartu venue (grid) ──
export function VenueCardSkeleton() {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <Sk className="h-44 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Sk className="h-5 w-3/4" />
        <Sk className="h-3 w-full" />
        <div className="flex gap-2 pt-1">
          <Sk className="h-5 w-16 rounded-full" />
          <Sk className="h-5 w-12 rounded-full" />
          <Sk className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex justify-between pt-2 border-t border-stone-100">
          <Sk className="h-3 w-24" />
          <Sk className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

// ── Grid venue (halaman kota) ──
export function VenueGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <VenueCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── Hero halaman kota ──
export function CityHeroSkeleton() {
  return (
    <section className="bg-white border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Sk className="h-3 w-32 mb-4" />
        <Sk className="h-10 w-64 mb-3" />
        <Sk className="h-4 w-96 max-w-full mb-5" />
        <div className="flex gap-4">
          <div className="text-center"><Sk className="h-8 w-12 mx-auto mb-1" /><Sk className="h-2.5 w-10 mx-auto" /></div>
          <div className="text-center"><Sk className="h-8 w-12 mx-auto mb-1" /><Sk className="h-2.5 w-12 mx-auto" /></div>
        </div>
      </div>
    </section>
  )
}

// ── Event card ──
export function EventCardSkeleton() {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <Sk className="h-6 w-full mb-3 rounded-lg" />
      <div className="flex gap-3">
        <Sk className="h-8 w-8 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Sk className="h-4 w-3/4" />
          <Sk className="h-3 w-1/2" />
          <Sk className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  )
}

// ── Halaman detail venue ──
export function VenueDetailSkeleton() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 page-enter">
      <Sk className="h-3 w-48 mb-4" />
      {/* Hero photo */}
      <Sk className="h-64 sm:h-80 w-full rounded-2xl mb-6" />
      {/* Title */}
      <Sk className="h-10 w-3/4 mb-2" />
      <Sk className="h-4 w-full mb-4" />
      {/* Tags */}
      <div className="flex gap-2 mb-5">
        <Sk className="h-6 w-24 rounded-full" />
        <Sk className="h-6 w-20 rounded-full" />
        <Sk className="h-6 w-16 rounded-full" />
      </div>
      {/* Description */}
      <Sk className="h-24 w-full rounded-2xl mb-6" />
      {/* Buttons */}
      <div className="flex gap-3 mb-10">
        <Sk className="h-12 w-44 rounded-full" />
        <Sk className="h-12 w-28 rounded-full" />
      </div>
      {/* Events section */}
      <Sk className="h-6 w-48 mb-4" />
      <div className="space-y-3">
        <EventCardSkeleton />
        <EventCardSkeleton />
      </div>
    </main>
  )
}

// ── Kota cards (homepage) ──
export function CityCardSkeleton() {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <Sk className="h-8 w-8 rounded-lg mb-3" />
      <Sk className="h-5 w-24 mb-1" />
      <Sk className="h-3 w-16 mb-3" />
      <Sk className="h-3 w-12" />
    </div>
  )
}
