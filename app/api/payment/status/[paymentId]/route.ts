import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/database-service'

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
    const payment = await db.payments.findById(paymentId)
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' }, 
        { status: 404 }
      )
    }

    // 민감한 정보 제외하고 반환
    const safePayment = {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      status: payment.status,
      paidAmount: payment.paidAmount,
      fees: payment.fees,
      netAmount: payment.netAmount,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      paidAt: payment.paidAt,
      failedAt: payment.failedAt,
      cancelledAt: payment.cancelledAt,
      refundedAt: payment.refundedAt,
      failureReason: payment.failureReason,
      cancelReason: payment.cancelReason,
      refundReason: payment.refundReason,
      refundAmount: payment.refundAmount
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