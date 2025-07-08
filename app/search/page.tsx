'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchResults } from '@/components/features/search/search-results'
import { SearchFilters } from '@/components/features/search/search-filters'
import { AdvancedFilters } from '@/components/features/hotdeal/advanced-filters'
import { SearchBar } from '@/components/features/search/search-bar'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || 'all'
  const source = searchParams.get('source') || 'all'
  const sortBy = searchParams.get('sort') || 'latest'
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined

  useEffect(() => {
    // Simulate loading for better UX
    setLoading(false)
  }, [query])

  // Popular search keywords
  const popularKeywords = [
    '노트북', '갤럭시', '아이폰', '에어팟', 
    '청소기', '공기청정기', '게이밍', '모니터'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">
              {query ? `"${query}" 검색 결과` : '핫딜 검색'}
            </h1>
          </div>
          
          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar defaultValue={query} className="max-w-2xl" />
          </div>
          
          {/* Popular Keywords */}
          {!query && (
            <div>
              <p className="text-sm text-gray-600 mb-3">인기 검색어</p>
              <div className="flex flex-wrap gap-2">
                {popularKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      window.location.href = `/search?q=${encodeURIComponent(keyword)}`
                    }}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 필터 사이드바 */}
          <div className="lg:col-span-1">
            <AdvancedFilters
              searchParams={{
                category,
                source,
                sort: sortBy,
                minPrice: minPrice?.toString(),
                maxPrice: maxPrice?.toString()
              }}
            />
          </div>

          {/* 검색 결과 */}
          <div className="lg:col-span-3">
            {loading ? (
              <Loading message="검색 중..." />
            ) : (
              <SearchResults
                query={query}
                filters={{
                  category,
                  source,
                  sortBy,
                  minPrice,
                  maxPrice
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}