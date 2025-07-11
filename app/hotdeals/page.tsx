'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { db } from '@/lib/db/database-service'
import { SearchBar } from '@/components/features/search/search-bar'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'
import { HotDealFilters } from '@/components/features/filter/hotdeal-filters'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/error'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Package, Zap, Percent } from 'lucide-react'
import { HotDeal } from '@/types/hotdeal'
import { Card } from '@/components/ui/card'

export default function HotDealsPage() {
  const searchParams = useSearchParams()
  const [hotdeals, setHotdeals] = useState<HotDeal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<HotDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    active: 0,
    freeShipping: 0,
    today: 0,
    highDiscount: 0
  })

  // Get filter params - memoized to prevent infinite loops
  const categories = useMemo(() => 
    searchParams.get('categories')?.split(',').filter(Boolean) || [], 
    [searchParams]
  )
  const sources = useMemo(() => 
    searchParams.get('sources')?.split(',').filter(Boolean) || [], 
    [searchParams]
  )
  const sort = searchParams.get('sort') || 'latest'
  const priceMin = searchParams.get('priceMin')
  const priceMax = searchParams.get('priceMax')
  const freeShipping = searchParams.get('freeShipping') === 'true'
  const discountOnly = searchParams.get('discountOnly') === 'true'
  const todayOnly = searchParams.get('todayOnly') === 'true'
  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    async function fetchHotDeals() {
      try {
        const deals = await db.hotdeals.findAll()
        setHotdeals(deals)
        
        // Calculate stats
        const activeDeals = deals.filter(d => d.status === 'active')
        const today = new Date().toDateString()
        
        setStats({
          active: activeDeals.length,
          freeShipping: deals.filter(d => d.shipping?.isFree).length,
          today: deals.filter(d => 
            new Date(d.crawledAt).toDateString() === today
          ).length,
          highDiscount: deals.filter(d => 
            d.discountRate && d.discountRate >= 50
          ).length
        })
      } catch (error) {
        console.error('Failed to fetch hotdeals:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHotDeals()
  }, [])

  useEffect(() => {
    let filtered = [...hotdeals]

    // Apply filters
    if (categories.length > 0) {
      filtered = filtered.filter(d => d.category && categories.includes(d.category))
    }
    if (sources.length > 0) {
      filtered = filtered.filter(d => d.source && sources.includes(d.source))
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
    if (discountOnly) {
      filtered = filtered.filter(d => d.discountRate && d.discountRate > 0)
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
        filtered.sort((a, b) => b.viewCount - a.viewCount)
        break
      case 'discount':
        filtered.sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0))
        break
      default: // 'latest'
        filtered.sort((a, b) => new Date(b.crawledAt).getTime() - new Date(a.crawledAt).getTime())
    }

    setFilteredDeals(filtered)
  }, [hotdeals, categories, sources, sort, priceMin, priceMax, freeShipping, discountOnly, todayOnly])

  // Pagination
  const itemsPerPage = 12
  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const paginatedDeals = filteredDeals.slice(startIndex, startIndex + itemsPerPage)

  const statsData = [
    {
      title: '활성 딜',
      value: stats.active,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '오늘 등록',
      value: stats.today,
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ]

  if (loading) {
    return <Loading />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">🔥 핫딜</h1>
        <p className="text-sm sm:text-base text-gray-600">
          실시간 한국 쇼핑 정보를 확인하세요
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-2xl mx-auto">
        {statsData.map((stat) => (
          <Card key={stat.title} className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-600">{stat.title}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 검색 */}
      <div className="mb-8">
        <SearchBar className="max-w-2xl mx-auto" />
      </div>

      {/* 필터와 핫딜 목록 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 필터 사이드바 */}
        <div className="lg:w-80">
          <HotDealFilters />
        </div>

        {/* 핫딜 목록 */}
        <div className="flex-1">
          {paginatedDeals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {paginatedDeals.map((deal) => (
              <HotDealCard key={deal.id} deal={deal} />
            ))}
          </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 sm:gap-2">
                {page > 1 && (
                  <a
                    href={`?page=${page - 1}${searchParams.toString().replace(/page=\d+&?/, '')}`}
                    className="px-3 sm:px-4 py-2 border rounded-md hover:bg-gray-50 text-sm sm:text-base"
                  >
                    이전
                  </a>
                )}
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                    if (pageNum > totalPages) return null
                    
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', pageNum.toString())
                    
                    return (
                      <a
                        key={pageNum}
                        href={`?${params.toString()}`}
                        className={`px-2.5 sm:px-3 py-2 rounded-md text-sm sm:text-base ${
                          pageNum === page
                            ? 'bg-blue-600 text-white'
                            : 'border hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </a>
                    )
                  })}
                </div>

                {page < totalPages && (
                  <a
                    href={`?page=${page + 1}${searchParams.toString().replace(/page=\d+&?/, '')}`}
                    className="px-3 sm:px-4 py-2 border rounded-md hover:bg-gray-50 text-sm sm:text-base"
                  >
                    다음
                  </a>
                )}
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
    </div>
  )
}