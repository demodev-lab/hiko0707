import { Metadata } from 'next'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loading, CardLoading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/error'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Package, Clock, CheckCircle, XCircle, TrendingUp, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db/database-service'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: '주문 내역 - HiKo',
  description: '나의 주문 내역을 확인하고 관리하세요'
}

async function OrderStats() {
  const orders = await db.orders.findAll()
  
  const stats = [
    {
      title: '전체 주문',
      value: orders.length,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '진행중',
      value: orders.filter(o => o.status === 'purchasing' || o.status === 'shipping').length,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: '완료',
      value: orders.filter(o => o.status === 'delivered').length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: '취소',
      value: orders.filter(o => o.status === 'cancelled').length,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
  )
}

async function OrderList() {
  const orders = await db.orders.findAll()
  const sortedOrders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">주문 내역이 없습니다</h3>
        <p className="mt-1 text-sm text-gray-500">
          아직 주문한 상품이 없습니다. 핫딜을 둘러보고 첫 주문을 시작해보세요!
        </p>
        <div className="mt-6">
          <Link href="/hotdeals">
            <Button>핫딜 보러가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedOrders.map((order) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={
                    order.status === 'delivered' ? 'default' :
                    order.status === 'purchasing' || order.status === 'shipping' ? 'secondary' :
                    order.status === 'pending' || order.status === 'confirmed' ? 'outline' : 'destructive'
                  }>
                    {order.status === 'delivered' ? '완료' :
                     order.status === 'purchasing' || order.status === 'shipping' ? '진행중' :
                     order.status === 'pending' || order.status === 'confirmed' ? '대기중' : '취소됨'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    주문번호: {order.id.slice(0, 8)}...
                  </span>
                </div>

                <h3 className="font-medium text-lg mb-2">
                  {order.items[0]?.productName || '상품 정보'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p><strong>상품 URL:</strong> {order.items[0]?.productUrl || 'N/A'}</p>
                    <p><strong>수량:</strong> {order.items[0]?.quantity || 1}</p>
                    {order.items[0]?.options && (
                      <p><strong>옵션:</strong> {JSON.stringify(order.items[0].options)}</p>
                    )}
                  </div>
                  <div>
                    <p><strong>주문일:</strong> {formatDate(order.createdAt)}</p>
                    <p><strong>배송지:</strong> {order.shippingAddress.addressLine1}</p>
                    {order.customerNotes && (
                      <p><strong>특별 요청:</strong> {order.customerNotes}</p>
                    )}
                  </div>
                </div>

                {order.adminNotes && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>관리자 메모:</strong> {order.adminNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 ml-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ₩{order.totalAmount.toLocaleString()}
                  </p>
                  {order.subtotal !== order.totalAmount && (
                    <p className="text-sm text-gray-500 line-through">
                      ₩{order.subtotal.toLocaleString()}
                    </p>
                  )}
                </div>
                
                <Button asChild size="sm" variant="outline">
                  <Link href={`/order/${order.id}`}>
                    자세히 보기
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">주문 내역</h1>
            <p className="text-gray-600">
              대신 사줘요 서비스 주문 내역을 확인하고 관리할 수 있습니다
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/hotdeals">
                <TrendingUp className="w-4 h-4 mr-2" />
                핫딜 보기
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/order">
                <ShoppingBag className="w-4 h-4 mr-2" />
                새 주문
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
            <Loading message="주문 내역을 불러오는 중..." />
          </div>
        }>
          <OrderStats />
          <OrderList />
        </Suspense>
      </div>
    </ProtectedRoute>
  )
}