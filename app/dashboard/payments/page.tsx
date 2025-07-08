import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { PaymentHistory } from '@/components/features/payment/payment-history'

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">결제 관리</h1>
        <p className="text-gray-600 mt-1">
          결제 내역을 확인하고 관리할 수 있습니다
        </p>
      </div>

      <Suspense fallback={
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>결제 내역을 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      }>
        <PaymentHistory />
      </Suspense>
    </div>
  )
}