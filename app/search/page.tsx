'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, X, TrendingUp, Clock, Percent } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useHotDeals } from '@/hooks/use-hotdeals'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'
import { HotDeal } from '@/types/hotdeal'
import { useLanguage } from '@/lib/i18n/context'
import { Separator } from '@/components/ui/separator'
import debounce from 'lodash/debounce'

type SortOption = 'latest' | 'discount' | 'price_low' | 'price_high' | 'popular'

const CATEGORIES = [
  '전체',
  '패션/의류',
  '전자제품',
  '식품',
  '화장품/뷰티',
  '생활용품',
  '스포츠/레저',
  '도서/문구',
  '가구/인테리어',
  '유아/키즈',
  '기타'
]

export default function SearchPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hotdeals } = useHotDeals()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [sortOption, setSortOption] = useState<SortOption>('latest')
  const [filteredDeals, setFilteredDeals] = useState<HotDeal[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Popular search keywords
  const popularKeywords = [
    '아이폰', '갤럭시', '에어팟', '노트북', '아이패드',
    '운동화', '화장품', '커피', '라면', '과자'
  ]

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      performSearch(query)
    }, 300),
    [hotdeals, selectedCategory, sortOption]
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
        deal.source?.toLowerCase().includes(lowerQuery)
      )
    }

    // Filter by category
    if (selectedCategory !== '전체') {
      results = results.filter(deal => deal.category === selectedCategory)
    }

    // Sort results
    switch (sortOption) {
      case 'latest':
        results.sort((a, b) => new Date(b.crawledAt).getTime() - new Date(a.crawledAt).getTime())
        break
      case 'discount':
        results.sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0))
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
  }, [searchQuery, selectedCategory, sortOption])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory !== '전체') params.set('category', selectedCategory)
    if (sortOption !== 'latest') params.set('sort', sortOption)
    
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search'
    router.replace(newUrl, { scroll: false })
  }, [searchQuery, selectedCategory, sortOption])

  const handleKeywordClick = (keyword: string) => {
    setSearchQuery(keyword)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedCategory('전체')
    setSortOption('latest')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center">{t('search.title')}</h1>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="pl-10 pr-10 h-12 text-lg"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Popular Keywords */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">{t('search.popularKeywords')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularKeywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200"
                onClick={() => handleKeywordClick(keyword)}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    최신순
                  </div>
                </SelectItem>
                <SelectItem value="discount">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    할인율순
                  </div>
                </SelectItem>
                <SelectItem value="price_low">낮은 가격순</SelectItem>
                <SelectItem value="price_high">높은 가격순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
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
        </div>
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDeals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <Button variant="outline" onClick={clearSearch}>
              검색 초기화
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}