'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  BarChart,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react'
import { Order } from '@/types/order'
import { OrdersTable } from '@/components/features/admin/orders-table'
import { StatsCard } from '@/components/features/admin/stats-card'
import { RevenueChart } from '@/components/features/admin/revenue-chart'

interface AdminDashboardProps {
  stats: {
    totalUsers: number
    activeUsers: number
    totalOrders: number
    pendingOrders: number
    totalRevenue: number
    totalHotdeals: number
    activeHotdeals: number
  }
  recentOrders: Order[]
}

export function AdminDashboard({ stats, recentOrders }: AdminDashboardProps) {
  const { t } = useLanguage()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // 페이지 새로고침
    window.location.reload()
  }

  const handleExportData = () => {
    // TODO: 데이터 내보내기 기능 구현
    console.log('Exporting data...')
  }

  const statsCards = [
    {
      title: '전체 사용자',
      value: stats.totalUsers,
      subtitle: `활성 사용자: ${stats.activeUsers}`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: '주문 현황',
      value: stats.totalOrders,
      subtitle: `처리 대기: ${stats.pendingOrders}`,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: '핫딜 현황',
      value: stats.totalHotdeals,
      subtitle: `활성 핫딜: ${stats.activeHotdeals}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: '총 매출',
      value: `₩${stats.totalRevenue.toLocaleString()}`,
      subtitle: '완료된 결제 기준',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">관리자 대시보드</h1>
            <p className="text-gray-600 mt-1">HiKo 서비스 통계 및 관리</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
            >
              <Download className="w-4 h-4 mr-2" />
              데이터 내보내기
            </Button>
            <Button size="sm">
              <Settings className="w-4 h-4 mr-2" />
              설정
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* 탭 */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              주문 관리
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <BarChart className="w-4 h-4 mr-2" />
              매출 분석
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              사용자 관리
            </TabsTrigger>
            <TabsTrigger value="hotdeals">
              <TrendingUp className="w-4 h-4 mr-2" />
              핫딜 관리
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>최근 주문 내역</span>
                  <Button variant="outline" size="sm">
                    전체 보기
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrdersTable orders={recentOrders} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>매출 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>사용자 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  사용자 관리 기능은 준비 중입니다.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hotdeals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>핫딜 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  핫딜 관리 기능은 준비 중입니다.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}