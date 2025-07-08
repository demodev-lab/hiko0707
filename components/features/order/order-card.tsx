'use client'

import { Order } from '@/types/order'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { formatDistanceToNow } from 'date-fns'
import { ko, enUS, zhCN, ja, vi, th } from 'date-fns/locale'
import { Package, Calendar, CreditCard, Truck, ExternalLink } from 'lucide-react'

interface OrderCardProps {
  order: Order
  onClick?: () => void
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800', 
  purchasing: 'bg-purple-100 text-purple-800',
  shipping: 'bg-green-100 text-green-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800'
}

const dateLocales = {
  ko,
  en: enUS,
  zh: zhCN,
  ja,
  vi,
  th,
  id: enUS
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const { t, language } = useLanguage()

  const getStatusBadge = (status: Order['status']) => {
    return (
      <Badge className={statusColors[status]}>
        {t(`order.status.${status}`)}
      </Badge>
    )
  }

  const formatDate = (date: Date) => {
    const locale = dateLocales[language as keyof typeof dateLocales] || dateLocales.ko
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale 
      })
    } catch {
      return new Date(date).toLocaleDateString()
    }
  }

  const primaryItem = order.items[0]
  const hasMoreItems = order.items.length > 1

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 왼쪽: 주문 정보 */}
          <div className="flex-1 space-y-3">
            {/* 주문번호와 상태 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-sm text-gray-600">
                  {order.orderNumber}
                </span>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* 상품 정보 */}
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {primaryItem.productName}
                {hasMoreItems && (
                  <span className="text-sm text-gray-500 ml-2">
                    외 {order.items.length - 1}개
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                수량: {primaryItem.quantity}개 | 
                가격: ₩{primaryItem.price.toLocaleString()}
              </p>
            </div>

            {/* 날짜 정보 */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>주문일: {formatDate(order.createdAt)}</span>
              </div>
              {order.deliveredAt && (
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  <span>배송완료: {formatDate(order.deliveredAt)}</span>
                </div>
              )}
            </div>

            {/* 배송 추적 정보 */}
            {(order.koreanTrackingNumber || order.internationalTrackingNumber) && (
              <div className="flex flex-wrap gap-2 text-xs">
                {order.koreanTrackingNumber && (
                  <Badge variant="outline">
                    한국: {order.koreanTrackingNumber}
                  </Badge>
                )}
                {order.internationalTrackingNumber && (
                  <Badge variant="outline">
                    국제: {order.internationalTrackingNumber}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽: 금액 및 액션 */}
          <div className="flex flex-col justify-between md:w-48">
            {/* 결제 정보 */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <CreditCard className="w-4 h-4" />
                <span>{t(`order.payment.${order.paymentMethod}`)}</span>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  상품: ₩{order.subtotal.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  수수료: ₩{(order.serviceFee + order.koreanShippingFee + order.internationalShippingFee).toLocaleString()}
                </div>
                <div className="text-lg font-bold text-blue-600">
                  총 ₩{order.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="mt-4 space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  onClick?.()
                }}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                상세보기
              </Button>
              
              {order.status === 'shipping' && order.internationalTrackingNumber && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    // 배송 추적 페이지로 이동 (추후 구현)
                    window.open(`/tracking/${order.internationalTrackingNumber}`, '_blank')
                  }}
                >
                  <Truck className="w-4 h-4 mr-1" />
                  배송추적
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 고객 요청사항 */}
        {order.customerNotes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>요청사항:</strong> {order.customerNotes}
            </p>
          </div>
        )}

        {/* 관리자 메모 */}
        {order.adminNotes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>관리자 메모:</strong> {order.adminNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}