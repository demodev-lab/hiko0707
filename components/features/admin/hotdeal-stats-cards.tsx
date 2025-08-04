'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  MessageSquare,
  Package,
  Activity,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react'
import { useHotDealStats } from '@/hooks/use-supabase-hotdeals'

interface StatsCardsProps {
  refreshKey: number
}

export function HotDealStatsCards({ refreshKey }: StatsCardsProps) {
  const { data: todayStats, isLoading: todayLoading } = useHotDealStats('today')
  const { data: weekStats } = useHotDealStats('week')
  const { data: yesterdayStats } = useHotDealStats('all') // 어제 데이터는 별도 쿼리가 필요하므로 임시로 all 사용

  const [animatedCounts, setAnimatedCounts] = useState({
    totalDeals: 0,
    activeDeals: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    avgViews: 0
  })

  // 카운트업 애니메이션
  useEffect(() => {
    if (!todayStats) return

    const targets = {
      totalDeals: todayStats.totalDeals || 0,
      activeDeals: todayStats.activeDeals || 0,
      totalViews: todayStats.totalViews || 0,
      totalLikes: todayStats.totalLikes || 0,
      totalComments: 0, // 댓글 수는 별도 집계 필요
      avgViews: todayStats.totalDeals > 0 ? Math.round(todayStats.totalViews / todayStats.totalDeals) : 0
    }

    const duration = 1000 // 1초
    const steps = 50
    const stepTime = duration / steps

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep >= steps) {
        setAnimatedCounts(targets)
        clearInterval(interval)
        return
      }

      const progress = currentStep / steps
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      setAnimatedCounts({
        totalDeals: Math.round(targets.totalDeals * easeOutQuart),
        activeDeals: Math.round(targets.activeDeals * easeOutQuart),
        totalViews: Math.round(targets.totalViews * easeOutQuart),
        totalLikes: Math.round(targets.totalLikes * easeOutQuart),
        totalComments: Math.round(targets.totalComments * easeOutQuart),
        avgViews: Math.round(targets.avgViews * easeOutQuart)
      })

      currentStep++
    }, stepTime)

    return () => clearInterval(interval)
  }, [todayStats, refreshKey])

  if (todayLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const weeklyGrowth = {
    deals: calculateGrowth(todayStats?.totalDeals || 0, (weekStats?.totalDeals || 0) / 7),
    views: calculateGrowth(todayStats?.totalViews || 0, (weekStats?.totalViews || 0) / 7),
    likes: calculateGrowth(todayStats?.totalLikes || 0, (weekStats?.totalLikes || 0) / 7)
  }

  const stats = [
    {
      title: '전체 핫딜',
      value: animatedCounts.totalDeals,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      growth: weeklyGrowth.deals,
      subtitle: '오늘 등록된 핫딜'
    },
    {
      title: '활성 핫딜',
      value: animatedCounts.activeDeals,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      growth: null,
      subtitle: `전체 중 ${todayStats?.totalDeals > 0 ? Math.round((animatedCounts.activeDeals / todayStats.totalDeals) * 100) : 0}% 활성`
    },
    {
      title: '총 조회수',
      value: animatedCounts.totalViews,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      growth: weeklyGrowth.views,
      subtitle: '실시간 집계'
    },
    {
      title: '총 좋아요',
      value: animatedCounts.totalLikes,
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      growth: weeklyGrowth.likes,
      subtitle: '사용자 반응'
    },
    {
      title: '평균 조회수',
      value: animatedCounts.avgViews,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      growth: null,
      subtitle: '핫딜당 평균'
    },
    {
      title: '종료 핫딜',
      value: (todayStats?.totalDeals || 0) - (todayStats?.activeDeals || 0),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      growth: null,
      subtitle: '만료된 핫딜'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const isPositiveGrowth = stat.growth !== null && stat.growth > 0
        const isNegativeGrowth = stat.growth !== null && stat.growth < 0

        return (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    {stat.growth !== null && (
                      <div className={`flex items-center gap-1 text-sm ${
                        isPositiveGrowth ? 'text-green-600' : 
                        isNegativeGrowth ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {isPositiveGrowth && <TrendingUp className="w-3 h-3" />}
                        {isNegativeGrowth && <TrendingDown className="w-3 h-3" />}
                        {Math.abs(stat.growth)}%
                      </div>
                    )}
                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                  </div>
                </div>
                
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}