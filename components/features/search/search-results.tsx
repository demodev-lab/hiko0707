'use client'

import { useEffect, useState } from 'react'
import { HotDeal } from '@/types/hotdeal'
import { db } from '@/lib/db/database-service'
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
  const [results, setResults] = useState<HotDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    async function searchHotdeals() {
      setLoading(true)
      try {
        let deals: HotDeal[] = []
        
        if (query) {
          // Search by keyword
          deals = await db.hotdeals.searchByKeyword(query)
        } else {
          // Get all active deals
          deals = await db.hotdeals.findActive()
        }

        // Apply filters
        if (filters.category && filters.category !== 'all') {
          deals = deals.filter(d => d.category === filters.category)
        }
        
        if (filters.source && filters.source !== 'all') {
          deals = deals.filter(d => d.source === filters.source)
        }
        
        if (filters.minPrice !== undefined) {
          deals = deals.filter(d => d.price >= filters.minPrice!)
        }
        
        if (filters.maxPrice !== undefined) {
          deals = deals.filter(d => d.price <= filters.maxPrice!)
        }

        // Apply sorting
        switch (filters.sortBy) {
          case 'price_low':
            deals.sort((a, b) => a.price - b.price)
            break
          case 'price_high':
            deals.sort((a, b) => b.price - a.price)
            break
          case 'popular':
            deals.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            break
          case 'discount':
            // Sort by price as discount rate is not available
            deals.sort((a, b) => a.price - b.price)
            break
          default: // 'latest'
            deals.sort((a, b) => new Date(b.crawledAt).getTime() - new Date(a.crawledAt).getTime())
        }

        setResults(deals)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    searchHotdeals()
  }, [query, filters])

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