import { Skeleton } from '@/components/ui/skeleton'
import { SearchResultsSkeleton, SearchFiltersSkeleton } from '@/components/features/search/search-skeleton'

export default function SearchLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 검색 헤더 */}
      <div className="mb-8">
        <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-lg" />
      </div>

      {/* 필터와 결과 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 필터 사이드바 */}
        <div className="lg:w-80">
          <SearchFiltersSkeleton />
        </div>

        {/* 검색 결과 */}
        <div className="flex-1">
          <SearchResultsSkeleton count={10} />
        </div>
      </div>
    </div>
  )
}