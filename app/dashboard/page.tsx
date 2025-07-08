import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loading, CardLoading } from '@/components/ui/loading'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { ShoppingBag, TrendingUp, Heart, Clock, User, CreditCard, Package, Bell } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db/database-service'
import { formatDate } from '@/lib/utils'

async function DashboardStats() {
  const hotdeals = await db.hotdeals.findAll()
  const orders = await db.orders.findAll()
  const payments = await db.payments.findAll()
  
  const recentHotdeals = hotdeals.slice(0, 3)
  const recentOrders = orders.slice(0, 3)
  
  const stats = [
    {
      title: '오늘의 핫딜',
      value: hotdeals.length,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '내 주문',
      value: orders.length,
      icon: ShoppingBag,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: '즐겨찾기',
      value: 0, // TODO: 즐겨찾기 기능 구현 후 연동
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: '결제 내역',
      value: payments.length,
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <>
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 최근 핫딜 */}
        <div className="col-span-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>최근 핫딜</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/hotdeals">모두 보기</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentHotdeals.length > 0 ? (
                recentHotdeals.map((deal) => (
                  <div key={deal.id} className="flex items-center space-x-4 p-4 rounded-lg border">
                    <div className="flex-1">
                      <h3 className="font-medium line-clamp-1">{deal.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{deal.category}</Badge>
                        <Badge variant="outline">{deal.source}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary">
                          ₩{deal.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-600">
                          👍 {deal.likeCount || 0}
                        </span>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/hotdeals/${deal.id}`}>
                        <ShoppingBag className="w-4 h-4 mr-1" />
                        보기
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>아직 핫딜이 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="col-span-3 space-y-4">
          {/* 최근 주문 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>최근 주문</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/orders">모두 보기</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {order.items[0]?.productName || '주문 상품'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(order.createdAt).split(' ')[0]}
                        </p>
                      </div>
                      <Badge variant={
                        order.status === 'delivered' ? 'default' :
                        order.status === 'purchasing' || order.status === 'shipping' ? 'secondary' :
                        order.status === 'pending' || order.status === 'confirmed' ? 'outline' : 'destructive'
                      }>
                        {order.status === 'delivered' ? '완료' :
                         order.status === 'purchasing' || order.status === 'shipping' ? '진행중' :
                         order.status === 'pending' || order.status === 'confirmed' ? '대기' : '취소'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">주문 내역이 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 빠른 액션 */}
          <Card>
            <CardHeader>
              <CardTitle>빠른 액션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start">
                <Link href="/order">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  대신 사줘요
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/hotdeals">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  핫딜 둘러보기
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/payments">
                  <CreditCard className="w-4 h-4 mr-2" />
                  결제 내역
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">대시보드</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              HiKo와 함께하는 스마트 쇼핑을 시작하세요
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-2">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Bell className="w-4 h-4 mr-2" />
              <span className="sm:hidden">알림</span>
              <span className="hidden sm:inline">알림 설정</span>
            </Button>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href="/hotdeals">
                핫딜 보기
              </Link>
            </Button>
          </div>
        </div>

        <Suspense fallback={
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <CardLoading />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Loading message="대시보드를 불러오는 중..." />
          </div>
        }>
          <DashboardStats />
        </Suspense>
      </div>
    </ProtectedRoute>
  )
}