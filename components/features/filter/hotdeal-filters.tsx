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
import { useViewport } from '@/hooks/use-viewport'

interface FilterState {
  categories: string[]
  priceMin: string
  priceMax: string
  communitySources: string[]
  shoppingSources: string[]
  sortBy: string
  freeShipping: boolean
  todayOnly: boolean
}

const CATEGORIES = [
  { id: 'electronics', name: '전자/IT', icon: '📱' },
  { id: 'food', name: '식품/영양', icon: '🍕' },
  { id: 'beauty', name: '뷰티/패션', icon: '💄' },
  { id: 'home', name: '생활/가전', icon: '🏠' },
  { id: 'event', name: '이벤트/상품권', icon: '🎁' },
  { id: 'game', name: '게임/앱', icon: '🎮' },
  { id: 'other', name: '기타', icon: '📦' }
]

const COMMUNITY_SOURCES = [
  { id: 'ppomppu', name: '뽐뿌' },
  { id: 'ruliweb', name: '루리웹' },
  { id: 'clien', name: '클리앙' },
  { id: 'quasarzone', name: '퀘이사존' },
  { id: 'coolenjoy', name: '쿨앤조이' },
  { id: 'algumon', name: '알구몬' }
]

const SHOPPING_SOURCES = [
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
  { value: 'popular', label: '인기순' },
  { value: 'price_low', label: '낮은 가격순' },
  { value: 'price_high', label: '높은 가격순' }
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
  const { isMobile } = useViewport()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    communitySource: false,
    shoppingSource: false,
    options: false
  })
  
  // 스와이프 기능을 위한 상태
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  
  // 스와이프 감지 함수들
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isDownSwipe = distance < -50 // 아래로 50px 이상 스와이프
    
    if (isDownSwipe) {
      closeModal()
    }
  }

  // 애니메이션과 함께 모달 닫기
  const closeModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 300) // 애니메이션 시간과 맞춤
  }

  // Initialize filter state from URL params
  const [filters, setFilters] = useState<FilterState>({
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    communitySources: searchParams.get('communitySources')?.split(',').filter(Boolean) || [],
    shoppingSources: searchParams.get('shoppingSources')?.split(',').filter(Boolean) || [],
    sortBy: searchParams.get('sort') || 'latest',
    freeShipping: searchParams.get('freeShipping') === 'true',
    todayOnly: searchParams.get('todayOnly') === 'true'
  })

  const activeFilterCount = 
    filters.categories.length + 
    filters.communitySources.length +
    filters.shoppingSources.length +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    (filters.freeShipping ? 1 : 0) +
    (filters.todayOnly ? 1 : 0)

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters }
      
      // URL 업데이트를 다음 틱으로 연기
      setTimeout(() => {
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
        if (updatedFilters.communitySources.length > 0) {
          params.set('communitySources', updatedFilters.communitySources.join(','))
        }
        if (updatedFilters.shoppingSources.length > 0) {
          params.set('shoppingSources', updatedFilters.shoppingSources.join(','))
        }
        if (updatedFilters.sortBy !== 'latest') {
          params.set('sort', updatedFilters.sortBy)
        }
        if (updatedFilters.freeShipping) {
          params.set('freeShipping', 'true')
        }
        if (updatedFilters.todayOnly) {
          params.set('todayOnly', 'true')
        }

        router.push(`${pathname}?${params.toString()}`)
      }, 0)
      
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

  const handleCommunitySourceToggle = (source: string) => {
    const newSources = filters.communitySources.includes(source)
      ? filters.communitySources.filter(s => s !== source)
      : [...filters.communitySources, source]
    updateFilters({ communitySources: newSources })
  }

  const handleShoppingSourceToggle = (source: string) => {
    const newSources = filters.shoppingSources.includes(source)
      ? filters.shoppingSources.filter(s => s !== source)
      : [...filters.shoppingSources, source]
    updateFilters({ shoppingSources: newSources })
  }

  const clearAllFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      categories: [],
      priceMin: '',
      priceMax: '',
      communitySources: [],
      shoppingSources: [],
      sortBy: 'latest',
      freeShipping: false,
      todayOnly: false
    }
    setFilters(clearedFilters)
    
    // URL 업데이트를 다음 틱으로 연기
    setTimeout(() => {
      router.push(pathname)
    }, 0)
    
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
              <Label htmlFor={option.value} className="text-sm cursor-pointer flex-1 py-1">
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

      {/* Community Sources */}
      <div>
        <button
          onClick={() => toggleSection('communitySource')}
          className="w-full flex items-center justify-between mb-3"
        >
          <Label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
            <Store className="w-4 h-4" />
            커뮤니티
            {filters.communitySources.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.communitySources.length}
              </Badge>
            )}
          </Label>
          {expandedSections.communitySource ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.communitySource && (
          <div className="space-y-2">
            {COMMUNITY_SOURCES.map((source) => (
              <div key={source.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={source.id}
                  checked={filters.communitySources.includes(source.id)}
                  onChange={() => handleCommunitySourceToggle(source.id)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <Label htmlFor={source.id} className="text-sm cursor-pointer">
                  {source.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Shopping Sources */}
      <div>
        <button
          onClick={() => toggleSection('shoppingSource')}
          className="w-full flex items-center justify-between mb-3"
        >
          <Label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
            <Package className="w-4 h-4" />
            쇼핑몰
            {filters.shoppingSources.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.shoppingSources.length}
              </Badge>
            )}
          </Label>
          {expandedSections.shoppingSource ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.shoppingSource && (
          <div className="space-y-2">
            {SHOPPING_SOURCES.map((source) => (
              <div key={source} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={source}
                  checked={filters.shoppingSources.includes(source)}
                  onChange={() => handleShoppingSourceToggle(source)}
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

  // 헤더 필터 버튼에서 닫기 이벤트 수신
  useEffect(() => {
    const handleCloseEvent = () => {
      if (isOpen) {
        closeModal()
      }
    }

    window.addEventListener('closeFilterModal', handleCloseEvent)
    return () => window.removeEventListener('closeFilterModal', handleCloseEvent)
  }, [isOpen])

  // Close modal when clicking outside and handle header fade effect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const modal = document.getElementById('filter-modal')
      if (modal && !modal.contains(event.target as Node) && isOpen) {
        closeModal()
      }
    }

    const header = document.getElementById('navigation')
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
      
      // 헤더 페이드아웃 효과
      if (header) {
        header.style.transition = 'opacity 0.3s ease-out'
        header.style.opacity = '0'
        header.style.pointerEvents = 'none'
      }
    } else {
      document.body.style.overflow = 'auto'
      
      // 헤더 페이드인 효과
      if (header) {
        header.style.transition = 'opacity 0.3s ease-in'
        header.style.opacity = '1'
        header.style.pointerEvents = 'auto'
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'auto'
      
      // 컴포넌트 언마운트 시 헤더 복원
      if (header) {
        header.style.opacity = '1'
        header.style.pointerEvents = 'auto'
      }
    }
  }, [isOpen])

  // Mobile view with native modal
  if (showMobileToggle) {
    return (
      <>
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-6">
          <Button 
            variant="outline" 
            className="mobile-filter-button w-full py-3 border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30"
            onClick={() => setIsOpen(true)}
          >
            <Filter className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-700 dark:text-blue-300">필터 옵션</span>
            {activeFilterCount > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Mobile Bottom Sheet */}
        {isOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/50 flex items-end filter-modal-backdrop"
            onClick={(e) => {
              // 백드롭 클릭 시 모달 닫기
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            <div 
              id="filter-modal"
              className={`bg-white dark:bg-gray-900 w-full rounded-t-2xl shadow-xl flex flex-col filter-modal-content mobile-bottom-sheet transition-transform duration-300 ${
                isClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'
              }`}
              style={{
                maxHeight: isMobile ? 'calc(100dvh - 56px - env(safe-area-inset-bottom))' : 'calc(85vh)',
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* 헤더 */}
              <div 
                className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 rounded-t-2xl"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-3 cursor-pointer"
                  onClick={() => closeModal()}
                />
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">필터</h2>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="filter-modal-close-button"
                    onClick={() => closeModal()}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              {/* 필터 컨텐츠 - 스크롤 영역 개선 */}
              <div 
                className="flex-1 overflow-y-auto px-4 py-4 min-h-0 overscroll-contain"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  maxHeight: isMobile ? 'calc(100vh - 200px - env(safe-area-inset-bottom))' : 'auto'
                }}
              >
                <FilterContent />
              </div>
              
              {/* 하단 버튼 - safe area 고려 */}
              <div 
                className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 flex gap-2 shrink-0"
                style={{
                  paddingBottom: isMobile ? `calc(1rem + env(safe-area-inset-bottom))` : '1rem',
                  marginBottom: isMobile ? '56px' : '0' // 하단 네비 높이만큼 마진
                }}
              >
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    clearAllFilters()
                    closeModal()
                  }}
                >
                  초기화
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => closeModal()}
                >
                  적용하기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Filter Sidebar */}
        <Card className="hidden lg:block shadow-lg border-2 border-gray-100 dark:border-gray-700 sticky top-20">
          <CardHeader className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              필터 옵션
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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