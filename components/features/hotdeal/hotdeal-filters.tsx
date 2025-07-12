'use client'

import { Button } from '@/components/ui/button'
import { TrendingUp, Clock, Percent, Star } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { useCategoryFilter, useSortFilter } from '@/hooks/use-url-sync'

interface HotDealFiltersProps {
  className?: string
}

export function HotDealFilters({ className }: HotDealFiltersProps) {
  const { t } = useLanguage()
  const { category, setCategory } = useCategoryFilter()
  const { sort, setSort } = useSortFilter()

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

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {t(`category.${cat}`)}
            </Button>
          ))}
        </div>

        {/* 정렬 옵션 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {sortOptions.map((option) => {
            const Icon = option.icon
            return (
              <Button
                key={option.value}
                variant={sort === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSort(option.value)}
                className="whitespace-nowrap flex-shrink-0"
              >
                <Icon className="w-4 h-4 mr-1" />
                {t(`sort.${option.value}`)}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}