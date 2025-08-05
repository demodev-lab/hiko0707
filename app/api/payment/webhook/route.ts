import { NextRequest, NextResponse } from 'next/server'
import { SupabasePaymentService } from '@/lib/services/supabase-payment-service'
import { SupabaseOrderService } from '@/lib/services/supabase-order-service'
import { paymentService } from '@/lib/services/payment-service'
import { PaymentStatus } from '@/types/payment'

// 웹훅으로 결제 상태 업데이트를 받는 API
export async function POST(request: NextRequest) {
  try {
    // 웹훅 시크릿 검증 (실제 환경에서는 반드시 구현)
    const webhookSecret = request.headers.get('x-webhook-secret')
    const expectedSecret = process.env.WEBHOOK_SECRET || 'default-secret'
    
    if (webhookSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      externalTransactionId, 
      status, 
      provider,
      amount,
      currency,
      metadata 
    } = body

    if (!externalTransactionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // 유효한 상태인지 확인
    const validStatuses: PaymentStatus[] = [
      'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
    ]
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid payment status' }, 
        { status: 400 }
      )
    }

    // 기존 결제 조회
    const existingPayment = await SupabasePaymentService.getPaymentByExternalId(externalTransactionId)
    
    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' }, 
        { status: 404 }
      )
    }

    // 이미 최종 상태인 경우 업데이트 거부
    const finalStatuses: PaymentStatus[] = ['completed', 'failed', 'cancelled', 'refunded']
    if (finalStatuses.includes(existingPayment.status as PaymentStatus) && existingPayment.status !== status) {
      return NextResponse.json(
        { error: 'Payment already in final state' }, 
        { status: 409 }
      )
    }

    // PaymentService를 통해 상태 업데이트
    try {
      const updatedPayment = await paymentService.updatePaymentStatus(
        externalTransactionId,
        status,
        metadata
      )

      // Supabase에 결제 상태 업데이트
      await SupabasePaymentService.updatePaymentStatus(
        existingPayment.id, 
        status,
        undefined, // externalPaymentId는 이미 설정되어 있음
        status === 'completed' ? new Date().toISOString() : undefined
      )

      // 주문 상태도 함께 업데이트 (결제 완료 시)
      if (status === 'completed' && existingPayment.request_id) {
        try {
          await SupabaseOrderService.updateOrderStatus(
            existingPayment.request_id, 
            'payment_completed',
            'webhook' // changedBy parameter
          )
        } catch (orderError) {
          console.error('Failed to update order status:', orderError)
          // 주문 상태 업데이트 실패는 결제 상태 업데이트를 막지 않음
        }
      }

      // 성공 응답
      return NextResponse.json({
        success: true,
        paymentId: existingPayment.id,
        status: status,
        message: 'Payment status updated successfully'
      })

    } catch (serviceError) {
      console.error('PaymentService error:', serviceError)
      return NextResponse.json(
        { error: 'Failed to update payment status' }, 
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// GET 요청은 허용하지 않음
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  )
}

// 기타 메서드들도 허용하지 않음
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}