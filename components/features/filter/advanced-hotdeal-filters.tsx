'use client'

import { useState, useEffect } from 'react'
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Package,
  Tag,
  DollarSign,
  Store,
  SlidersHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useLanguage } from '@/lib/i18n/context'
import { useHotDealFilters } from '@/hooks/use-url-sync'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'fashion', name: '패션/의류', icon: '👕' },
  { id: 'electronics', name: '전자제품', icon: '📱' },
  { id: 'food', name: '식품', icon: '🍕' },
  { id: 'beauty', name: '화장품/뷰티', icon: '💄' },
  { id: 'home', name: '생활용품', icon: '🏠' },
  { id: 'sports', name: '스포츠/레저', icon: '⚽' },
  { id: 'books', name: '도서/문구', icon: '📚' },
  { id: 'furniture', name: '가구/인테리어', icon: '🛋️' },
  { id: 'kids', name: '유아/키즈', icon: '👶' },
  { id: 'other', name: '기타', icon: '📦' }
]

const STORES = [
  '쿠팡',
  'G마켓',
  '11번가',
  '네이버쇼핑',
  '옥션',
  'SSG',
  '위메프',
  '티몬'
]

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'price_low', label: '낮은 가격순' },
  { value: 'price_high', label: '높은 가격순' },
  { value: 'discount', label: '할인율순' },
  { value: 'popular', label: '인기순' }
]

interface AdvancedHotDealFiltersProps {
  className?: string
}

export function AdvancedHotDealFilters({ className }: AdvancedHotDealFiltersProps) {
  const { t } = useLanguage()
  const { filters, setters, clearFilters, hasActiveFilters } = useHotDealFilters()
  
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    store: false,
    options: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const activeFilterCount = [
    filters.category !== 'all' ? 1 : 0,
    filters.store !== 'all' ? 1 : 0,
    filters.minPrice ? 1 : 0,
    filters.maxPrice ? 1 : 0,
    filters.freeShipping ? 1 : 0,
    filters.status !== 'all' ? 1 : 0,
    filters.sort !== 'latest' ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort Options */}
      <div>
        <Label className="text-sm font-medium mb-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          정렬
        </Label>
        <div className="space-y-2">
          {SORT_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`sort-${option.value}`}
                name="sortBy"
                value={option.value}
                checked={filters.sort === option.value}
                onChange={(e) => setters.setSort(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <Label htmlFor={`sort-${option.value}`} className="text-sm cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between mb-3"
        >
          <Label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
            <Tag className="w-4 h-4" />
            카테고리
            {filters.category !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {CATEGORIES.find(c => c.id === filters.category)?.name}
              </Badge>
            )}
          </Label>
          {expandedSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.category && (
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Button
                variant={filters.category === 'all' ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setters.setCategory('all')}
              >
                전체
              </Button>
            </div>
            {CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={filters.category === category.id ? 'default' : 'outline'}
                size="sm"
                className="justify-start"
                onClick={() => setters.setCategory(category.id)}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between mb-3"
        >
          <Label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
            <DollarSign className="w-4 h-4" />
            가격대
          </Label>
          {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.price && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="최소"
                value={filters.minPrice || ''}
                onChange={(e) => setters.setMinPrice(e.target.value)}
                className="w-full"
              />
              <span className="text-gray-500">~</span>
              <Input
                type="number"
                placeholder="최대"
                value={filters.maxPrice || ''}
                onChange={(e) => setters.setMaxPrice(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setters.setMinPrice('')
                  setters.setMaxPrice('10000')
                }}
              >
                ~1만원
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setters.setMinPrice('10000')
                  setters.setMaxPrice('50000')
                }}
              >
                1~5만원
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setters.setMinPrice('50000')
                  setters.setMaxPrice('100000')
                }}
              >
                5~10만원
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setters.setMinPrice('100000')
                  setters.setMaxPrice('')
                }}
              >
                10만원~
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Stores */}
      <div>
        <button
          onClick={() => toggleSection('store')}
          className="w-full flex items-center justify-between mb-3"
        >
          <Label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
            <Store className="w-4 h-4" />
            쇼핑몰
            {filters.store !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {filters.store}
              </Badge>
            )}
          </Label>
          {expandedSections.store ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.store && (
          <div className="space-y-2">
            <Button
              variant={filters.store === 'all' ? 'default' : 'outline'}
              size="sm"
              className="w-full justify-start"
              onClick={() => setters.setStore('all')}
            >
              전체
            </Button>
            {STORES.map((store) => (
              <Button
                key={store}
                variant={filters.store === store ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setters.setStore(store)}
              >
                {store}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Additional Options */}
      <div>
        <button
          onClick={() => toggleSection('options')}
          className="w-full flex items-center justify-between mb-3"
        >
          <Label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
            <Package className="w-4 h-4" />
            추가 옵션
          </Label>
          {expandedSections.options ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.options && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="freeShipping"
                checked={filters.freeShipping === true}
                onChange={(e) => setters.setFreeShipping(e.target.checked ? 'true' : '')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <Label htmlFor="freeShipping" className="text-sm cursor-pointer">
                무료배송
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active-only"
                checked={filters.status === 'active'}
                onChange={(e) => setters.setStatus(e.target.checked ? 'active' : 'all')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <Label htmlFor="active-only" className="text-sm cursor-pointer">
                진행중인 딜만
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={clearFilters}
          >
            <X className="w-4 h-4 mr-2" />
            필터 초기화 ({activeFilterCount})
          </Button>
        </>
      )}
    </div>
  )

  // Mobile view with Sheet
  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              고급 필터
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>필터</SheetTitle>
            </SheetHeader>
            <div className="mt-6 h-full overflow-y-auto pb-20">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filter Sidebar */}
      <Card className={cn("hidden lg:block", className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FilterContent />
        </CardContent>
      </Card>
    </>
  )
}