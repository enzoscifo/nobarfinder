import { HeaderSkeleton, CityHeroSkeleton, VenueGridSkeleton, Sk } from '@/components/Skeletons'

export default function CityLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <HeaderSkeleton />
      <CityHeroSkeleton />

      <main className="max-w-5xl mx-auto px-4 py-8 page-enter">
        {/* Event strip */}
        <div className="mb-8">
          <Sk className="h-6 w-52 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-2xl px-5 py-4 flex gap-4">
                <Sk className="h-14 w-14 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Sk className="h-4 w-2/3" />
                  <Sk className="h-3 w-1/2" />
                  <Sk className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venue grid */}
        <Sk className="h-6 w-36 mb-4" />
        <VenueGridSkeleton count={4} />
      </main>
    </div>
  )
}
