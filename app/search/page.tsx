'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, X, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useHotDeals } from '@/hooks/use-hotdeals'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'
import { HotDeal } from '@/types/hotdeal'
import { useLanguage } from '@/lib/i18n/context'
import { Separator } from '@/components/ui/separator'
import { SearchBar } from '@/components/features/search/search-bar'
import { HotDealFilters } from '@/components/features/filter/hotdeal-filters'
import debounce from 'lodash/debounce'

type SortOption = 'latest' | 'price_low' | 'price_high' | 'popular'

export default function SearchPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hotdeals } = useHotDeals()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [filteredDeals, setFilteredDeals] = useState<HotDeal[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Get filter params from URL
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
  const priceMin = searchParams.get('priceMin') || ''
  const priceMax = searchParams.get('priceMax') || ''
  const communitySources = searchParams.get('communitySources')?.split(',').filter(Boolean) || []
  const shoppingSources = searchParams.get('shoppingSources')?.split(',').filter(Boolean) || []
  const sortBy = (searchParams.get('sort') || 'latest') as SortOption
  const freeShipping = searchParams.get('freeShipping') === 'true'
  const todayOnly = searchParams.get('todayOnly') === 'true'

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      performSearch(query)
    }, 300),
    [hotdeals, categories, sortBy, priceMin, priceMax, communitySources, shoppingSources, freeShipping, todayOnly]
  )

  // Perform search and filtering
  const performSearch = (query: string) => {
    setIsSearching(true)
    
    let results = [...hotdeals]

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(deal => 
        deal.title.toLowerCase().includes(lowerQuery) ||
        deal.description?.toLowerCase().includes(lowerQuery) ||
        deal.category?.toLowerCase().includes(lowerQuery) ||
        deal.source?.toLowerCase().includes(lowerQuery) ||
        deal.seller?.toLowerCase().includes(lowerQuery) ||
        deal.productComment?.toLowerCase().includes(lowerQuery)
      )
    }

    // Apply filters
    if (categories.length > 0) {
      results = results.filter(deal => {
        // Map deal categories to filter categories
        const dealCategory = deal.category?.toLowerCase() || ''
        return categories.some(cat => {
          switch(cat) {
            case 'electronics': return dealCategory.includes('전자') || dealCategory.includes('it')
            case 'food': return dealCategory.includes('식품') || dealCategory.includes('음식')
            case 'beauty': return dealCategory.includes('뷰티') || dealCategory.includes('화장') || dealCategory.includes('패션')
            case 'home': return dealCategory.includes('생활') || dealCategory.includes('가전')
            case 'event': return dealCategory.includes('이벤트') || dealCategory.includes('상품권')
            case 'game': return dealCategory.includes('게임') || dealCategory.includes('앱')
            default: return dealCategory.includes('기타')
          }
        })
      })
    }

    // Filter by price range
    if (priceMin) {
      const min = parseInt(priceMin)
      results = results.filter(deal => deal.price >= min)
    }
    if (priceMax) {
      const max = parseInt(priceMax)
      results = results.filter(deal => deal.price <= max)
    }

    // Filter by community sources
    if (communitySources.length > 0) {
      results = results.filter(deal => 
        communitySources.some(source => deal.source?.toLowerCase().includes(source.toLowerCase()))
      )
    }

    // Filter by shopping sources
    if (shoppingSources.length > 0) {
      results = results.filter(deal => 
        shoppingSources.some(source => deal.seller?.toLowerCase().includes(source.toLowerCase()))
      )
    }

    // Filter by free shipping
    if (freeShipping) {
      results = results.filter(deal => deal.isFreeShipping)
    }

    // Filter by today only
    if (todayOnly) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      results = results.filter(deal => {
        const dealDate = new Date(deal.crawledAt)
        dealDate.setHours(0, 0, 0, 0)
        return dealDate.getTime() === today.getTime()
      })
    }

    // Sort results
    switch (sortBy) {
      case 'latest':
        results.sort((a, b) => new Date(b.crawledAt).getTime() - new Date(a.crawledAt).getTime())
        break
      case 'price_low':
        results.sort((a, b) => a.price - b.price)
        break
      case 'price_high':
        results.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        results.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        break
    }

    setFilteredDeals(results)
    setIsSearching(false)
  }

  // Update search when query or filters change
  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, categories, sortBy, priceMin, priceMax, communitySources, shoppingSources, freeShipping, todayOnly])

  // Handle search query change from URL
  useEffect(() => {
    const query = searchParams.get('q') || ''
    if (query !== searchQuery) {
      setSearchQuery(query)
    }
  }, [searchParams])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center">🔍 검색</h1>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <SearchBar 
            defaultValue={searchQuery}
            placeholder="핫딜을 검색해보세요"
            showSuggestions={true}
          />
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Results Count and Filter Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {isSearching ? (
              <span>검색 중...</span>
            ) : (
              <span>
                {searchQuery && `"${searchQuery}"에 대한 `}
                검색 결과 {filteredDeals.length}개
              </span>
            )}
          </div>
          
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            필터
            {(categories.length + communitySources.length + shoppingSources.length + 
              (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + 
              (freeShipping ? 1 : 0) + (todayOnly ? 1 : 0)) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {categories.length + communitySources.length + shoppingSources.length + 
                 (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + 
                 (freeShipping ? 1 : 0) + (todayOnly ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden md:block w-64 shrink-0">
          <HotDealFilters showMobileToggle={false} />
        </div>

        {/* Search Results */}
        <div className="flex-1">
          {isSearching ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeals.map((deal) => (
                <HotDealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
        <Card className="max-w-md mx-auto">
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              다른 검색어를 시도하거나 필터를 조정해보세요
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                router.push('/search')
                window.location.reload()
              }}
            >
              검색 초기화
            </Button>
          </CardContent>
        </Card>
          )}
        </div>
      </div>
      
      {/* Mobile Filters */}
      {showFilters && (
        <div className="md:hidden">
          <HotDealFilters />
        </div>
      )}
    </div>
  )
}