import { BaseRepository } from './base-repository'
import { Payment, PaymentRequest, PaymentStatus } from '@/types/payment'

export interface PaymentFilter {
  userId?: string
  orderId?: string
  status?: PaymentStatus
  provider?: string
  dateFrom?: Date
  dateTo?: Date
}

export class PaymentRepository extends BaseRepository<Payment> {
  protected tableName = 'payments'

  // 주문별 결제 내역 조회
  async findByOrderId(orderId: string): Promise<Payment[]> {
    const payments = await this.findAll()
    return payments.filter(payment => payment.orderId === orderId)
  }

  // 사용자별 결제 내역 조회
  async findByUserId(userId: string): Promise<Payment[]> {
    const payments = await this.findAll()
    return payments.filter(payment => payment.userId === userId)
  }

  // 외부 거래 ID로 결제 조회
  async findByExternalTransactionId(externalTransactionId: string): Promise<Payment | null> {
    const payments = await this.findAll()
    return payments.find(payment => 
      payment.externalTransactionId === externalTransactionId
    ) || null
  }

  // 결제 요청 ID로 결제 조회
  async findByPaymentRequestId(paymentRequestId: string): Promise<Payment | null> {
    const payments = await this.findAll()
    return payments.find(payment => 
      payment.paymentRequestId === paymentRequestId
    ) || null
  }

  // 상태별 결제 조회
  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    const payments = await this.findAll()
    return payments.filter(payment => payment.status === status)
  }

  // 필터 조건으로 결제 조회
  async findByFilter(filter: PaymentFilter): Promise<Payment[]> {
    const payments = await this.findAll()
    
    return payments.filter(payment => {
      if (filter.userId && payment.userId !== filter.userId) return false
      if (filter.orderId && payment.orderId !== filter.orderId) return false
      if (filter.status && payment.status !== filter.status) return false
      if (filter.provider && payment.provider !== filter.provider) return false
      if (filter.dateFrom && payment.createdAt < filter.dateFrom) return false
      if (filter.dateTo && payment.createdAt > filter.dateTo) return false
      return true
    })
  }

  // 결제 상태 업데이트
  async updateStatus(id: string, status: PaymentStatus, metadata?: Record<string, any>): Promise<Payment | null> {
    const payment = await this.findById(id)
    if (!payment) return null

    const updates: Partial<Payment> = { 
      status, 
      updatedAt: new Date(),
      metadata: { ...payment.metadata, ...metadata }
    }

    // 상태에 따른 타임스탬프 설정
    const now = new Date()
    switch (status) {
      case 'completed':
        updates.paidAt = now
        break
      case 'failed':
        updates.failedAt = now
        break
      case 'cancelled':
        updates.cancelledAt = now
        break
      case 'refunded':
        updates.refundedAt = now
        break
    }

    return this.update(id, updates)
  }

  // 환불 처리
  async processRefund(id: string, refundAmount: number, refundReason: string): Promise<Payment | null> {
    const payment = await this.findById(id)
    if (!payment) return null

    if (payment.status !== 'completed') {
      throw new Error('Cannot refund uncompleted payment')
    }

    if (refundAmount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount')
    }

    const updates: Partial<Payment> = {
      status: 'refunded',
      refundAmount,
      refundReason,
      updatedAt: new Date(),
      refundedAt: new Date()
    }

    return this.update(id, updates)
  }

  // 결제 취소
  async cancelPayment(id: string, cancelReason: string): Promise<Payment | null> {
    const payment = await this.findById(id)
    if (!payment) return null

    if (payment.status !== 'pending' && payment.status !== 'processing') {
      throw new Error('Cannot cancel payment with current status')
    }

    const updates: Partial<Payment> = {
      status: 'cancelled',
      cancelReason,
      updatedAt: new Date(),
      cancelledAt: new Date()
    }

    return this.update(id, updates)
  }

  // 사용자의 성공한 결제 총액 계산
  async getTotalPaidAmountByUser(userId: string): Promise<number> {
    const payments = await this.findByUserId(userId)
    return payments
      .filter(payment => payment.status === 'completed')
      .reduce((total, payment) => total + (payment.paidAmount || 0), 0)
  }

  // 기간별 결제 통계
  async getPaymentStatsByDateRange(dateFrom: Date, dateTo: Date): Promise<{
    totalAmount: number
    totalFees: number
    successfulPayments: number
    failedPayments: number
    refundedAmount: number
  }> {
    const payments = await this.findByFilter({ dateFrom, dateTo })

    const stats = {
      totalAmount: 0,
      totalFees: 0,
      successfulPayments: 0,
      failedPayments: 0,
      refundedAmount: 0
    }

    payments.forEach(payment => {
      if (payment.status === 'completed') {
        stats.totalAmount += payment.paidAmount || 0
        stats.totalFees += payment.fees || 0
        stats.successfulPayments++
      } else if (payment.status === 'failed') {
        stats.failedPayments++
      } else if (payment.status === 'refunded') {
        stats.refundedAmount += payment.refundAmount || 0
      }
    })

    return stats
  }

  // 결제 방법별 통계
  async getPaymentStatsByProvider(): Promise<Record<string, {
    count: number
    totalAmount: number
    successRate: number
  }>> {
    const payments = await this.findAll()
    const stats: Record<string, { count: number; totalAmount: number; successCount: number }> = {}

    payments.forEach(payment => {
      if (!stats[payment.provider]) {
        stats[payment.provider] = { count: 0, totalAmount: 0, successCount: 0 }
      }

      stats[payment.provider].count++
      
      if (payment.status === 'completed') {
        stats[payment.provider].totalAmount += payment.paidAmount || 0
        stats[payment.provider].successCount++
      }
    })

    // 성공률 계산
    const result: Record<string, { count: number; totalAmount: number; successRate: number }> = {}
    Object.entries(stats).forEach(([provider, data]) => {
      result[provider] = {
        count: data.count,
        totalAmount: data.totalAmount,
        successRate: data.count > 0 ? (data.successCount / data.count) * 100 : 0
      }
    })

    return result
  }
}

export class PaymentRequestRepository extends BaseRepository<PaymentRequest> {
  protected tableName = 'payment_requests'

  // 주문별 결제 요청 조회
  async findByOrderId(orderId: string): Promise<PaymentRequest[]> {
    const requests = await this.findAll()
    return requests.filter(request => request.orderId === orderId)
  }

  // 사용자별 결제 요청 조회
  async findByUserId(userId: string): Promise<PaymentRequest[]> {
    const requests = await this.findAll()
    return requests.filter(request => request.userId === userId)
  }

  // 만료된 결제 요청 조회
  async findExpiredRequests(): Promise<PaymentRequest[]> {
    const requests = await this.findAll()
    const now = new Date()
    
    return requests.filter(request => 
      request.expiresAt && request.expiresAt < now
    )
  }

  // 만료된 결제 요청 정리
  async cleanupExpiredRequests(): Promise<number> {
    const expiredRequests = await this.findExpiredRequests()
    
    for (const request of expiredRequests) {
      await this.delete(request.id)
    }
    
    return expiredRequests.length
  }
}