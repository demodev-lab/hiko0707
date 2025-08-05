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
import { Card } from '@/components/ui/card'

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
      filtered = filtered.filter(d => d.sale_price >= parseInt(priceMin))
    }
    if (priceMax) {
      filtered = filtered.filter(d => d.sale_price <= parseInt(priceMax))
    }
    // freeShipping 필터는 현재 스키마에 없어서 제거
    if (todayOnly) {
      const today = new Date().toDateString()
      filtered = filtered.filter(d => new Date(d.created_at).toDateString() === today)
    }

    // Apply sorting
    switch (sort) {
      case 'price_low':
        filtered.sort((a, b) => a.sale_price - b.sale_price)
        break
      case 'price_high':
        filtered.sort((a, b) => b.sale_price - a.sale_price)
        break
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0))
        break
      default: // 'latest'
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
      {/* 필터 사이드바 - 모바일에서는 숨김 */}
      <div className="hidden lg:block lg:w-64 xl:w-72 mobile-filter-section">
        <HotDealFilters showMobileToggle={false} />
      </div>
      
      {/* 모바일 전용 필터 */}
      <div className="lg:hidden">
        <HotDealFilters showMobileToggle={true} />
      </div>

      {/* 핫딜 목록 */}
      <div className="flex-1">
        {paginatedDeals.length > 0 ? (
          <>
            <StaggerContainer 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-7 gap-4 sm:gap-6 lg:gap-8 mb-8"
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
              <div className="mt-12">
                <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  <div className="flex flex-col items-center gap-4">
                    {/* 페이지 정보 */}
                    <div className="text-base font-medium text-gray-700 dark:text-gray-300">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{page}</span> / {totalPages} 페이지
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        (총 {filteredDeals.length.toLocaleString()}개)
                      </span>
                    </div>
                
                    {/* 페이지 버튼 */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      {/* 첫 페이지 */}
                      {page > 2 && (
                        <Link
                          href={`?page=1${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '').length > 0 ? '&' : ''}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '')}`}
                          className="p-2.5 sm:p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-sm"
                          aria-label="첫 페이지로"
                        >
                          <ChevronsLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                      )}
                  
                      {/* 이전 */}
                      {page > 1 && (
                        <Link
                          href={`?page=${page - 1}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '').length > 0 ? '&' : ''}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '')}`}
                          className="flex items-center gap-1 px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-sm font-medium"
                        >
                          <ChevronLeft className="w-5 h-5" />
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
                          className={`min-w-[48px] h-[48px] sm:min-w-[52px] sm:h-[52px] flex items-center justify-center rounded-lg text-base sm:text-lg font-medium transition-all shadow-sm ${
                            pageNum === page
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 scale-105 shadow-lg'
                              : 'border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
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
                          className="flex items-center gap-1 px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-sm font-medium"
                        >
                          <span className="hidden sm:inline">다음</span>
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      )}
                      
                      {/* 마지막 페이지 */}
                      {page < totalPages - 1 && (
                        <Link
                          href={`?page=${totalPages}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '').length > 0 ? '&' : ''}${searchParams.toString().replace(/page=\d+&?/, '').replace(/^&/, '')}`}
                          className="p-2.5 sm:p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-sm"
                          aria-label="마지막 페이지로"
                        >
                          <ChevronsRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
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