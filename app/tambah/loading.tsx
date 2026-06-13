import { HeaderSkeleton, Sk } from '@/components/Skeletons'

export default function TambahLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <HeaderSkeleton />
      <main className="max-w-xl mx-auto px-4 py-10 page-enter">
        <div className="text-center mb-8 space-y-3">
          <Sk className="h-12 w-12 rounded-full mx-auto" />
          <Sk className="h-9 w-64 mx-auto" />
          <Sk className="h-4 w-80 max-w-full mx-auto" />
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
          {/* Photo upload area */}
          <Sk className="h-3 w-32 mb-1" />
          <Sk className="h-32 w-full rounded-xl" />
          <Sk className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Sk className="h-10 rounded-xl" />
            <Sk className="h-10 rounded-xl" />
          </div>
          <Sk className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Sk className="h-10 rounded-xl" />
            <Sk className="h-10 rounded-xl" />
          </div>
          <Sk className="h-20 w-full rounded-xl" />
          <Sk className="h-px w-full bg-stone-100" />
          <div className="grid grid-cols-2 gap-4">
            <Sk className="h-10 rounded-xl" />
            <Sk className="h-10 rounded-xl" />
          </div>
        </div>
        <div className="mt-4 bg-white border border-stone-200 rounded-2xl p-6">
          <Sk className="h-14 w-full rounded-xl" />
        </div>
        <Sk className="h-12 w-full rounded-xl mt-4" />
      </main>
    </div>
  )
}
