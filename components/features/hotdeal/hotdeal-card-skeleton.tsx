import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function HotDealCardSkeleton() {
  return (
    <Card className="h-full transition-all duration-200">
      <CardContent className="p-0">
        {/* 이미지 스켈레톤 */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          <Skeleton className="w-full h-full" />
          <div className="absolute top-2 right-2">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        
        {/* 콘텐츠 스켈레톤 */}
        <div className="p-4 space-y-3">
          {/* 카테고리와 출처 */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          
          {/* 제목 */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          
          {/* 가격 */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          
          {/* 메타 정보 */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          
          {/* 버튼 */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

export function HotDealListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <HotDealCardSkeleton key={i} />
      ))}
    </div>
  )
}