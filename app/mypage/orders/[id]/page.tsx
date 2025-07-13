'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { db } from '@/lib/db/database-service'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useAuth } from '@/hooks/use-auth'
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Truck,
  DollarSign,
  MessageSquare,
  CheckCircle,
  Clock,
  Globe
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ProgressIndicator } from '@/components/features/order/progress-indicator'

const statusLabels: Record<BuyForMeRequest['status'], string> = {
  pending_review: '검토 대기',
  quote_sent: '견적 발송',
  quote_approved: '견적 승인',
  payment_pending: '결제 대기',
  payment_completed: '결제 완료',
  purchasing: '구매 진행',
  shipping: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소됨'
}

const statusColors: Record<BuyForMeRequest['status'], string> = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  quote_sent: 'bg-blue-100 text-blue-800',
  quote_approved: 'bg-indigo-100 text-indigo-800',
  payment_pending: 'bg-orange-100 text-orange-800',
  payment_completed: 'bg-green-100 text-green-800',
  purchasing: 'bg-purple-100 text-purple-800',
  shipping: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-800'
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentUser } = useAuth()
  const [request, setRequest] = useState<BuyForMeRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadRequest = async () => {
      if (params.id && currentUser) {
        const data = await db.buyForMeRequests.findById(params.id as string)
        // 사용자 본인의 주문인지 확인
        if (data && data.userId === currentUser.id) {
          setRequest(data)
        }
        setIsLoading(false)
      }
    }
    loadRequest()
  }, [params.id, currentUser])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!request) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl text-gray-600">주문을 찾을 수 없습니다.</p>
            <Link href="/mypage">
              <Button className="mt-4">마이페이지로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/mypage">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  마이페이지
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">주문 상세</h1>
            </div>
            <Badge className={statusColors[request.status]}>
              {statusLabels[request.status]}
            </Badge>
          </div>

          {/* 주문 진행 상황 - 개선된 진행 표시기 */}
          <ProgressIndicator currentStatus={request.status} />

          {/* 빠른 액션 버튼들 */}
          {(request.status === 'quote_sent' || request.status === 'payment_pending') && (
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {request.status === 'quote_sent' && (
                    <Link href={`/mypage/orders/${request.id}/quote`} className="flex-1">
                      <Button className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        견적서 확인
                      </Button>
                    </Link>
                  )}
                  {request.status === 'payment_pending' && (
                    <Link href={`/mypage/orders/${request.id}/payment`} className="flex-1">
                      <Button className="w-full">
                        <DollarSign className="w-4 h-4 mr-2" />
                        결제하기
                      </Button>
                    </Link>
                  )}
                  {request.orderInfo?.trackingNumber && (
                    <Button variant="outline" className="flex-1" asChild>
                      <a 
                        href={request.orderInfo.trackingUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        배송 추적
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 상품 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                상품 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {request.productInfo.imageUrl && (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={request.productInfo.imageUrl}
                      alt={request.productInfo.title}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <h3 className="text-lg font-semibold">{request.productInfo.title}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">원가</p>
                      <p className="font-medium">₩{request.productInfo.originalPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">할인가</p>
                      <p className="font-medium text-blue-600">₩{request.productInfo.discountedPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">수량</p>
                      <p className="font-medium">{request.quantity}개</p>
                    </div>
                    <div>
                      <p className="text-gray-500">판매처</p>
                      <p className="font-medium">{request.productInfo.siteName}</p>
                    </div>
                  </div>
                  {request.productOptions && (
                    <div>
                      <p className="text-gray-500 text-sm">상품 옵션</p>
                      <p className="font-medium">{request.productOptions}</p>
                    </div>
                  )}
                </div>
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
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">받는 분</p>
                  <p className="font-medium">{request.shippingInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">연락처</p>
                  <p className="font-medium">{request.shippingInfo.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">배송지</p>
                  <p className="font-medium">
                    {request.shippingInfo.address}<br />
                    {request.shippingInfo.detailAddress}<br />
                    (우) {request.shippingInfo.postalCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 결제 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                결제 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.quote ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>최종 상품 금액</span>
                    <span className="font-medium">₩{request.quote.finalProductPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>서비스 수수료</span>
                    <span className="font-medium">₩{request.quote.serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>배송비</span>
                    <span className="font-medium">{request.quote.domesticShippingFee === 0 ? '무료배송' : `₩${request.quote.domesticShippingFee.toLocaleString()}`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>최종 결제 금액</span>
                    <span className="text-blue-600">₩{request.quote.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">결제 방법</p>
                    <p className="font-medium">
                      {request.quote.paymentMethod === 'credit_card' && '신용카드'}
                      {request.quote.paymentMethod === 'bank_transfer' && '무통장 입금'}
                      {request.quote.paymentMethod === 'paypal' && 'PayPal'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>예상 상품 금액</span>
                    <span className="font-medium">₩{(request.productInfo.discountedPrice * request.quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>예상 서비스 수수료</span>
                    <span className="font-medium">₩{request.estimatedServiceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>배송비</span>
                    <span className="font-medium">{request.productInfo.shippingFee === 0 ? '무료배송' : `₩${request.productInfo.shippingFee.toLocaleString()}`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>예상 총액</span>
                    <span className="text-blue-600">₩{request.estimatedTotalAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    * 실제 금액은 견적서 확인 후 확정됩니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 특별 요청사항 */}
          {request.specialRequests && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  특별 요청사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{request.specialRequests}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}