import { HeaderSkeleton, VenueDetailSkeleton } from '@/components/Skeletons'

export default function VenueLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <HeaderSkeleton />
      <VenueDetailSkeleton />
    </div>
  )
}
