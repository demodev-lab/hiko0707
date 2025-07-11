'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Package,
  Tag,
  DollarSign,
  Calendar,
  Store,
  SlidersHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/context'

interface FilterState {
  categories: string[]
  priceMin: string
  priceMax: string
  sources: string[]
  sortBy: string
  freeShipping: boolean
  discountOnly: boolean
  todayOnly: boolean
}

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

const SOURCES = [
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

interface HotDealFiltersProps {
  onFilterChange?: (filters: FilterState) => void
  showMobileToggle?: boolean
}

export function HotDealFilters({ onFilterChange, showMobileToggle = true }: HotDealFiltersProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    source: false,
    options: false
  })

  // Initialize filter state from URL params
  const [filters, setFilters] = useState<FilterState>({
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    sources: searchParams.get('sources')?.split(',').filter(Boolean) || [],
    sortBy: searchParams.get('sort') || 'latest',
    freeShipping: searchParams.get('freeShipping') === 'true',
    discountOnly: searchParams.get('discountOnly') === 'true',
    todayOnly: searchParams.get('todayOnly') === 'true'
  })

  const activeFilterCount = 
    filters.categories.length + 
    filters.sources.length +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    (filters.freeShipping ? 1 : 0) +
    (filters.discountOnly ? 1 : 0) +
    (filters.todayOnly ? 1 : 0)

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters }
      
      // Update URL params
      const params = new URLSearchParams()
      
      if (updatedFilters.categories.length > 0) {
        params.set('categories', updatedFilters.categories.join(','))
      }
      if (updatedFilters.priceMin) {
        params.set('priceMin', updatedFilters.priceMin)
      }
      if (updatedFilters.priceMax) {
        params.set('priceMax', updatedFilters.priceMax)
      }
      if (updatedFilters.sources.length > 0) {
        params.set('sources', updatedFilters.sources.join(','))
      }
      if (updatedFilters.sortBy !== 'latest') {
        params.set('sort', updatedFilters.sortBy)
      }
      if (updatedFilters.freeShipping) {
        params.set('freeShipping', 'true')
      }
      if (updatedFilters.discountOnly) {
        params.set('discountOnly', 'true')
      }
      if (updatedFilters.todayOnly) {
        params.set('todayOnly', 'true')
      }

      router.push(`${pathname}?${params.toString()}`)
      onFilterChange?.(updatedFilters)
      
      return updatedFilters
    })
  }, [pathname, router, onFilterChange])

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(c => c !== categoryId)
      : [...filters.categories, categoryId]
    updateFilters({ categories: newCategories })
  }

  const handleSourceToggle = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source]
    updateFilters({ sources: newSources })
  }

  const clearAllFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      categories: [],
      priceMin: '',
      priceMax: '',
      sources: [],
      sortBy: 'latest',
      freeShipping: false,
      discountOnly: false,
      todayOnly: false
    }
    setFilters(clearedFilters)
    router.push(pathname)
    onFilterChange?.(clearedFilters)
  }, [pathname, router, onFilterChange])

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
                id={option.value}
                name="sortBy"
                value={option.value}
                checked={filters.sortBy === option.value}
                onChange={(e) => updateFilters({ sortBy: e.target.value })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <Label htmlFor={option.value} className="text-sm cursor-pointer">
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
            {filters.categories.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.categories.length}
              </Badge>
            )}
          </Label>
          {expandedSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.category && (
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={category.id}
                  checked={filters.categories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <Label
                  htmlFor={category.id}
                  className="text-sm cursor-pointer flex items-center gap-1"
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Label>
              </div>
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
                value={filters.priceMin}
                onChange={(e) => updateFilters({ priceMin: e.target.value })}
                className="w-full"
              />
              <span className="text-gray-500">~</span>
              <Input
                type="number"
                placeholder="최대"
                value={filters.priceMax}
                onChange={(e) => updateFilters({ priceMax: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ priceMin: '', priceMax: '10000' })}
              >
                ~1만원
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ priceMin: '10000', priceMax: '50000' })}
              >
                1~5만원
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ priceMin: '50000', priceMax: '100000' })}
              >
                5~10만원
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ priceMin: '100000', priceMax: '' })}
              >
                10만원~
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Sources */}
      <div>
        <button
          onClick={() => toggleSection('source')}
          className="w-full flex items-center justify-between mb-3"
        >
          <Label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
            <Store className="w-4 h-4" />
            쇼핑몰
            {filters.sources.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.sources.length}
              </Badge>
            )}
          </Label>
          {expandedSections.source ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.source && (
          <div className="space-y-2">
            {SOURCES.map((source) => (
              <div key={source} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={source}
                  checked={filters.sources.includes(source)}
                  onChange={() => handleSourceToggle(source)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <Label htmlFor={source} className="text-sm cursor-pointer">
                  {source}
                </Label>
              </div>
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
                checked={filters.freeShipping}
                onChange={(e) => updateFilters({ freeShipping: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <Label htmlFor="freeShipping" className="text-sm cursor-pointer">
                무료배송
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="discountOnly"
                checked={filters.discountOnly}
                onChange={(e) => updateFilters({ discountOnly: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <Label htmlFor="discountOnly" className="text-sm cursor-pointer">
                할인 상품만
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="todayOnly"
                checked={filters.todayOnly}
                onChange={(e) => updateFilters({ todayOnly: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <Label htmlFor="todayOnly" className="text-sm cursor-pointer">
                오늘 등록된 상품
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={clearAllFilters}
          >
            <X className="w-4 h-4 mr-2" />
            필터 초기화 ({activeFilterCount})
          </Button>
        </>
      )}
    </div>
  )

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const modal = document.getElementById('filter-modal')
      if (modal && !modal.contains(event.target as Node) && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  // Mobile view with native modal
  if (showMobileToggle) {
    return (
      <>
        {/* Mobile Filter Button */}
        <div className="lg:hidden">
          <Button 
            variant="outline" 
            className="w-full mb-4"
            onClick={() => setIsOpen(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            필터
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Mobile Modal */}
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex">
            <div 
              id="filter-modal"
              className="bg-white dark:bg-gray-900 w-[300px] sm:w-[400px] h-full overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">필터</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4">
                <FilterContent />
              </div>
            </div>
          </div>
        )}

        {/* Desktop Filter Sidebar */}
        <Card className="hidden lg:block">
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

  // Desktop only view
  return (
    <Card>
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
  )
}