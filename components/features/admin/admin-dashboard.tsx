'use client'

import { useState } from 'react'
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
import { useBuyForMeAdmin } from '@/hooks/use-buy-for-me'
import Link from 'next/link'

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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { allRequests } = useBuyForMeAdmin()
  
  const buyForMeStats = {
    total: allRequests.length,
    pending: allRequests.filter(r => r.status === 'pending_review').length,
    active: allRequests.filter(r => ['quote_sent', 'quote_approved', 'payment_pending', 'payment_completed', 'purchasing', 'shipping'].includes(r.status)).length
  }

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
        
        {/* Buy for Me 알림 카드 */}
        {buyForMeStats.pending > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      새로운 Buy for Me 요청이 {buyForMeStats.pending}건 있습니다
                    </p>
                    <p className="text-sm text-yellow-700">
                      검토가 필요한 구매 대행 요청을 확인해주세요
                    </p>
                  </div>
                </div>
                <Link href="/admin/buy-for-me">
                  <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    요청 확인
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 탭 */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="buy-for-me">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Buy for Me ({buyForMeStats.total})
            </TabsTrigger>
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
          
          <TabsContent value="buy-for-me" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Buy for Me 요청 현황</span>
                  <Link href="/admin/buy-for-me">
                    <Button variant="outline" size="sm">
                      전체 보기
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-700">{buyForMeStats.pending}</p>
                    <p className="text-sm text-gray-600 mt-1">검토 대기</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{buyForMeStats.active}</p>
                    <p className="text-sm text-gray-600 mt-1">진행 중</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{buyForMeStats.total}</p>
                    <p className="text-sm text-gray-600 mt-1">전체 요청</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {allRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{request.productInfo.title}</p>
                        <p className="text-xs text-gray-500">
                          {request.shippingInfo.name} · {new Date(request.requestDate).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {request.status === 'pending_review' ? '검토 대기' : 
                         request.status === 'quote_sent' ? '견적 발송' :
                         request.status === 'purchasing' ? '구매 진행' : '기타'}
                      </Badge>
                    </div>
                  ))}
                  {allRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      아직 Buy for Me 요청이 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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