import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SearchResultSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* 이미지 */}
          <Skeleton className="w-24 h-24 rounded-md flex-shrink-0" />
          
          {/* 콘텐츠 */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            
            <div className="flex items-center gap-4 pt-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SearchResultsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* 검색 결과 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      
      {/* 검색 결과 목록 */}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <SearchResultSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function SearchFiltersSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-6">
        {/* 카테고리 필터 */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        
        {/* 가격 필터 */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
        
        {/* 정렬 */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}