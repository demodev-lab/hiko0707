'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'
import { HotDealFilters } from '@/components/features/filter/hotdeal-filters'
import { EmptyState } from '@/components/ui/error'
import { HotDeal } from '@/types/hotdeal'
import { StaggerContainer, StaggerItem } from '@/components/ui/animated'
import { calculateTodayRankings } from '@/lib/utils/ranking-utils'

interface HotDealsClientProps {
  initialDeals: HotDeal[]
}

export function HotDealsClient({ initialDeals }: HotDealsClientProps) {
  const searchParams = useSearchParams()
  // 순위 계산된 핫딜 목록
  const rankedDeals = useMemo(() => calculateTodayRankings(initialDeals), [initialDeals])
  const [filteredDeals, setFilteredDeals] = useState<HotDeal[]>(rankedDeals)

  // Get filter params - memoized to prevent infinite loops
  const categories = useMemo(() => 
    searchParams.get('categories')?.split(',').filter(Boolean) || [], 
    [searchParams]
  )
  const communitySources = useMemo(() => 
    searchParams.get('communitySources')?.split(',').filter(Boolean) || [], 
    [searchParams]
  )
  const shoppingSources = useMemo(() => 
    searchParams.get('shoppingSources')?.split(',').filter(Boolean) || [], 
    [searchParams]
  )
  const sort = searchParams.get('sort') || 'latest'
  const priceMin = searchParams.get('priceMin')
  const priceMax = searchParams.get('priceMax')
  const freeShipping = searchParams.get('freeShipping') === 'true'
  const todayOnly = searchParams.get('todayOnly') === 'true'
  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    let filtered = [...rankedDeals]

    // Apply filters
    if (categories.length > 0) {
      filtered = filtered.filter(d => d.category && categories.includes(d.category))
    }
    if (communitySources.length > 0) {
      filtered = filtered.filter(d => d.source && communitySources.includes(d.source))
    }
    if (shoppingSources.length > 0) {
      filtered = filtered.filter(d => d.seller && shoppingSources.includes(d.seller))
    }
    if (priceMin) {
      filtered = filtered.filter(d => d.price >= parseInt(priceMin))
    }
    if (priceMax) {
      filtered = filtered.filter(d => d.price <= parseInt(priceMax))
    }
    if (freeShipping) {
      filtered = filtered.filter(d => d.shipping?.isFree)
    }
    if (todayOnly) {
      const today = new Date().toDateString()
      filtered = filtered.filter(d => new Date(d.crawledAt).toDateString() === today)
    }

    // Apply sorting
    switch (sort) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        break
      default: // 'latest'
        filtered.sort((a, b) => new Date(b.crawledAt).getTime() - new Date(a.crawledAt).getTime())
    }

    setFilteredDeals(filtered)
  }, [rankedDeals, categories, communitySources, shoppingSources, sort, priceMin, priceMax, freeShipping, todayOnly])

  // Pagination
  const itemsPerPage = 12
  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const paginatedDeals = filteredDeals.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-safe">
      {/* 필터 사이드바 */}
      <div className="lg:w-80">
        <HotDealFilters />
      </div>

      {/* 핫딜 목록 */}
      <div className="flex-1">
        {paginatedDeals.length > 0 ? (
          <>
            <StaggerContainer 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8"
              staggerDelay={0.1}
            >
              {paginatedDeals.map((deal, index) => (
                <StaggerItem key={deal.id} index={index}>
                  <HotDealCard deal={deal} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-4 mt-8">
                {/* 페이지 정보 */}
                <div className="text-sm text-gray-600">
                  페이지 {page} / {totalPages} (총 {filteredDeals.length}개 핫딜)
                </div>
                
                {/* 페이지 버튼 */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* 첫 페이지 */}
                  {page > 2 && (
                    <Link
                      href={`?page=1${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '').length > 0 ? '&' : ''}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '')}`}
                      className="p-2 sm:p-2.5 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="첫 페이지로"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Link>
                  )}
                  
                  {/* 이전 */}
                  {page > 1 && (
                    <Link
                      href={`?page=${page - 1}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '').length > 0 ? '&' : ''}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '')}`}
                      className="flex items-center gap-1 px-3 sm:px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] justify-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">이전</span>
                    </Link>
                  )}
                  
                  {/* 페이지 번호 */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                      if (pageNum > totalPages) return null
                      
                      const params = new URLSearchParams(searchParams.toString())
                      params.set('page', pageNum.toString())
                      
                      return (
                        <Link
                          key={pageNum}
                          href={`?${params.toString()}`}
                          className={`min-w-[44px] h-[44px] flex items-center justify-center rounded-md text-sm sm:text-base transition-colors ${
                            pageNum === page
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'border hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      )
                    })}
                  </div>

                  {/* 다음 */}
                  {page < totalPages && (
                    <Link
                      href={`?page=${page + 1}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '').length > 0 ? '&' : ''}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '')}`}
                      className="flex items-center gap-1 px-3 sm:px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] justify-center"
                    >
                      <span className="hidden sm:inline">다음</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                  
                  {/* 마지막 페이지 */}
                  {page < totalPages - 1 && (
                    <Link
                      href={`?page=${totalPages}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '').length > 0 ? '&' : ''}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '')}`}
                      className="p-2 sm:p-2.5 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="마지막 페이지로"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="핫딜이 없습니다"
            message="조건에 맞는 핫딜을 찾을 수 없습니다. 필터를 조정해보세요."
          />
        )}
      </div>
    </div>
  )
}