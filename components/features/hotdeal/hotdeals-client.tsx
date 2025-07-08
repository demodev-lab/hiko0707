'use client'

import { useLanguage } from '@/lib/i18n/context'
import { TrendingUp, Package, Zap, Percent } from 'lucide-react'
import { SearchBar } from '@/components/features/search/search-bar'
import { SearchFilters } from '@/components/features/search/search-filters'
import { HotDeal } from '@/types/hotdeal'

interface HotDealsClientProps {
  stats: Array<{
    title: string
    value: string | number
    icon: any
    color: string
    bgColor: string
  }>
  initialFilters: {
    category?: string
    source?: string
    sortBy?: string
    minPrice?: number
    maxPrice?: number
  }
}

export function HotDealsClient({ stats, initialFilters }: HotDealsClientProps) {
  const { t } = useLanguage()

  const iconMap = {
    TrendingUp,
    Package,
    Zap,
    Percent
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🔥 {t('hotdeals.title')}</h1>
          <p className="text-gray-600">
            {t('hotdeals.subtitle')}
          </p>
        </div>

        {/* 검색바 */}
        <div className="mb-8">
          <SearchBar 
            placeholder={`${t('nav.hotdeals')} 검색...`}
            className="max-w-2xl"
            showSuggestions={false}
          />
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = iconMap[stat.icon as keyof typeof iconMap]
            return (
              <div key={stat.title} className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-md ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 필터 사이드바 */}
          <div className="lg:col-span-1">
            <SearchFilters initialFilters={initialFilters} />
          </div>

          {/* 핫딜 리스트 */}
          <div className="lg:col-span-3" id="hotdeal-list">
            {/* Server component will render the list */}
          </div>
        </div>
      </div>
    </div>
  )
}