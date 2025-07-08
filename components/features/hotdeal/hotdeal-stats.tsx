'use client'

import { useLanguage } from '@/lib/i18n/context'

interface HotDealStatsProps {
  stats: {
    activeCount: number
    avgDiscount: number
    freeShippingCount: number
    highDiscountCount: number
  }
}

export function HotDealStats({ stats }: HotDealStatsProps) {
  const { t } = useLanguage()
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">
          {stats.activeCount}
        </div>
        <div className="text-sm text-gray-600">{t('hotdeals.activeDeals')}</div>
      </div>
      <div className="bg-red-50 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-red-600">
          {stats.avgDiscount}%
        </div>
        <div className="text-sm text-gray-600">{t('hotdeals.avgDiscount')}</div>
      </div>
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-600">
          {stats.freeShippingCount}
        </div>
        <div className="text-sm text-gray-600">{t('hotdeals.freeShipping')}</div>
      </div>
      <div className="bg-orange-50 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-orange-600">
          {stats.highDiscountCount}
        </div>
        <div className="text-sm text-gray-600">{t('hotdeals.highDiscount')}</div>
      </div>
    </div>
  )
}