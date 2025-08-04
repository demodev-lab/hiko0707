'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, X, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useSearchHotDeals } from '@/hooks/use-supabase-hotdeals'
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
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  
  const pageSize = 20

  // Get filter params from URL
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
  const priceMin = searchParams.get('priceMin') || ''
  const priceMax = searchParams.get('priceMax') || ''
  const communitySources = searchParams.get('communitySources')?.split(',').filter(Boolean) || []
  const shoppingSources = searchParams.get('shoppingSources')?.split(',').filter(Boolean) || []
  const sortBy = (searchParams.get('sort') || 'latest') as SortOption
  const freeShipping = searchParams.get('freeShipping') === 'true'
  const todayOnly = searchParams.get('todayOnly') === 'true'
  
  // Map sort options to Supabase format
  const getSupabaseSortBy = (sort: SortOption) => {
    switch (sort) {
      case 'latest': return 'created_at'
      case 'price_low': return 'price'
      case 'price_high': return 'price'
      case 'popular': return 'view_count'
      default: return 'created_at'
    }
  }
  
  const getSortOrder = (sort: SortOption) => {
    switch (sort) {
      case 'price_low': return 'asc'
      case 'latest': return 'desc'
      case 'price_high': return 'desc'
      case 'popular': return 'desc'
      default: return 'desc'
    }
  }
  
  // Use server-side search with pagination
  const { data: searchResults, isLoading } = useSearchHotDeals(
    searchQuery,
    {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      sortBy: getSupabaseSortBy(sortBy),
      sortOrder: getSortOrder(sortBy),
      status: 'active'
    }
  )
  
  const hotdeals = searchResults?.data || []
  const totalCount = searchResults?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // Update page when search parameters change
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when search changes
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
            {isLoading ? (
              <span>검색 중...</span>
            ) : (
              <span>
                {searchQuery && `"${searchQuery}"에 대한 `}
                검색 결과 {totalCount.toLocaleString()}개 (페이지 {currentPage}/{totalPages})
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
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : hotdeals.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {hotdeals.map((deal) => (
                  <HotDealCard key={deal.id} deal={deal as any} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    이전
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1
                      const shouldShow = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      
                      if (!shouldShow) return null
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
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