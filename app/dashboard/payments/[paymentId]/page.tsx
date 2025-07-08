import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { PaymentStatus } from '@/components/features/payment/payment-status'
import { db } from '@/lib/db/database-service'

interface PaymentDetailPageProps {
  params: Promise<{ paymentId: string }>
}

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { paymentId } = await params

  if (!paymentId) {
    redirect('/dashboard/payments')
  }

  // 결제 정보 조회
  const payment = await db.payments.findById(paymentId)
  
  if (!payment) {
    redirect('/dashboard/payments')
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