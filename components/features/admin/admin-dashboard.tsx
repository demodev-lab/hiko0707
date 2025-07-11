'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  AlertCircle
} from 'lucide-react'
import { Order } from '@/types/order'
import { StatsCard } from '@/components/features/admin/stats-card'
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
  const { allRequests } = useBuyForMeAdmin()
  
  const buyForMeStats = {
    total: allRequests.length,
    pending: allRequests.filter(r => r.status === 'pending_review').length,
    active: allRequests.filter(r => ['quote_sent', 'quote_approved', 'payment_pending', 'payment_completed', 'purchasing', 'shipping'].includes(r.status)).length
  }

  const statsCards = [
    {
      title: '대리 구매 요청',
      value: buyForMeStats.total,
      subtitle: `검토 대기: ${buyForMeStats.pending}`,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: '진행중 주문',
      value: buyForMeStats.active,
      subtitle: '처리 중인 주문',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: '활성 핫딜',
      value: stats.activeHotdeals,
      subtitle: `전체: ${stats.totalHotdeals}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: '오늘 매출',
      value: `₩${stats.totalRevenue.toLocaleString()}`,
      subtitle: '수수료 수익',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="text-gray-600 mt-1">대리 구매 요청 및 핫딜 관리</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>
        
        {/* 대리 구매 알림 카드 */}
        {buyForMeStats.pending > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      새로운 대리 구매 요청이 {buyForMeStats.pending}건 있습니다
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
        <Tabs defaultValue="buy-for-me" className="space-y-4">
          <TabsList>
            <TabsTrigger value="buy-for-me">
              <ShoppingBag className="w-4 h-4 mr-2" />
              대리 구매 ({buyForMeStats.total})
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
                  <span>대리 구매 요청 현황</span>
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
                      아직 대리 구매 요청이 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="hotdeals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>핫딜 관리</span>
                  <Link href="/admin/hotdeals">
                    <Button variant="outline" size="sm">
                      전체 보기
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{stats.activeHotdeals}</p>
                      <p className="text-sm text-gray-600 mt-1">활성 핫딜</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-700">{stats.totalHotdeals - stats.activeHotdeals}</p>
                      <p className="text-sm text-gray-600 mt-1">종료된 핫딜</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <Link href="/admin/hotdeals">
                      <Button className="w-full">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        핫딜 관리 페이지로 이동
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}