'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { db } from '@/lib/db/database-service'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { useBuyForMe } from '@/hooks/use-buy-for-me'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ArrowLeft,
  FileText,
  DollarSign,
  CreditCard,
  CheckCircle,
  Info,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function QuoteConfirmPage() {
  const params = useParams()
  const router = useRouter()
  const { currentUser } = useAuth()
  const { approveQuote } = useBuyForMe()
    const [request, setRequest] = useState<BuyForMeRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    const loadRequest = async () => {
      if (params.id && currentUser) {
        const data = await db.buyForMeRequests.findById(params.id as string)
        // 사용자 본인의 주문이고 견적서가 있는지 확인
        if (data && data.userId === currentUser.id && data.quote && data.status === 'quote_sent') {
          setRequest(data)
        }
        setIsLoading(false)
      }
    }
    loadRequest()
  }, [params.id, currentUser])

  const handleApproveQuote = async () => {
    if (!request) return
    
    setIsApproving(true)
    try {
      await approveQuote(request.id)
      toast.success('견적이 승인되었습니다. 결제 페이지로 이동합니다.')
      // 결제 페이지로 이동
      router.push(`/mypage/orders/${request.id}/payment`)
    } catch (error) {
      toast.error('견적 승인 중 오류가 발생했습니다.')
    } finally {
      setIsApproving(false)
    }
  }

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

  if (!request || !request.quote) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl text-gray-600">견적서를 찾을 수 없습니다.</p>
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
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/mypage/orders/${request.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  주문 상세로
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">견적서 확인</h1>
            </div>
          </div>

          {/* 견적서 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                견적서
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                견적 발송일: {format(new Date(request.quote.quoteSentDate), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 비용 내역 */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  비용 내역
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
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
                </div>
              </div>

              {/* 결제 방법 */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  결제 방법
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">
                    {request.quote.paymentMethod === 'card' && '신용카드 (온라인 결제)'}
                    {request.quote.paymentMethod === 'bank_transfer' && '무통장 입금'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    견적을 승인하시면 선택하신 결제 방법에 대한 상세 안내를 드립니다.
                  </p>
                </div>
              </div>
              
              {/* 추가 안내사항 */}
              {request.quote.notes && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    추가 안내사항
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">{request.quote.notes}</p>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* 주의사항 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>견적 승인 전 확인사항</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>견적서에 표시된 금액은 최종 금액입니다.</li>
                <li>견적 승인 후에는 취소가 어려울 수 있습니다.</li>
                <li>결제 완료 후 바로 구매가 진행됩니다.</li>
                <li>배송은 평균 7-14일 소요됩니다.</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* 승인 버튼 */}
          <div className="flex gap-3 justify-end">
            <Link href={`/mypage/orders/${request.id}`}>
              <Button variant="outline">
                다시 확인하기
              </Button>
            </Link>
            <Button 
              onClick={handleApproveQuote}
              disabled={isApproving}
              className="min-w-[120px]"
            >
              {isApproving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  처리 중...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  견적 승인
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}