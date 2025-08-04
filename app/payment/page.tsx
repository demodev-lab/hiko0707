'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { PaymentForm } from '@/components/features/payment/payment-form'
import { SupabaseOrderService } from '@/lib/services/supabase-order-service'
import { SupabaseUserService } from '@/lib/services/supabase-user-service'

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const currency = searchParams.get('currency') || 'KRW'
  const returnUrl = searchParams.get('returnUrl')
  const cancelUrl = searchParams.get('cancelUrl')

  // 주문 정보 조회 - hooks는 항상 최상단에서 호출
  const [order, setOrder] = useState<any>(null)
  const [customerInfo, setCustomerInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 필수 파라미터 확인
  useEffect(() => {
    if (!orderId || !amount) {
      router.push('/404')
      return
    }

    const parsedAmount = parseInt(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      router.push('/404')
    }
  }, [orderId, amount, router])
  
  useEffect(() => {
    async function loadOrderAndUser() {
      if (!orderId) return
      
      try {
        // 주문 정보 조회
        const orderData = await SupabaseOrderService.getRequestById(orderId)
        if (!orderData) {
          router.push('/404')
          return
        }
        setOrder(orderData)
        
        // 사용자 정보 조회
        const userData = await SupabaseUserService.getUserById(orderData.user_id)
        if (userData) {
          setCustomerInfo({
            name: userData.name || orderData.shipping_info?.name,
            email: userData.email || orderData.shipping_info?.email,
            phone: userData.phone || orderData.shipping_info?.phone
          })
        } else {
          setCustomerInfo({
            name: orderData.shipping_info?.name,
            email: orderData.shipping_info?.email,
            phone: orderData.shipping_info?.phone
          })
        }
      } catch (error) {
        console.error('Failed to load order:', error)
        router.push('/404')
      } finally {
        setLoading(false)
      }
    }
    
    loadOrderAndUser()
  }, [orderId, router])

  // 로딩 상태 또는 필수 정보가 없을 때 로딩 화면 표시
  if (loading || !orderId || !amount || !customerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>결제 정보를 불러오는 중...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const parsedAmount = parseInt(amount)

  const handlePaymentSuccess = (paymentId: string) => {
    // 성공 시 리다이렉트
    if (returnUrl) {
      window.location.href = `${returnUrl}?paymentId=${paymentId}`
    } else {
      window.location.href = `/payment/success?paymentId=${paymentId}`
    }
  }

  const handlePaymentCancel = () => {
    // 취소 시 리다이렉트
    if (cancelUrl) {
      window.location.href = cancelUrl
    } else {
      window.location.href = `/payment/cancel?orderId=${orderId}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center">안전한 결제</h1>
          <p className="text-gray-600 text-center mt-2">
            SSL 보안으로 안전하게 보호되는 결제 환경입니다
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
          <PaymentForm
            orderId={orderId}
            amount={parsedAmount}
            currency={currency}
            customerInfo={customerInfo}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </Suspense>

        {/* 보안 안내 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
            256bit SSL 보안 연결
          </p>
          <p>결제 정보는 암호화되어 안전하게 전송됩니다</p>
          <p className="mt-1">PCI DSS 표준을 준수하는 보안 시스템입니다</p>
        </div>
      </div>
    </div>
  )
}