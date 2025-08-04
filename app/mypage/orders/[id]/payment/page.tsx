'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SupabaseOrderService } from '@/lib/services/supabase-order-service'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { useClerkRole } from '@/hooks/use-clerk-role'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Info,
  ExternalLink,
  Copy,
  CheckCircle,
  Building2,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useClerkRole()
  const { user: currentUser } = useSupabaseUser()
  const [request, setRequest] = useState<BuyForMeRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadRequest = async () => {
      if (params.id && currentUser) {
        const data = await SupabaseOrderService.getOrderById(params.id as string) as any
        // 사용자 본인의 주문이고 결제 대기 상태인지 확인
        if (data && data.user_id === currentUser.id && data.quotes && data.quotes.length > 0 && 
            ['quote_approved', 'payment_pending'].includes(data.status)) {
          // Supabase 데이터를 BuyForMeRequest 형태로 변환
          const transformedData = {
            ...data,
            userId: data.user_id,
            quote: {
              finalProductPrice: data.quotes[0].product_cost,
              serviceFee: data.quotes[0].fee,
              domesticShippingFee: data.quotes[0].domestic_shipping,
              totalAmount: data.quotes[0].total_amount,
              paymentMethod: data.quotes[0].payment_method,
              paymentLink: null // Supabase에는 이 필드가 없음
            }
          }
          setRequest(transformedData as any)
        }
        setIsLoading(false)
      }
    }
    loadRequest()
  }, [params.id, currentUser])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('클립보드에 복사되었습니다')
    setTimeout(() => setCopied(false), 2000)
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
            <p className="text-xl text-gray-600">결제 정보를 찾을 수 없습니다.</p>
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
              <h1 className="text-2xl font-bold">결제 안내</h1>
            </div>
            <Badge className="bg-orange-100 text-orange-800">
              결제 대기
            </Badge>
          </div>

          {/* 결제 금액 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                결제 금액
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>총 결제 금액</span>
                    <span className="text-blue-600">₩{request.quote.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 결제 방법별 안내 */}
          {request.quote.paymentMethod === 'card' && request.quote.paymentLink ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  신용카드 결제
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  아래 버튼을 클릭하여 안전한 결제 페이지로 이동합니다.
                </p>
                <a 
                  href={request.quote.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full" size="lg">
                    <CreditCard className="w-5 h-5 mr-2" />
                    결제하기
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">결제 링크:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white p-2 rounded border text-xs break-all">
                      {request.quote.paymentLink}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(request.quote!.paymentLink!)}
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  무통장 입금
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>입금 계좌 정보</AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <div className="bg-white p-4 rounded-lg border space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">은행명</span>
                        <span className="font-medium">신한은행</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">계좌번호</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">110-123-456789</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard('110123456789')}
                          >
                            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">예금주</span>
                        <span className="font-medium">(주)하이코</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">입금액</span>
                        <span className="font-medium text-blue-600">
                          ₩{request.quote.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      * 입금자명은 주문자 성함으로 입금해주세요<br />
                      * 입금 확인 후 1-2시간 내에 구매가 진행됩니다
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* 주의사항 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>결제 안내</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>결제 완료 후 자동으로 구매가 진행됩니다</li>
                <li>결제 확인은 영업시간 기준 1-2시간 소요됩니다</li>
                <li>주문 취소는 구매 전까지만 가능합니다</li>
                <li>문의사항은 카카오톡 채널로 연락주세요</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* 문의 버튼 */}
          <div className="flex justify-center">
            <a
              href="https://pf.kakao.com/_xxxxxK"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                카카오톡 문의하기
              </Button>
            </a>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}