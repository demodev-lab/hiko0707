'use client'

import { useParams } from 'next/navigation'
import { useSupabaseOrderDetail } from '@/hooks/use-supabase-order'
import { Order } from '@/types/order'
import { OrderTracking } from '@/components/features/order/order-tracking'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loading } from '@/components/ui/loading'
import { 
  ArrowLeft, Package, Truck, CreditCard, MapPin, 
  Calendar, ShoppingBag, Phone, Mail, User,
  Copy, Download, MessageCircle, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

export default function OrderDetailPage() {
  const params = useParams()
  const { order, isLoading: loading, error } = useSupabaseOrderDetail(params.id as string)

  if (error) {
    console.error('Failed to load order:', error)
    toast.error('주문 정보를 불러올 수 없습니다')
  }

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber)
      toast.success('주문번호가 복사되었습니다')
    }
  }

  const downloadReceipt = () => {
    toast.info('영수증 다운로드 기능은 준비 중입니다')
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'purchasing': return 'bg-yellow-100 text-yellow-800'
      case 'shipping': return 'bg-indigo-100 text-indigo-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return '주문확인'
      case 'purchasing': return '구매중'
      case 'shipping': return '배송중'
      case 'delivered': return '배송완료'
      case 'cancelled': return '취소됨'
      default: return status
    }
  }

  if (loading) {
    return <Loading message="주문 정보를 불러오는 중..." />
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold mb-2">주문을 찾을 수 없습니다</h1>
        <p className="text-gray-600 mb-8">요청하신 주문 정보가 없습니다.</p>
        <Button asChild>
          <Link href="/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            주문 목록으로
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/orders">
                <ArrowLeft className="w-4 h-4 mr-2" />
                주문 목록
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">주문 상세</h1>
              <p className="text-gray-600">주문번호: {order.orderNumber}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyOrderNumber}>
              <Copy className="w-4 h-4 mr-2" />
              주문번호 복사
            </Button>
            <Button variant="outline" size="sm" onClick={downloadReceipt}>
              <Download className="w-4 h-4 mr-2" />
              영수증 다운로드
            </Button>
          </div>
        </div>

        {/* Order Status */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">주문일시</p>
                <p className="text-lg font-medium">
                  {format(new Date(order.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                </p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {getStatusText(order.status)}
              </Badge>
            </div>
            
            {/* Order Tracking Component */}
            <OrderTracking order={order} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  주문 상품
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        {item.productUrl && (
                          <a 
                            href={item.productUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            상품 링크 보기
                          </a>
                        )}
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            수량: {item.quantity}개
                          </p>
                          {item.options && Object.keys(item.options).length > 0 && (
                            <p className="text-sm text-gray-600">
                              옵션: {Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(', ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-sm text-gray-600">
                              메모: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₩{(item.price * item.quantity).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">개당 ₩{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  배송 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">받는 사람</p>
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">연락처</p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {order.shippingAddress.phoneNumber}
                  </p>
                  <p className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {order.shippingAddress.email}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">배송지</p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>
                      {order.shippingAddress.addressLine1}<br />
                      {order.shippingAddress.addressLine2 && (
                        <>{order.shippingAddress.addressLine2}<br /></>
                      )}
                      {order.shippingAddress.postalCode}
                    </span>
                  </p>
                </div>
                

                {order.internationalTrackingNumber && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">국제 운송장 번호</p>
                    <p className="font-medium">{order.internationalTrackingNumber}</p>
                  </div>
                )}
                {order.koreanTrackingNumber && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">한국 운송장 번호</p>
                    <p className="font-medium">{order.koreanTrackingNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  결제 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">상품 금액</span>
                    <span>₩{order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">대행 수수료</span>
                    <span>₩{order.serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">국내 배송비</span>
                    <span>₩{order.domesticShippingFee.toLocaleString()}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>총 결제금액</span>
                    <span>₩{order.totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-sm text-gray-600">결제 방법</p>
                    <p className="font-medium">
                      {order.paymentMethod === 'card' && '신용/체크카드'}
                      {order.paymentMethod === 'bank_transfer' && '계좌이체'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Notes */}
            {order.customerNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    고객 메모
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.customerNotes}</p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {order.status === 'confirmed' && (
                <Button variant="destructive" className="w-full">
                  주문 취소
                </Button>
              )}
              
              <Button variant="outline" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                문의하기
              </Button>
              
              {order.status === 'delivered' && (
                <Button variant="outline" className="w-full">
                  재주문하기
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}