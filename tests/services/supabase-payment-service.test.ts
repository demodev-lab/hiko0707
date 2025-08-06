import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock query results storage - 전역 사용 지양
let mockQueryResult: any = null

// Mock Supabase query builder - 완전한 체이닝 지원
const createMockQuery = () => {
  const query = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    throwOnError: vi.fn().mockImplementation(() => {
      return Promise.resolve(mockQueryResult)
    }),
    single: vi.fn().mockImplementation(() => {
      return Promise.resolve(mockQueryResult)
    }),
    // query 자체를 await할 수 있도록 thenable 객체로 만들기
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(mockQueryResult).then(onFulfilled)
    })
  }
  return query
}

// Mock Supabase clients
const mockSupabaseAdminClient = {
  from: vi.fn(() => createMockQuery())
}

vi.mock('@/lib/supabase/client', () => ({
  supabaseAdmin: () => mockSupabaseAdminClient
}))

import { SupabasePaymentService } from '@/lib/services/supabase-payment-service'

describe('SupabasePaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = null
  })

  describe('createPayment', () => {
    it('should create new payment successfully', async () => {
      const paymentData = {
        user_id: 'user-123',
        request_id: 'request-456',
        amount: 100000,
        payment_method: 'card',
        payment_gateway: 'stripe'
      }

      const createdPayment = {
        id: 'payment-123',
        ...paymentData,
        status: 'pending',
        currency: 'KRW',
        created_at: '2024-08-05T12:00:00Z',
        updated_at: '2024-08-05T12:00:00Z'
      }

      // 격리된 mock 설정
      const createMockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: createdPayment,
          error: null
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => createMockQuery)

      const result = await SupabasePaymentService.createPayment(paymentData)

      expect(result).toEqual(createdPayment)
      expect(mockSupabaseAdminClient.from).toHaveBeenCalledWith('payments')
    })

    it('should handle payment creation error', async () => {
      const paymentData = {
        user_id: 'user-123',
        request_id: 'request-456',
        amount: 100000,
        payment_method: 'card',
        payment_gateway: 'stripe'
      }

      // 격리된 에러 mock 설정
      const errorMockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => errorMockQuery)

      const result = await SupabasePaymentService.createPayment(paymentData)

      expect(result).toBeNull()
    })
  })

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const paymentId = 'payment-123'
      const newStatus = 'completed'
      const externalPaymentId = 'stripe-456'

      const updatedPayment = {
        id: paymentId,
        status: newStatus,
        external_payment_id: externalPaymentId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 격리된 mock 설정
      const updateMockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedPayment,
          error: null
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => updateMockQuery)

      const result = await SupabasePaymentService.updatePaymentStatus(
        paymentId, 
        newStatus, 
        externalPaymentId
      )

      expect(result).toEqual(updatedPayment)
      expect(mockSupabaseAdminClient.from).toHaveBeenCalledWith('payments')
    })

    it('should handle status update error', async () => {
      // 격리된 에러 mock 설정
      const errorMockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' }
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => errorMockQuery)

      const result = await SupabasePaymentService.updatePaymentStatus('payment-123', 'failed')

      expect(result).toBeNull()
    })
  })

  describe('getPaymentsByRequest', () => {
    it('should fetch payments by request ID', async () => {
      const requestId = 'request-123'
      const mockPayments = [
        {
          id: 'payment-1',
          request_id: requestId,
          amount: 50000,
          status: 'completed',
          payment_method: 'card',
          proxy_purchases_request: {
            id: requestId,
            order_number: 'HIKO202408051234'
          },
          users: {
            id: 'user-1',
            name: '테스트 사용자',
            email: 'test@example.com'
          }
        }
      ]

      // 격리된 mock 설정
      const requestMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((onFulfilled) => {
          const result = { data: mockPayments, error: null }
          return Promise.resolve(result).then(onFulfilled)
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => requestMockQuery)

      const result = await SupabasePaymentService.getPaymentsByRequest(requestId)

      expect(result).toEqual(mockPayments)
      expect(mockSupabaseAdminClient.from).toHaveBeenCalledWith('payments')
    })

    it('should return empty array on request error', async () => {
      // 격리된 에러 mock 설정
      const errorMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((onFulfilled) => {
          const result = { data: null, error: { message: 'Database error' } }
          return Promise.resolve(result).then(onFulfilled)
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => errorMockQuery)

      const result = await SupabasePaymentService.getPaymentsByRequest('request-123')

      expect(result).toEqual([])
    })
  })

  describe('getPaymentById', () => {
    it('should fetch payment by ID with full relations', async () => {
      const paymentId = 'payment-123'
      const mockPayment = {
        id: paymentId,
        amount: 100000,
        status: 'completed',
        payment_method: 'card',
        proxy_purchases_request: {
          id: 'request-456',
          order_number: 'HIKO202408051234',
          hot_deals: {
            id: 'hotdeal-789',
            title: '핫딜 상품',
            image_url: 'https://example.com/image.jpg'
          }
        },
        users: {
          id: 'user-123',
          name: '테스트 사용자',
          email: 'test@example.com'
        }
      }

      // 격리된 mock 설정
      const detailMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPayment,
          error: null
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => detailMockQuery)

      const result = await SupabasePaymentService.getPaymentById(paymentId)

      expect(result).toEqual(mockPayment)
      expect(mockSupabaseAdminClient.from).toHaveBeenCalledWith('payments')
    })

    it('should return null for non-existent payment', async () => {
      // 격리된 에러 mock 설정
      const errorMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Payment not found' }
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => errorMockQuery)

      const result = await SupabasePaymentService.getPaymentById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getPaymentStats', () => {
    it('should calculate payment statistics correctly', async () => {
      const mockPayments = [
        { status: 'completed', amount: 50000, payment_method: 'card', payment_gateway: 'stripe' },
        { status: 'completed', amount: 30000, payment_method: 'kakao_pay', payment_gateway: 'kakaopay' },
        { status: 'pending', amount: 20000, payment_method: 'card', payment_gateway: 'stripe' },
        { status: 'failed', amount: 10000, payment_method: 'paypal', payment_gateway: 'paypal' }
      ]

      // 격리된 mock 설정 - getPaymentStats용
      const statsMockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((onFulfilled) => {
          const result = { data: mockPayments, error: null }
          return Promise.resolve(result).then(onFulfilled)
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => statsMockQuery)

      const result = await SupabasePaymentService.getPaymentStats()

      expect(result).toEqual({
        total_count: 4,
        total_amount: 110000,
        completed_count: 2,
        completed_amount: 80000,
        pending_count: 1,
        failed_count: 1,
        by_method: {
          card: { count: 2, amount: 70000 },
          kakao_pay: { count: 1, amount: 30000 },
          paypal: { count: 1, amount: 10000 }
        },
        by_gateway: {
          stripe: { count: 2, amount: 70000 },
          kakaopay: { count: 1, amount: 30000 },
          paypal: { count: 1, amount: 10000 }
        }
      })
    })

    it('should handle statistics query error', async () => {
      // 격리된 에러 mock 설정
      const errorStatsMockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((onFulfilled) => {
          const result = { data: null, error: { message: 'Database error' } }
          return Promise.resolve(result).then(onFulfilled)
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => errorStatsMockQuery)

      const result = await SupabasePaymentService.getPaymentStats()

      expect(result).toBeNull()
    })
  })

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      const paymentId = 'payment-123'
      const originalPayment = {
        id: paymentId,
        amount: 100000,
        status: 'completed'
      }

      const refundedPayment = {
        ...originalPayment,
        status: 'refunded',
        updated_at: new Date().toISOString()
      }

      // 격리된 mock 설정 - processRefund는 2번의 쿼리 필요
      let callCount = 0
      const refundMockQuery = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            // 첫 번째 호출: 기존 결제 정보 조회
            return Promise.resolve({ data: originalPayment, error: null })
          } else {
            // 두 번째 호출: 환불 처리 업데이트
            return Promise.resolve({ data: refundedPayment, error: null })
          }
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => refundMockQuery)

      const result = await SupabasePaymentService.processRefund(paymentId)

      expect(result).toEqual(refundedPayment)
    })

    it('should handle refund processing error when payment not found', async () => {
      // 격리된 에러 mock 설정 - 결제 정보 조회 실패
      const errorRefundMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Payment not found' }
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => errorRefundMockQuery)

      const result = await SupabasePaymentService.processRefund('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getAvailablePaymentMethods', () => {
    it('should return available payment methods', async () => {
      const result = await SupabasePaymentService.getAvailablePaymentMethods()

      expect(result).toHaveLength(8) // 8개의 결제 방법
      expect(result[0]).toEqual({
        id: 'card',
        provider: 'card',
        name: '신용카드',
        description: 'Visa, MasterCard, JCB 등',
        isActive: true,
        supportedCurrencies: ['KRW', 'USD'],
        processingTimeMinutes: 5,
        fees: { percentage: 2.5, fixed: 500 }
      })
      
      // 카카오페이 확인
      const kakaoPayMethod = result.find(method => method.id === 'kakao_pay')
      expect(kakaoPayMethod).toBeDefined()
      expect(kakaoPayMethod?.name).toBe('카카오페이')
    })
  })
})