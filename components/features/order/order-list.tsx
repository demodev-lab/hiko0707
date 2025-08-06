'use client'

import { useState } from 'react'
import { useSupabaseBuyForMe } from '@/hooks/use-supabase-buy-for-me'
import { OrderCard } from './order-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { Order, OrderStatus } from '@/types/order'
import { BuyForMeRequest, BuyForMeStatus } from '@/types/buy-for-me'

interface OrderListProps {
  userId?: string
  showStats?: boolean
}

// BuyForMeRequest를 Order로 변환하는 어댑터 함수
function buyForMeRequestToOrder(request: BuyForMeRequest): Order {
  // BuyForMeStatus를 OrderStatus로 매핑
  const statusMapping: Record<BuyForMeStatus, OrderStatus> = {
    'pending_review': 'pending',
    'quote_sent': 'pending',
    'quote_approved': 'confirmed',
    'payment_pending': 'confirmed',
    'payment_completed': 'confirmed',
    'purchasing': 'purchasing',
    'shipping': 'shipping',
    'delivered': 'delivered',
    'cancelled': 'cancelled'
  }

  return {
    id: request.id,
    userId: request.userId,
    items: [{
      id: `${request.id}-item`,
      productName: request.productInfo.title,
      productUrl: request.productInfo.originalUrl,
      productImage: request.productInfo.imageUrl,
      price: request.productInfo.originalPrice,
      quantity: request.quantity,
      notes: request.productOptions,
      hotdealId: request.hotdealId
    }],
    status: statusMapping[request.status],
    shippingAddress: {
      fullName: request.shippingInfo.name,
      phone: request.shippingInfo.phone,
      email: request.shippingInfo.email,
      post_code: request.shippingInfo.postalCode,
      address: request.shippingInfo.address,
      address_detail: request.shippingInfo.detailAddress
    },
    paymentMethod: 'card', // 기본값
    
    subtotal: request.productInfo.originalPrice * request.quantity,
    serviceFee: request.estimatedServiceFee,
    domesticShippingFee: request.productInfo.shippingFee,
    totalAmount: request.estimatedTotalAmount,
    
    orderNumber: request.id.slice(0, 8).toUpperCase(),
    koreanTrackingNumber: request.orderInfo?.trackingNumber,
    
    customerNotes: request.specialRequests,
    
    createdAt: request.requestDate,
    updatedAt: request.updatedAt,
    deliveredAt: request.status === 'delivered' ? request.updatedAt : undefined
  } as Order
}

export function OrderList({ userId, showStats = true }: OrderListProps) {
  const { t } = useLanguage()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Supabase Buy for Me 요청 목록을 Order로 변환
  const { requests, isLoading } = useSupabaseBuyForMe()
  const orders = requests.map(buyForMeRequestToOrder)
  
  // 통계 계산
  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    pendingOrders: orders.filter(o => ['pending', 'confirmed', 'purchasing', 'shipping'].includes(o.status)).length,
    totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0)
  }

  // 필터링된 주문 목록
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all') {
      if (order.status !== statusFilter) return false
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return order.items[0]?.productName.toLowerCase().includes(query) ||
             order.orderNumber.toLowerCase().includes(query)
    }

    return true
  })

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status as OrderStatus | 'all')
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // 페이지네이션 계산
  const itemsPerPage = 20
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage  
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">전체 주문</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">진행 중</p>
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">완료</p>
                  <p className="text-2xl font-bold">{stats.completedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">취소</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>주문 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* 상태 필터 */}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">{t('order.status.pending')}</SelectItem>
                <SelectItem value="confirmed">{t('order.status.confirmed')}</SelectItem>
                <SelectItem value="purchasing">{t('order.status.purchasing')}</SelectItem>
                <SelectItem value="shipping">{t('order.status.shipping')}</SelectItem>
                <SelectItem value="delivered">{t('order.status.delivered')}</SelectItem>
                <SelectItem value="cancelled">{t('order.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>

            {/* 검색 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="주문번호, 상품명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 주문 목록 */}
          <div className="space-y-4">
            {paginatedOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">주문 내역이 없습니다</p>
                <Button className="mt-4" onClick={() => window.location.href = '/order'}>
                  첫 주문하기
                </Button>
              </div>
            ) : (
              paginatedOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order}
                  onClick={() => window.location.href = `/order/${order.id}`}
                />
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {t('common.previous')}
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2">...</span>
                    <Button
                      variant={totalPages === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}