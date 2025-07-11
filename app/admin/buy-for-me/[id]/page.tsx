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
  Edit,
  CheckCircle,
  Clock,
  ShoppingBag,
  Globe
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useBuyForMeAdmin } from '@/hooks/use-buy-for-me'
import { toast } from 'sonner'

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

export default function BuyForMeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { updateStatus } = useBuyForMeAdmin()
  const [request, setRequest] = useState<BuyForMeRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadRequest = async () => {
      if (params.id) {
        const data = await db.buyForMeRequests.findById(params.id as string)
        setRequest(data)
        setIsLoading(false)
      }
    }
    loadRequest()
  }, [params.id])

  const handleStatusUpdate = (newStatus: BuyForMeRequest['status']) => {
    if (!request) return
    
    updateStatus({ requestId: request.id, status: newStatus }, {
      onSuccess: () => {
        setRequest({ ...request, status: newStatus })
      }
    })
  }

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
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
      <ProtectedRoute requiredRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl text-gray-600">요청을 찾을 수 없습니다.</p>
            <Link href="/admin/buy-for-me">
              <Button className="mt-4">목록으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/buy-for-me">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                목록으로
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Buy for Me 요청 상세</h1>
          </div>
          <Badge className={statusColors[request.status]}>
            {statusLabels[request.status]}
          </Badge>
        </div>

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
                <div className="flex items-center gap-2 mt-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a 
                    href={request.productInfo.originalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    원본 상품 페이지 보기
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 고객 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              고객 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{request.shippingInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{request.shippingInfo.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{request.shippingInfo.email}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p>{request.shippingInfo.address}</p>
                    <p>{request.shippingInfo.detailAddress}</p>
                    <p className="text-sm text-gray-500">우편번호: {request.shippingInfo.postalCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 요청 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              요청 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                요청일: {format(new Date(request.requestDate), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
              </span>
            </div>
            {request.specialRequests && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  특별 요청사항
                </p>
                <p className="text-sm">{request.specialRequests}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 비용 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              비용 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>상품 금액 (₩{request.productInfo.discountedPrice.toLocaleString()} × {request.quantity})</span>
                <span className="font-medium">₩{(request.productInfo.discountedPrice * request.quantity).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>예상 서비스 수수료</span>
                <span className="font-medium">₩{request.estimatedServiceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>국내 배송비</span>
                <span className="font-medium">₩{request.productInfo.shippingFee.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>예상 총액</span>
                <span className="text-blue-600">₩{request.estimatedTotalAmount.toLocaleString()}</span>
              </div>
            </div>
            
            {request.quote && (
              <>
                <Separator className="my-6" />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    견적서
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>최종 상품 금액</span>
                      <span>₩{request.quote.finalProductPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>서비스 수수료</span>
                      <span>₩{request.quote.serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>국내 배송비</span>
                      <span>₩{request.quote.domesticShippingFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>국제 배송비</span>
                      <span>₩{request.quote.internationalShippingFee.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>최종 견적 금액</span>
                      <span className="text-blue-600">₩{request.quote.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-2">
              {request.status === 'pending_review' && (
                <Link href={`/admin/buy-for-me/${request.id}/quote`}>
                  <Button>
                    <FileText className="w-4 h-4 mr-2" />
                    견적서 작성
                  </Button>
                </Link>
              )}
              
              {request.status === 'quote_approved' && (
                <Button 
                  onClick={() => handleStatusUpdate('payment_pending')}
                  variant="outline"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  결제 대기로 변경
                </Button>
              )}
              
              {request.status === 'payment_completed' && (
                <Button 
                  onClick={() => handleStatusUpdate('purchasing')}
                  variant="outline"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  구매 진행 시작
                </Button>
              )}
              
              {request.status === 'purchasing' && (
                <Link href={`/admin/buy-for-me/${request.id}/tracking`}>
                  <Button variant="outline">
                    <Truck className="w-4 h-4 mr-2" />
                    배송 정보 입력
                  </Button>
                </Link>
              )}
              
              {request.status === 'shipping' && (
                <Button 
                  onClick={() => handleStatusUpdate('delivered')}
                  variant="outline"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  배송 완료로 변경
                </Button>
              )}
              
              {!['delivered', 'cancelled'].includes(request.status) && (
                <Button 
                  onClick={() => handleStatusUpdate('cancelled')}
                  variant="destructive"
                >
                  요청 취소
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 주문 정보 (있는 경우) */}
        {request.orderInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                주문 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">실제 주문번호</p>
                  <p className="font-medium">{request.orderInfo.actualOrderId}</p>
                </div>
                <div>
                  <p className="text-gray-500">주문일</p>
                  <p className="font-medium">
                    {format(new Date(request.orderInfo.orderDate), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
              {request.orderInfo.trackingNumber && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">배송 추적 정보</p>
                  <p className="font-mono text-lg">{request.orderInfo.trackingNumber}</p>
                  {request.orderInfo.trackingUrl && (
                    <a 
                      href={request.orderInfo.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      배송 추적하기
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}