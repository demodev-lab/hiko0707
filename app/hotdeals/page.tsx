'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { db } from '@/lib/db/database-service'
import { SearchBar } from '@/components/features/search/search-bar'
import { AdvancedFilters } from '@/components/features/hotdeal/advanced-filters'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/error'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Package, Zap, Percent } from 'lucide-react'
import { HotDeal } from '@/types/hotdeal'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'

export default function HotDealsPage() {
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [hotdeals, setHotdeals] = useState<HotDeal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<HotDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    active: 0,
    freeShipping: 0,
    today: 0,
    highDiscount: 0
  })

  // Get filter params
  const category = searchParams.get('category')
  const source = searchParams.get('source')
  const sort = searchParams.get('sort') || 'latest'
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
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
    if (category) {
      filtered = filtered.filter(d => d.category === category)
    }
    if (source) {
      filtered = filtered.filter(d => d.source === source)
    }
    if (minPrice) {
      filtered = filtered.filter(d => d.price >= parseInt(minPrice))
    }
    if (maxPrice) {
      filtered = filtered.filter(d => d.price <= parseInt(maxPrice))
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
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
  }, [hotdeals, category, source, sort, minPrice, maxPrice])

  // Pagination
  const itemsPerPage = 12
  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const paginatedDeals = filteredDeals.slice(startIndex, startIndex + itemsPerPage)

  const statsData = [
    {
      title: t('hotdeals.activeDeals'),
      value: stats.active,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('hotdeals.freeShipping'),
      value: stats.freeShipping,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('hotdeals.todayRegistered') || t('hotdeals.activeDeals'),
      value: stats.today,
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: t('hotdeals.highDiscount'),
      value: stats.highDiscount,
      icon: Percent,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  if (loading) {
    return <Loading />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔥 {t('hotdeals.title')}</h1>
        <p className="text-gray-600">
          {t('hotdeals.subtitle')}
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsData.map((stat) => (
          <Card key={stat.title} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 검색 및 필터 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3">
          <SearchBar className="mb-4" />
        </div>
        <div className="lg:col-span-1 lg:row-span-2">
          <AdvancedFilters 
            searchParams={{
              category: category || undefined,
              sort: sort,
              minPrice: minPrice || undefined,
              maxPrice: maxPrice || undefined,
              source: source || undefined
            }}
          />
        </div>
      </div>

      {/* 핫딜 목록 */}
      {paginatedDeals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {paginatedDeals.map((deal) => (
              <HotDealCard key={deal.id} deal={deal} />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${category ? `&category=${category}` : ''}${source ? `&source=${source}` : ''}${sort ? `&sort=${sort}` : ''}`}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  {t('common.previous')}
                </a>
              )}
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                  if (pageNum > totalPages) return null
                  
                  return (
                    <a
                      key={pageNum}
                      href={`?page=${pageNum}${category ? `&category=${category}` : ''}${source ? `&source=${source}` : ''}${sort ? `&sort=${sort}` : ''}`}
                      className={`px-3 py-2 rounded-md ${
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
                  href={`?page=${page + 1}${category ? `&category=${category}` : ''}${source ? `&source=${source}` : ''}${sort ? `&sort=${sort}` : ''}`}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  {t('common.next')}
                </a>
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title={t('hotdeals.noDeals') || t('common.noResults')}
          message={t('hotdeals.noDealsMessage') || t('common.noResults')}
        />
      )}
    </div>
  )
}