import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { HotDealListSkeleton } from '@/components/features/hotdeal/hotdeal-card-skeleton'

export default function HotDealsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 스켈레톤 */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* 통계 스켈레톤 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-2xl mx-auto">
        {[1, 2].map((i) => (
          <Card key={i} className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 검색 바 스켈레톤 */}
      <div className="mb-8">
        <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-lg" />
      </div>

      {/* 필터와 핫딜 목록 스켈레톤 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 필터 사이드바 스켈레톤 */}
        <div className="lg:w-80">
          <Card className="p-4 space-y-4">
            {/* 필터 섹션들 */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* 핫딜 목록 스켈레톤 */}
        <div className="flex-1">
          <HotDealListSkeleton count={12} />
        </div>
      </div>
    </div>
  )
}