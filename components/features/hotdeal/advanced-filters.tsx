'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RangeSlider } from '@/components/ui/range-slider'
import { useSupabaseFilterPresets, type FilterPreset } from '@/hooks/use-supabase-filter-presets'
import { useLanguage } from '@/lib/i18n/context'
import { 
  Filter, 
  X, 
  Save, 
  Bookmark, 
  ChevronDown, 
  ChevronUp,
  Tag,
  DollarSign,
  Building2,
  Layers,
  SlidersHorizontal
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface AdvancedFiltersProps {
  searchParams?: Record<string, string | string[] | undefined>
  onFiltersChange?: (filters: Record<string, any>) => void
}

// Filter options data
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
  { value: 'ppomppu', label: '뽐뿌' },
  { value: 'ruliweb', label: '루리웹' },
  { value: 'clien', label: '클리앙' },
  { value: 'quasarzone', label: '퀘이사존' },
  { value: 'coolenjoy', label: '쿨엔조이' },
  { value: 'eomisae', label: '어미새' },
]

const BRANDS = [
  { value: 'samsung', label: '삼성' },
  { value: 'lg', label: 'LG' },
  { value: 'apple', label: '애플' },
  { value: 'sony', label: '소니' },
  { value: 'nike', label: '나이키' },
  { value: 'adidas', label: '아디다스' },
]

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price_low', label: '가격 낮은순' },
  { value: 'price_high', label: '가격 높은순' },
  { value: 'discount', label: '할인율순' },
]

const TAGS = [
  { value: 'free_shipping', label: '무료배송' },
  { value: 'coupon', label: '쿠폰적용' },
  { value: 'card_discount', label: '카드할인' },
  { value: 'bundle', label: '묶음상품' },
  { value: 'limited', label: '한정수량' },
  { value: 'hot', label: '핫딜' },
]

export function AdvancedFilters({ 
  searchParams = {}, 
  onFiltersChange 
}: AdvancedFiltersProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const { t } = useLanguage()
  const { 
    presets, 
    isLoading,
    savePreset, 
    deletePreset, 
    applyPreset, 
    findMatchingPreset,
    isSavingPreset,
    isDeletingPreset
  } = useSupabaseFilterPresets()

  // Filter states
  const [category, setCategory] = useState('all')
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 1000000])
  const [sortBy, setSortBy] = useState('latest')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // UI states
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    source: false,
    brand: false,
    tags: false,
  })
  const [presetName, setPresetName] = useState('')
  const [showPresetDialog, setShowPresetDialog] = useState(false)

  // Initialize from URL params
  useEffect(() => {
    const params = new URLSearchParams(urlSearchParams.toString())
    
    setCategory(params.get('category') || 'all')
    setSortBy(params.get('sort') || 'latest')
    
    const sources = params.get('source')?.split(',') || []
    setSelectedSources(sources)
    
    const brands = params.get('brand')?.split(',') || []
    setSelectedBrands(brands)
    
    const tags = params.get('tag')?.split(',') || []
    setSelectedTags(tags)
    
    const minPrice = parseInt(params.get('minPrice') || '0')
    const maxPrice = parseInt(params.get('maxPrice') || '1000000')
    setPriceRange([minPrice, maxPrice])
  }, [urlSearchParams])

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams(urlSearchParams.toString())
    
    // Category
    if (category !== 'all') params.set('category', category)
    else params.delete('category')
    
    // Sources
    if (selectedSources.length > 0) params.set('source', selectedSources.join(','))
    else params.delete('source')
    
    // Brands
    if (selectedBrands.length > 0) params.set('brand', selectedBrands.join(','))
    else params.delete('brand')
    
    // Price range
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString())
    else params.delete('minPrice')
    
    if (priceRange[1] < 1000000) params.set('maxPrice', priceRange[1].toString())
    else params.delete('maxPrice')
    
    // Sort
    if (sortBy !== 'latest') params.set('sort', sortBy)
    else params.delete('sort')
    
    // Tags
    if (selectedTags.length > 0) params.set('tag', selectedTags.join(','))
    else params.delete('tag')

    const newUrl = `/search?${params.toString()}`
    router.push(newUrl)
    
    // Callback for parent components
    if (onFiltersChange) {
      onFiltersChange({
        category,
        source: selectedSources,
        brand: selectedBrands,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        sortBy,
        tags: selectedTags,
      })
    }
  }

  // Reset filters
  const resetFilters = () => {
    setCategory('all')
    setSelectedSources([])
    setSelectedBrands([])
    setPriceRange([0, 1000000])
    setSortBy('latest')
    setSelectedTags([])
    
    const params = new URLSearchParams(urlSearchParams.toString())
    params.delete('category')
    params.delete('source')
    params.delete('brand')
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('sort')
    params.delete('tag')
    
    router.push(`/search?${params.toString()}`)
  }

  // Save current filters as preset
  const handleSavePreset = () => {
    if (!presetName.trim()) return
    
    savePreset({
      name: presetName,
      filters: {
        category,
        source: selectedSources,
        brands: selectedBrands,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        sortBy,
        tags: selectedTags,
      }
    })
    
    setPresetName('')
    setShowPresetDialog(false)
  }

  // Apply preset filters
  const handleApplyPreset = (presetId: string) => {
    const filters = applyPreset(presetId)
    if (!filters) return
    
    setCategory(filters.category || 'all')
    setSelectedSources(filters.source || [])
    setSelectedBrands(filters.brands || [])
    setPriceRange([filters.minPrice || 0, filters.maxPrice || 1000000])
    setSortBy(filters.sortBy || 'latest')
    setSelectedTags(filters.tags || [])
  }

  const hasActiveFilters = 
    category !== 'all' || 
    selectedSources.length > 0 || 
    selectedBrands.length > 0 ||
    priceRange[0] > 0 || 
    priceRange[1] < 1000000 ||
    sortBy !== 'latest' ||
    selectedTags.length > 0

  const activeFilterCount = 
    (category !== 'all' ? 1 : 0) +
    selectedSources.length +
    selectedBrands.length +
    (priceRange[0] > 0 || priceRange[1] < 1000000 ? 1 : 0) +
    (sortBy !== 'latest' ? 1 : 0) +
    selectedTags.length

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            고급 필터
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Save className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>필터 프리셋 저장</DialogTitle>
                  <DialogDescription>
                    현재 필터 설정을 프리셋으로 저장합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="preset-name">프리셋 이름</Label>
                    <Input
                      id="preset-name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="예: 전자제품 핫딜"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSavePreset} disabled={!presetName.trim() || isSavingPreset}>
                    {isSavingPreset ? '저장 중...' : '저장'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter Presets */}
        {!isLoading && presets.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              필터 프리셋
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset: FilterPreset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => handleApplyPreset(preset.id)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Sort */}
        <div className="space-y-2">
          <Label htmlFor="sort">정렬</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <Collapsible
          open={expandedSections.category}
          onOpenChange={(open) => 
            setExpandedSections(prev => ({ ...prev, category: open }))
          }
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
            <Label className="flex items-center gap-2 cursor-pointer">
              <Layers className="w-4 h-4" />
              카테고리
            </Label>
            {expandedSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  variant={category === cat.value ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Price Range */}
        <Collapsible
          open={expandedSections.price}
          onOpenChange={(open) => 
            setExpandedSections(prev => ({ ...prev, price: open }))
          }
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
            <Label className="flex items-center gap-2 cursor-pointer">
              <DollarSign className="w-4 h-4" />
              가격 범위
            </Label>
            {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 pb-2">
            <RangeSlider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={1000000}
              step={10000}
              formatValue={(value) => `₩${value.toLocaleString()}`}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="text-sm"
              />
              <span className="flex items-center">~</span>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000000])}
                className="text-sm"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Sources */}
        <Collapsible
          open={expandedSections.source}
          onOpenChange={(open) => 
            setExpandedSections(prev => ({ ...prev, source: open }))
          }
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
            <Label className="flex items-center gap-2 cursor-pointer">
              <Filter className="w-4 h-4" />
              출처 사이트
              {selectedSources.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedSources.length}
                </Badge>
              )}
            </Label>
            {expandedSections.source ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {SOURCES.map((source) => (
              <div key={source.value} className="flex items-center space-x-2">
                <Checkbox
                  id={source.value}
                  checked={selectedSources.includes(source.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedSources([...selectedSources, source.value])
                    } else {
                      setSelectedSources(selectedSources.filter(s => s !== source.value))
                    }
                  }}
                />
                <Label
                  htmlFor={source.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {source.label}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Brands */}
        <Collapsible
          open={expandedSections.brand}
          onOpenChange={(open) => 
            setExpandedSections(prev => ({ ...prev, brand: open }))
          }
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
            <Label className="flex items-center gap-2 cursor-pointer">
              <Building2 className="w-4 h-4" />
              브랜드
              {selectedBrands.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedBrands.length}
                </Badge>
              )}
            </Label>
            {expandedSections.brand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {BRANDS.map((brand) => (
              <div key={brand.value} className="flex items-center space-x-2">
                <Checkbox
                  id={brand.value}
                  checked={selectedBrands.includes(brand.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedBrands([...selectedBrands, brand.value])
                    } else {
                      setSelectedBrands(selectedBrands.filter(b => b !== brand.value))
                    }
                  }}
                />
                <Label
                  htmlFor={brand.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {brand.label}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Tags */}
        <Collapsible
          open={expandedSections.tags}
          onOpenChange={(open) => 
            setExpandedSections(prev => ({ ...prev, tags: open }))
          }
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
            <Label className="flex items-center gap-2 cursor-pointer">
              <Tag className="w-4 h-4" />
              태그
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedTags.length}
                </Badge>
              )}
            </Label>
            {expandedSections.tags ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {TAGS.map((tag) => (
              <div key={tag.value} className="flex items-center space-x-2">
                <Checkbox
                  id={tag.value}
                  checked={selectedTags.includes(tag.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTags([...selectedTags, tag.value])
                    } else {
                      setSelectedTags(selectedTags.filter(t => t !== tag.value))
                    }
                  }}
                />
                <Label
                  htmlFor={tag.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {tag.label}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Apply Button */}
        <Button onClick={applyFilters} className="w-full">
          필터 적용
        </Button>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              활성 필터:
            </p>
            <div className="flex flex-wrap gap-1">
              {category !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {CATEGORIES.find(c => c.value === category)?.label}
                </Badge>
              )}
              {selectedSources.map(source => (
                <Badge key={source} variant="secondary" className="text-xs">
                  {SOURCES.find(s => s.value === source)?.label}
                </Badge>
              ))}
              {selectedBrands.map(brand => (
                <Badge key={brand} variant="secondary" className="text-xs">
                  {BRANDS.find(b => b.value === brand)?.label}
                </Badge>
              ))}
              {(priceRange[0] > 0 || priceRange[1] < 1000000) && (
                <Badge variant="secondary" className="text-xs">
                  ₩{priceRange[0].toLocaleString()} ~ ₩{priceRange[1].toLocaleString()}
                </Badge>
              )}
              {sortBy !== 'latest' && (
                <Badge variant="secondary" className="text-xs">
                  {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {TAGS.find(t => t.value === tag)?.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}