import { NextRequest, NextResponse } from 'next/server'
import { SupabasePaymentService } from '@/lib/services/supabase-payment-service'

interface RouteContext {
  params: Promise<{ paymentId: string }>
}

// 결제 상태 조회 API
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { paymentId } = await context.params

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' }, 
        { status: 400 }
      )
    }

    // 결제 정보 조회
    const payment = await SupabasePaymentService.getPaymentById(paymentId)
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' }, 
        { status: 404 }
      )
    }

    // 민감한 정보 제외하고 반환 (snake_case를 camelCase로 변환)
    const safePayment = {
      id: payment.id,
      orderId: payment.request_id, // request_id를 orderId로 매핑
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.payment_method, // payment_method를 provider로 매핑
      status: payment.status,
      paidAmount: payment.amount, // Supabase 스키마에는 paid_amount가 없으므로 amount 사용
      fees: 0, // Supabase 스키마에는 fees가 없음
      netAmount: payment.amount, // Supabase 스키마에는 net_amount가 없음
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      paidAt: payment.paid_at,
      failedAt: null, // Supabase 스키마에는 failed_at이 없음
      cancelledAt: null, // Supabase 스키마에는 cancelled_at이 없음
      refundedAt: null, // Supabase 스키마에는 refunded_at이 없음
      failureReason: null, // Supabase 스키마에는 failure_reason이 없음
      cancelReason: null, // Supabase 스키마에는 cancel_reason이 없음
      refundReason: null, // Supabase 스키마에는 refund_reason이 없음
      refundAmount: 0 // Supabase 스키마에는 refund_amount가 없음
    }

    return NextResponse.json(safePayment)

  } catch (error) {
    console.error('Error fetching payment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// 기타 메서드는 허용하지 않음
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}