'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { PaymentStatus } from '@/components/features/payment/payment-status'
import { SupabasePaymentService } from '@/lib/services/supabase-payment-service'
import { Payment, PaymentProvider } from '@/types/payment'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPayment() {
      if (!paymentId) {
        router.push('/404')
        return
      }

      try {
        const paymentData = await SupabasePaymentService.getPaymentById(paymentId)
        if (!paymentData) {
          router.push('/404')
          return
        }
        
        // Supabase 데이터를 Payment 타입으로 변환
        const transformedPayment: Payment = {
          id: paymentData.id,
          orderId: paymentData.request_id,
          userId: paymentData.user_id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          provider: (paymentData.payment_method || 'card') as PaymentProvider,
          status: paymentData.status as Payment['status'],
          createdAt: new Date(paymentData.created_at),
          updatedAt: new Date(paymentData.updated_at),
          externalPaymentId: paymentData.external_payment_id || undefined,
          paidAt: paymentData.paid_at ? new Date(paymentData.paid_at) : undefined,
          metadata: {},
          paymentRequestId: paymentData.id,
          paymentMethodId: paymentData.payment_method || 'card'
        }
        
        setPayment(transformedPayment)
      } catch (error) {
        console.error('Failed to load payment:', error)
        router.push('/404')
      } finally {
        setLoading(false)
      }
    }

    loadPayment()
  }, [paymentId, router])

  const handleGoBack = () => {
    router.push('/orders')
  }

  if (loading || !payment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>결제 상태를 확인하는 중...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">결제 완료!</h1>
          <p className="text-gray-600">
            결제가 성공적으로 처리되었습니다
          </p>
        </div>

        {/* Payment Details */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">결제 번호</span>
                <span className="font-medium">{payment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">주문 번호</span>
                <span className="font-medium">{payment.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제 금액</span>
                <span className="font-medium">
                  {payment.currency === 'KRW' ? '₩' : '$'}
                  {payment.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제 방법</span>
                <span className="font-medium">{payment.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제 일시</span>
                <span className="font-medium">
                  {new Date(payment.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">다음 단계</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="text-sm text-blue-700 space-y-2 text-left">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>주문 확인 메일을 발송해 드렸습니다</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>담당자가 24시간 이내에 주문을 확인합니다</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>상품 구매가 시작되면 알림을 받으실 수 있습니다</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>마이페이지에서 실시간 진행 상황을 확인하세요</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/order/${payment.orderId}`}>
              주문 상세 보기
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/orders">
              주문 목록으로
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}