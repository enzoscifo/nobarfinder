import { HeaderSkeleton, CityCardSkeleton, Sk } from '@/components/Skeletons'

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <HeaderSkeleton />

      {/* Hero */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-4">
          <Sk className="h-6 w-48 rounded-full mx-auto" />
          <Sk className="h-32 w-72 mx-auto rounded-xl" />
          <Sk className="h-5 w-96 max-w-full mx-auto" />
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-9 w-24 rounded-full" />)}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-8 flex justify-center gap-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Sk className="h-9 w-14 mx-auto" />
              <Sk className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </section>

      {/* City grid */}
      <main className="max-w-5xl mx-auto px-4 py-14">
        <Sk className="h-7 w-36 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <CityCardSkeleton key={i} />)}
        </div>
      </main>
    </div>
  )
}
