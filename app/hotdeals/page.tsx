'use client'

import { useEffect, useState } from 'react'
import { SearchBar } from '@/components/features/search/search-bar'
import { Loading } from '@/components/ui/loading'
import { TrendingUp, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { HotDealsClient } from './hotdeals-client'
import { HotDeal } from '@/types/hotdeal'
import { useHotDeals } from '@/hooks/use-local-db'

function HotDealsStats({ deals }: { deals: HotDeal[] }) {
  const activeDeals = deals.filter(d => d.status === 'active')
  const today = new Date().toDateString()
  
  const stats = {
    active: activeDeals.length,
    today: deals.filter(d => 
      new Date(d.crawledAt).toDateString() === today
    ).length,
  }

  const statsData = [
    {
      title: '활성 딜',
      value: stats.active,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '오늘 등록',
      value: stats.today,
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-2xl mx-auto">
      {statsData.map((stat) => (
        <Card key={stat.title} className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
              <p className="text-xs sm:text-sm text-gray-600">{stat.title}</p>
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
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">🔥 핫딜</h1>
        <p className="text-sm sm:text-base text-gray-600">
          실시간 한국 쇼핑 정보를 확인하세요
        </p>
      </div>

      {/* 통계 */}
      <HotDealsStats deals={hotdeals} />

      {/* 검색 */}
      <div className="mb-8">
        <SearchBar className="max-w-2xl mx-auto" />
      </div>

      {/* 필터와 핫딜 목록 - 모바일에서 하단 여백 추가 */}
      <div className="pb-20 md:pb-0">
        <HotDealsClient initialDeals={hotdeals} />
      </div>
    </div>
  )
}