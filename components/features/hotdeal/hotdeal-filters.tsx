'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TrendingUp, Clock, Percent, Star } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

interface HotDealFiltersProps {
  initialCategory?: string
  initialSort?: string
}

export function HotDealFilters({ initialCategory, initialSort }: HotDealFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const categories = [
    'all',
    'electronics',
    'food',
    'beauty',
    'home',
    'sports',
    'other'
  ]

  const sortOptions = [
    { value: 'latest', icon: Clock },
    { value: 'popular', icon: TrendingUp },
    { value: 'discount', icon: Percent },
    { value: 'rating', icon: Star }
  ]

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    params.delete('page') // 필터 변경시 첫 페이지로
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (sort === 'latest') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }
    params.delete('page') // 정렬 변경시 첫 페이지로
    router.push(`${pathname}?${params.toString()}`)
  }

  const currentCategory = initialCategory || 'all'
  const currentSort = initialSort || 'latest'

  return (
    <div className="space-y-4">
      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={currentCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategoryChange(category)}
            className="whitespace-nowrap"
          >
            {t(`category.${category}`)}
          </Button>
        ))}
      </div>

      {/* 정렬 옵션 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sortOptions.map((option) => {
          const Icon = option.icon
          return (
            <Button
              key={option.value}
              variant={currentSort === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange(option.value)}
              className="whitespace-nowrap"
            >
              <Icon className="w-4 h-4 mr-1" />
              {t(`sort.${option.value}`)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}