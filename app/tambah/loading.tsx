import { HeaderSkeleton, Sk } from '@/components/Skeletons'

export default function TambahLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <HeaderSkeleton />
      <main className="max-w-xl mx-auto px-4 py-8 pb-20">
        {/* Header */}
        <div className="text-center mb-6 space-y-2">
          <Sk className="h-9 w-56 mx-auto rounded-xl" />
          <Sk className="h-4 w-48 mx-auto" />
        </div>

        {/* Venue section */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-5">
          {/* Section head */}
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Sk className="h-7 w-7 rounded-lg" />
            <Sk className="h-5 w-28" />
          </div>
          {/* Photo upload */}
          <Sk className="h-3 w-32 mb-1" />
          <Sk className="h-40 w-full rounded-xl" />
          {/* Fields */}
          {[48, 48, 48, 48, 48, 48, 80].map((h, i) => (
            <div key={i}>
              <Sk className="h-3 w-24 mb-1.5" />
              <div className="skeleton w-full rounded-xl" style={{ height: h }} />
            </div>
          ))}
        </div>

        {/* Event toggle */}
        <div className="mt-4 bg-white border border-stone-200 rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Sk className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Sk className="h-4 w-36" />
                <Sk className="h-3 w-48" />
              </div>
            </div>
            <Sk className="h-7 w-12 rounded-full shrink-0" />
          </div>
        </div>

        {/* Submit sticky */}
        <div className="sticky bottom-4 pt-4">
          <Sk className="h-14 w-full rounded-2xl" />
        </div>
      </main>
    </div>
  )
}
