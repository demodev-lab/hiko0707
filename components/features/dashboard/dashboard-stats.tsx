'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ShoppingBag, Users, TrendingUp, UserCheck } from 'lucide-react'
import { useSupabaseAdminStats, useSupabaseHotDealStats } from '@/hooks/use-supabase-admin'

export function DashboardStats() {
  const { stats: adminStats, loading: adminLoading } = useSupabaseAdminStats()
  const { stats: hotdealStats, loading: hotdealLoading } = useSupabaseHotDealStats()

  const loading = adminLoading || hotdealLoading

  // 로딩 상태
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // 에러 상태
  if (adminStats === null && hotdealStats === null && !loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              통계 데이터를 불러올 수 없습니다
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = [
    {
      title: '전체 핫딜',
      value: hotdealStats?.total?.toString() || '0',
      description: '크롤링된 총 핫딜 수',
      icon: ShoppingBag,
    },
    {
      title: '활성 핫딜',
      value: hotdealStats?.active?.toString() || '0',
      description: '현재 활성화된 핫딜',
      icon: TrendingUp,
    },
    {
      title: '전체 사용자',
      value: adminStats?.totalUsers?.toString() || '0',
      description: '가입된 총 사용자 수',
      icon: Users,
    },
    {
      title: '활성 사용자',
      value: adminStats?.activeUsers?.toString() || '0',
      description: '최근 활동한 사용자',
      icon: UserCheck,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}