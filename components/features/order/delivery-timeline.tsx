'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  Truck, 
  Home, 
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Calendar,
  User,
  Phone
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { AccessibleButton } from '@/components/common/accessible-button'

export type DeliveryStatus = 
  | 'pending'          // 접수 대기
  | 'confirmed'        // 주문 확인
  | 'preparing'        // 상품 준비중
  | 'shipped'          // 배송 시작
  | 'in_transit'       // 배송중
  | 'out_for_delivery' // 배송 출발
  | 'delivered'        // 배송 완료
  | 'failed'           // 배송 실패
  | 'returned'         // 반송

interface DeliveryEvent {
  id: string
  status: DeliveryStatus
  timestamp: Date
  location?: string
  description: string
  carrier?: string
  contact?: string
}

interface DeliveryTimelineProps {
  orderId: string
  currentStatus: DeliveryStatus
  events: DeliveryEvent[]
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: Date
  recipientName?: string
  recipientPhone?: string
  deliveryAddress?: string
  className?: string
  onRefresh?: () => void
}

const statusConfig: Record<DeliveryStatus, {
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}> = {
  pending: {
    label: '접수 대기',
    icon: <Clock className="w-5 h-5" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  confirmed: {
    label: '주문 확인',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  preparing: {
    label: '상품 준비중',
    icon: <Package className="w-5 h-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  shipped: {
    label: '배송 시작',
    icon: <Truck className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  in_transit: {
    label: '배송중',
    icon: <Truck className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  out_for_delivery: {
    label: '배송 출발',
    icon: <MapPin className="w-5 h-5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  delivered: {
    label: '배송 완료',
    icon: <Home className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  failed: {
    label: '배송 실패',
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  returned: {
    label: '반송',
    icon: <Package className="w-5 h-5" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
}

const statusOrder: DeliveryStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered'
]

export function DeliveryTimeline({
  orderId,
  currentStatus,
  events,
  trackingNumber,
  carrier,
  estimatedDelivery,
  recipientName,
  recipientPhone,
  deliveryAddress,
  className,
  onRefresh
}: DeliveryTimelineProps) {
  const { t, formatDate } = useLanguage()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAllEvents, setShowAllEvents] = useState(false)

  const currentStatusIndex = statusOrder.indexOf(currentStatus)
  const isDelivered = currentStatus === 'delivered'
  const isFailed = currentStatus === 'failed' || currentStatus === 'returned'

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // 배송 진행률 계산
  const progressPercentage = isDelivered 
    ? 100 
    : isFailed 
    ? 0 
    : Math.round((currentStatusIndex / (statusOrder.length - 1)) * 100)

  // 표시할 이벤트 (최근 5개만 표시, 전체보기 클릭시 모두 표시)
  const displayEvents = showAllEvents ? events : events.slice(0, 5)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            배송 추적
          </CardTitle>
          {onRefresh && (
            <AccessibleButton
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              loading={isRefreshing}
              aria-label="배송 정보 새로고침"
            >
              새로고침
            </AccessibleButton>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 현재 상태 요약 */}
        <div className={cn(
          "p-4 rounded-lg",
          statusConfig[currentStatus].bgColor
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-full bg-white", statusConfig[currentStatus].color)}>
                {statusConfig[currentStatus].icon}
              </div>
              <div>
                <p className={cn("font-semibold text-lg", statusConfig[currentStatus].color)}>
                  {statusConfig[currentStatus].label}
                </p>
                {trackingNumber && (
                  <p className="text-sm text-gray-600">
                    운송장: {trackingNumber} ({carrier || '택배사'})
                  </p>
                )}
              </div>
            </div>
            {estimatedDelivery && !isDelivered && !isFailed && (
              <div className="text-right">
                <p className="text-sm text-gray-500">예상 도착일</p>
                <p className="font-medium">{formatDate(estimatedDelivery)}</p>
              </div>
            )}
          </div>
        </div>

        {/* 진행 상태 바 */}
        <div className="relative">
          <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 rounded-full" />
          <div 
            className="absolute top-5 left-0 h-1 bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
          <div className="relative flex justify-between">
            {statusOrder.map((status, index) => {
              const config = statusConfig[status]
              const isPassed = index <= currentStatusIndex
              const isCurrent = status === currentStatus
              
              return (
                <div
                  key={status}
                  className="flex flex-col items-center"
                  role="listitem"
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isPassed ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400",
                      isCurrent && "ring-4 ring-blue-200 scale-110"
                    )}
                  >
                    {config.icon}
                  </div>
                  <p className={cn(
                    "text-xs mt-2 text-center",
                    isPassed ? "text-gray-900 font-medium" : "text-gray-400"
                  )}>
                    {config.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* 배송 정보 */}
        {(recipientName || deliveryAddress) && (
          <>
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">배송 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {recipientName && (
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-500">수령인</p>
                      <p className="font-medium">{recipientName}</p>
                    </div>
                  </div>
                )}
                {recipientPhone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-500">연락처</p>
                      <p className="font-medium">{recipientPhone}</p>
                    </div>
                  </div>
                )}
                {deliveryAddress && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-500">배송지</p>
                      <p className="font-medium">{deliveryAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* 배송 이벤트 목록 */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700">배송 상세 내역</h3>
          <div className="space-y-3">
            {displayEvents.map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  "flex gap-3 p-3 rounded-lg",
                  index === 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-gray-50 dark:bg-gray-800/50"
                )}
              >
                <div className={cn(
                  "mt-0.5",
                  index === 0 ? statusConfig[event.status].color : "text-gray-400"
                )}>
                  {statusConfig[event.status].icon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "font-medium",
                      index === 0 ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                    )}>
                      {event.description}
                    </p>
                    <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                      {statusConfig[event.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(event.timestamp)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 더보기/접기 버튼 */}
          {events.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowAllEvents(!showAllEvents)}
            >
              {showAllEvents ? '접기' : `${events.length - 5}개 더보기`}
            </Button>
          )}
        </div>

        {/* 배송 문의 */}
        {carrier && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">배송 문의</p>
              <Button variant="outline" size="sm">
                {carrier} 고객센터
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}