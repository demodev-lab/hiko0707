'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Filter, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

interface SearchFiltersProps {
  initialFilters?: {
    category?: string
    source?: string
    sortBy?: string
    minPrice?: number
    maxPrice?: number
  }
}

const CATEGORIES = [
  { value: 'all', label: '전체 카테고리' },
  { value: 'electronics', label: '전자/IT' },
  { value: 'food', label: '식품/음료' },
  { value: 'beauty', label: '뷰티/패션' },
  { value: 'life', label: '생활용품' },
  { value: 'sports', label: '스포츠/레저' },
  { value: 'books', label: '도서/문구' },
  { value: 'etc', label: '기타' },
]

const SOURCES = [
  { value: 'all', label: '전체 사이트' },
  { value: 'ppomppu', label: '뽐뿌' },
  { value: 'ruliweb', label: '루리웹' },
  { value: 'clien', label: '클리앙' },
  { value: 'quasarzone', label: '퀘이사존' },
  { value: 'coolenjoy', label: '쿨엔조이' },
  { value: 'eomisae', label: '어미새' },
]

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price_low', label: '가격 낮은순' },
  { value: 'price_high', label: '가격 높은순' },
  { value: 'discount', label: '할인율순' },
]

export function SearchFilters({ initialFilters = {} }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  
  const [category, setCategory] = useState(initialFilters.category || 'all')
  const [source, setSource] = useState(initialFilters.source || 'all')
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'latest')
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice?.toString() || '')

  const updateFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (category !== 'all') params.set('category', category)
    else params.delete('category')
    
    if (source !== 'all') params.set('source', source)
    else params.delete('source')
    
    if (sortBy !== 'latest') params.set('sort', sortBy)
    else params.delete('sort')
    
    if (minPrice) params.set('minPrice', minPrice)
    else params.delete('minPrice')
    
    if (maxPrice) params.set('maxPrice', maxPrice)
    else params.delete('maxPrice')

    router.push(`/search?${params.toString()}`)
  }

  const resetFilters = () => {
    setCategory('all')
    setSource('all')
    setSortBy('latest')
    setMinPrice('')
    setMaxPrice('')
    
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('source')
    params.delete('sort')
    params.delete('minPrice')
    params.delete('maxPrice')
    
    router.push(`/search?${params.toString()}`)
  }

  const hasActiveFilters = category !== 'all' || source !== 'all' || sortBy !== 'latest' || minPrice || maxPrice

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            필터
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 정렬 */}
        <div className="space-y-2">
          <Label htmlFor="sort">정렬</Label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Separator />

        {/* 카테고리 */}
        <div className="space-y-2">
          <Label htmlFor="category">카테고리</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* 출처 사이트 */}
        <div className="space-y-2">
          <Label htmlFor="source">출처 사이트</Label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SOURCES.map((src) => (
              <option key={src.value} value={src.value}>
                {src.label}
              </option>
            ))}
          </select>
        </div>

        <Separator />

        {/* 가격 범위 */}
        <div className="space-y-2">
          <Label>가격 범위</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="최소"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full"
            />
            <span className="text-gray-500">~</span>
            <Input
              type="number"
              placeholder="최대"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <Button onClick={updateFilters} className="w-full">
          필터 적용
        </Button>

        {/* 활성 필터 표시 */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">활성 필터:</p>
            <div className="flex flex-wrap gap-2">
              {category !== 'all' && (
                <Badge variant="secondary">
                  {CATEGORIES.find(c => c.value === category)?.label}
                </Badge>
              )}
              {source !== 'all' && (
                <Badge variant="secondary">
                  {SOURCES.find(s => s.value === source)?.label}
                </Badge>
              )}
              {sortBy !== 'latest' && (
                <Badge variant="secondary">
                  {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                </Badge>
              )}
              {minPrice && (
                <Badge variant="secondary">
                  최소: ₩{parseInt(minPrice).toLocaleString()}
                </Badge>
              )}
              {maxPrice && (
                <Badge variant="secondary">
                  최대: ₩{parseInt(maxPrice).toLocaleString()}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}