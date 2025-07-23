'use client'

import { useEffect, useState } from 'react'
import { Loading } from '@/components/ui/loading'
import { TrendingUp, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { HotDealsClient } from './hotdeals-client'
import { HotDeal } from '@/types/hotdeal'
import { useHotDeals } from '@/hooks/use-local-db'

function HotDealsStats({ deals }: { deals: HotDeal[] }) {
  // 3일 이내 핫딜만 활성으로 간주
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  
  const activeDeals = deals.filter(deal => {
    const crawledDate = new Date(deal.crawledAt)
    return crawledDate >= threeDaysAgo
  })
  
  const statsData = [
    {
      title: '활성 핫딜',
      value: activeDeals.length.toLocaleString(),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
    },
    {
      title: '연동 커뮤니티',
      value: '6개',
      icon: Zap,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20',
      borderColor: 'border-amber-200 dark:border-amber-700',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-2xl mx-auto">
      {statsData.map((stat) => (
        <Card key={stat.title} className={`p-3 sm:p-4 border ${stat.borderColor} shadow-sm hover:shadow-md transition-all duration-200 ${stat.bgColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">{stat.title}</p>
            </div>
            <div className="p-2 rounded-full bg-white/50 dark:bg-gray-800/50">
              <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default function HotDealsPage() {
  const { hotdeals, loading, refetch } = useHotDeals()

  // 페이지 로드시 데이터 새로고침
  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            🔥 오늘의 핫딜
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            6개 커뮤니티에서 실시간으로 수집한 최고의 할인 정보
          </p>
        </div>

        {/* 통계 - 간소화된 디자인 */}
        <HotDealsStats deals={hotdeals} />

        {/* 필터와 핫딜 목록 */}
        <div className="pb-20 md:pb-0">
          <HotDealsClient initialDeals={hotdeals} />
        </div>
      </div>
    </div>
  )
}