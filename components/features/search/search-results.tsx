'use client'

import { useState } from 'react'
import { HotDeal } from '@/types/hotdeal'
import { useSearchHotDeals, useHotDeals } from '@/hooks/use-supabase-hotdeals'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/error'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'

interface SearchResultsProps {
  query: string
  filters: {
    category?: string
    source?: string
    sortBy?: string
    minPrice?: number
    maxPrice?: number
  }
}

export function SearchResults({ query, filters }: SearchResultsProps) {
  const { t } = useLanguage()
  const [page, setPage] = useState(1)
  const itemsPerPage = 12

  // 검색어가 있을 때와 없을 때 조건부 훅 사용
  const searchEnabled = query && query.length > 0
  
  // 검색 옵션 준비
  const searchOptions = {
    category: filters.category && filters.category !== 'all' ? filters.category : undefined,
    source: filters.source && filters.source !== 'all' ? filters.source : undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sortBy: filters.sortBy === 'price_low' ? 'price' as const :
            filters.sortBy === 'price_high' ? 'price' as const :
            filters.sortBy === 'popular' ? 'view_count' as const :
            filters.sortBy === 'discount' ? 'like_count' as const :
            'created_at' as const,
    sortOrder: filters.sortBy === 'price_low' ? 'asc' as const :
               filters.sortBy === 'price_high' ? 'desc' as const :
               'desc' as const,
    status: 'active' as const,
    limit: 1000 // 충분히 큰 값으로 설정
  }

  const { 
    data: searchResults, 
    isLoading: searchLoading, 
    error: searchError 
  } = useSearchHotDeals(query, searchOptions)

  const { 
    data: allDealsData, 
    isLoading: allDealsLoading, 
    error: allDealsError 
  } = useHotDeals(searchOptions)

  // 결과 통합 및 데이터 매핑
  const mapSupabaseToHotDeal = (supabaseData: any): HotDeal => ({
    id: supabaseData.id,
    source: supabaseData.source,
    sourcePostId: supabaseData.source_id,
    category: supabaseData.category,
    title: supabaseData.title,
    productComment: supabaseData.description,
    price: supabaseData.sale_price || 0,
    seller: supabaseData.seller,
    originalUrl: supabaseData.original_url,
    imageUrl: supabaseData.image_url,
    thumbnailImageUrl: supabaseData.thumbnail_url,
    viewCount: supabaseData.views || 0,
    likeCount: supabaseData.like_count || 0,
    commentCount: supabaseData.comment_count || 0,
    crawledAt: new Date(supabaseData.crawled_at || supabaseData.created_at),
    status: supabaseData.status,
    shipping: {
      isFree: supabaseData.is_free_shipping || false
    }
  })

  const rawResults = searchEnabled ? (searchResults?.data || []) : (allDealsData?.data || [])
  const results = rawResults.map(mapSupabaseToHotDeal)
  const loading = searchEnabled ? searchLoading : allDealsLoading
  const error = searchEnabled ? searchError : allDealsError

  // Pagination
  const totalPages = Math.ceil(results.length / itemsPerPage)
  const paginatedResults = results.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        title="데이터를 불러오는 중 오류가 발생했습니다"
        message="잠시 후 다시 시도해주세요"
        actionLabel="다시 시도"
        onAction={() => window.location.reload()}
      />
    )
  }

  // No results
  if (results.length === 0) {
    return (
      <EmptyState
        title={query ? `"${query}"에 대한 검색 결과가 없습니다` : '검색 결과가 없습니다'}
        message={query ? '다른 검색어를 시도해보세요' : '검색어를 입력하거나 필터를 조정해보세요'}
        actionLabel="필터 초기화"
        onAction={() => window.location.href = '/search'}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">
            총 <span className="font-semibold text-gray-900">{results.length}개</span>의 핫딜
          </p>
          {query && (
            <Badge variant="secondary">
&ldquo;{query}&rdquo; 검색결과
            </Badge>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          {page} / {totalPages} 페이지
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedResults.map((deal) => (
          <HotDealCard key={deal.id} deal={deal} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          
          <div className="flex gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              if (pageNum > totalPages) return null
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}

// 검색어 하이라이트 컴포넌트
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>

  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 font-semibold">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  )
}