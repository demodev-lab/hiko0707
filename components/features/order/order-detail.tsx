'use client'

import { Order } from '@/types/order'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/i18n/context'
import { formatDistanceToNow, format } from 'date-fns'
import { ko, enUS, zhCN, ja, vi, th } from 'date-fns/locale'
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CreditCard, 
  MapPin, 
  Clock, 
  ExternalLink,
  Phone,
  Mail,
  Copy,
  CheckCircle
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface OrderDetailProps {
  order: Order
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

export function OrderDetail({ order }: OrderDetailProps) {
  const { t, language } = useLanguage()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const getStatusBadge = (status: Order['status']) => {
    return (
      <Badge className={statusColors[status]} variant="secondary">
        {t(`order.status.${status}`)}
      </Badge>
    )
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-'
    
    const locale = dateLocales[language as keyof typeof dateLocales] || dateLocales.ko
    try {
      return format(new Date(date), 'PPP p', { locale })
    } catch {
      return new Date(date).toLocaleDateString()
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('클립보드에 복사되었습니다')
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  // 주문 진행 단계
  const orderSteps = [
    { key: 'createdAt', label: '주문 접수', status: 'pending' },
    { key: 'confirmedAt', label: '주문 확인', status: 'confirmed' },
    { key: 'purchasedAt', label: '구매 완료', status: 'purchasing' },
    { key: 'shippedAt', label: '배송 시작', status: 'shipping' },
    { key: 'deliveredAt', label: '배송 완료', status: 'delivered' }
  ]

  const getCurrentStepIndex = () => {
    const statusOrder = ['pending', 'confirmed', 'purchasing', 'shipping', 'delivered']
    return statusOrder.indexOf(order.status)
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('action.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">주문 상세</h1>
            <p className="text-gray-600">주문번호: {order.orderNumber}</p>
          </div>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽 컬럼 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 주문 진행 상황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                주문 진행 상황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex
                  const date = order[step.key as keyof Order] as Date | undefined
                  
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                          {step.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {date ? formatDate(date) : (isCompleted ? '처리 중' : '대기 중')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 상품 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                주문 상품
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.productName}</h3>
                      {item.productUrl && (
                        <a 
                          href={item.productUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          상품 페이지 보기
                        </a>
                      )}
                      <div className="mt-2 text-sm text-gray-600">
                        <p>수량: {item.quantity}개</p>
                        <p>단가: ₩{item.price.toLocaleString()}</p>
                        <p>소계: ₩{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                      {item.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>요청사항:</strong> {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 배송 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                배송 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">배송지</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>받는 분:</strong> {order.shippingAddress.fullName}</p>
                  <p><strong>연락처:</strong> {order.shippingAddress.phone}</p>
                  <p><strong>이메일:</strong> {order.shippingAddress.email}</p>
                  <p><strong>주소:</strong> {order.shippingAddress.address}</p>
                  {order.shippingAddress.address_detail && (
                    <p className="ml-4">{order.shippingAddress.address_detail}</p>
                  )}
                  <p>{order.shippingAddress.post_code}</p>
                </div>
              </div>

              <Separator />


              {/* 배송 추적 */}
              {(order.koreanTrackingNumber || order.internationalTrackingNumber) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">배송 추적</h4>
                    <div className="space-y-2">
                      {order.koreanTrackingNumber && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">한국 내 배송</p>
                            <p className="text-xs text-gray-600">{order.koreanTrackingNumber}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(order.koreanTrackingNumber!, 'korean')}
                          >
                            {copiedField === 'korean' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                      {order.internationalTrackingNumber && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">국제 배송</p>
                            <p className="text-xs text-gray-600">{order.internationalTrackingNumber}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(order.internationalTrackingNumber!, 'international')}
                          >
                            {copiedField === 'international' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽 컬럼 */}
        <div className="space-y-6">
          {/* 결제 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                결제 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>{t('order.cost.subtotal')}</span>
                <span>₩{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('order.cost.serviceFee')}</span>
                <span>₩{order.serviceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('order.cost.domesticShipping')}</span>
                <span>₩{order.domesticShippingFee.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>{t('order.cost.total')}</span>
                <span>₩{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="pt-2 text-sm text-gray-600">
                <p>결제 방법: {t(`order.payment.${order.paymentMethod}`)}</p>
              </div>
            </CardContent>
          </Card>

          {/* 연락처 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                고객 지원
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p>주문 관련 문의사항이 있으시면 언제든지 연락해주세요.</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:support@hiko.kr" className="text-blue-600 hover:underline">
                    support@hiko.kr
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+82-2-1234-5678</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 고객 요청사항 */}
          {order.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle>고객 요청사항</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {order.customerNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 관리자 메모 */}
          {order.adminNotes && (
            <Card>
              <CardHeader>
                <CardTitle>관리자 메모</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">
                  {order.adminNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}