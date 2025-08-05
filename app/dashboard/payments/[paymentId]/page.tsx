import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { PaymentStatus } from '@/components/features/payment/payment-status'
import { SupabasePaymentService } from '@/lib/services/supabase-payment-service'
import { Payment, PaymentProvider } from '@/types/payment'

interface PaymentDetailPageProps {
  params: Promise<{ paymentId: string }>
}

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { paymentId } = await params

  if (!paymentId) {
    redirect('/dashboard/payments')
  }

  // 결제 정보 조회
  const paymentData = await SupabasePaymentService.getPaymentById(paymentId)
  
  if (!paymentData) {
    redirect('/dashboard/payments')
  }
  
  // Supabase 데이터를 Payment 타입으로 변환
  const payment: Payment = {
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
    paymentRequestId: paymentData.id, // Payment request ID is the same as payment ID in this context
    paymentMethodId: paymentData.payment_method || 'card' // Using payment method as payment method ID
  }

  const handleGoBack = () => {
    window.location.href = '/dashboard/payments'
  }

  const handleRetry = () => {
    window.location.href = `/payment?orderId=${payment.orderId}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">결제 상세</h1>
        <p className="text-gray-600 mt-1">
          결제 ID: {paymentId}
        </p>
      </div>

      <Suspense fallback={
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>결제 정보를 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      }>
        <PaymentStatus
          payment={payment}
          onGoBack={handleGoBack}
          onRetry={payment.status === 'failed' ? handleRetry : undefined}
        />
      </Suspense>
    </div>
  )
}