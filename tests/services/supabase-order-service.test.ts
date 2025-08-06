import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock query results storage
let mockQueryResult: any = null

// Mock Supabase query builder - 완전한 체이닝 지원
const createMockQuery = () => {
  const query = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
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

import { SupabaseOrderService } from '@/lib/services/supabase-order-service'

describe('SupabaseOrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = null
  })

  describe('createOrder', () => {
    it('should create new order successfully', async () => {
      const orderData = {
        user_id: 'user-123',
        hot_deal_id: 'hotdeal-456',
        product_name: '테스트 상품',
        product_url: 'https://example.com/product',
        quantity: 2,
        unit_price: 50000,
        total_amount: 100000,
        special_instructions: '빠른 배송 부탁드립니다',
        shipping_address_id: 'address-789',
        status: 'payment_pending'
      }

      const createdOrder = {
        id: 'order-123',
        ...orderData,
        order_number: 'HIKO202408051234',
        created_at: '2024-08-05T12:00:00Z',
        updated_at: '2024-08-05T12:00:00Z'
      }

      mockQueryResult = {
        data: createdOrder,
        error: null
      }

      const result = await SupabaseOrderService.createOrder(orderData)

      expect(result).toEqual(createdOrder)
      expect(mockSupabaseAdminClient.from).toHaveBeenCalledWith('proxy_purchases_request')
    })

    it('should handle order creation error', async () => {
      const orderData = {
        user_id: 'user-123',
        hot_deal_id: 'hotdeal-456',
        product_name: '테스트 상품',
        product_url: 'https://example.com/product',
        quantity: 2,
        unit_price: 50000,
        total_amount: 100000,
        special_instructions: '빠른 배송 부탁드립니다',
        shipping_address_id: 'address-789',
        status: 'payment_pending'
      }

      mockQueryResult = {
        data: null,
        error: { message: 'Database error' }
      }

      const result = await SupabaseOrderService.createOrder(orderData)

      expect(result).toBeNull()
    })
  })

  describe('getOrderById', () => {
    it('should fetch order by ID with all relations', async () => {
      const orderId = 'order-123'
      const mockOrder = {
        id: orderId,
        user_id: 'user-123',
        order_number: 'HIKO202408051234',
        product_name: '테스트 상품',
        status: 'payment_pending',
        total_amount: 100000,
        hot_deals: {
          id: 'hotdeal-456',
          title: '핫딜 상품',
          image_url: 'https://example.com/image.jpg',
          sale_price: 50000,
          source: 'ppomppu'
        },
        shipping_address: {
          id: 'address-789',
          name: '홍길동',
          address: '서울시 강남구',
          phone: '010-1234-5678'
        },
        quotes: [],
        payments: [],
        status_history: []
      }

      mockQueryResult = {
        data: mockOrder,
        error: null
      }

      const result = await SupabaseOrderService.getOrderById(orderId)

      expect(result).toEqual(mockOrder)
      expect(mockSupabaseAdminClient.from).toHaveBeenCalledWith('proxy_purchases_request')
    })

    it('should return null for non-existent order', async () => {
      mockQueryResult = {
        data: null,
        error: { message: 'Order not found' }
      }

      const result = await SupabaseOrderService.getOrderById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const orderId = 'order-123'
      const newStatus = 'payment_completed'
      const changedBy = 'admin-456'
      const notes = '결제 확인 완료'

      // 첫 번째 호출: 현재 상태 조회
      const currentOrder = { status: 'payment_pending' }
      
      // 두 번째 호출: 상태 업데이트
      const updatedOrder = {
        id: orderId,
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // 히스토리 생성 결과
      const historyResult = {
        id: 'history-123',
        request_id: orderId,
        from_status: 'payment_pending',
        to_status: newStatus,
        changed_by: changedBy,
        notes: notes,
        created_at: new Date().toISOString()
      }

      // 별도 mock 설정으로 테스트 격리 - addStatusHistory 호출 포함
      let callCount = 0
      const isolatedMockQuery = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(), // addStatusHistory에서 필요
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            // 첫 번째 호출: 현재 상태 조회
            return Promise.resolve({ data: currentOrder, error: null })
          } else if (callCount === 2) {
            // 두 번째 호출: 상태 업데이트
            return Promise.resolve({ data: updatedOrder, error: null })
          } else {
            // 세 번째 호출: 히스토리 생성 (addStatusHistory)
            return Promise.resolve({ data: historyResult, error: null })
          }
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => isolatedMockQuery)

      const result = await SupabaseOrderService.updateOrderStatus(orderId, newStatus, changedBy, notes)

      expect(result).toEqual(updatedOrder)
    })

    it('should handle status update error', async () => {
      // 격리된 mock으로 에러 시뮬레이션
      const errorMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Order not found' }
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => errorMockQuery)

      const result = await SupabaseOrderService.updateOrderStatus('non-existent', 'completed', 'admin')

      expect(result).toBeNull()
    })
  })

  describe('createQuote', () => {
    it('should create quote successfully', async () => {
      const quoteData = {
        request_id: 'order-123',
        product_cost: 80000,
        domestic_shipping: 3000,
        international_shipping: 15000,
        fee: 8000,
        total_amount: 106000,
        payment_method: 'card',
        valid_until: '2024-08-15T23:59:59Z',
        notes: '견적서 작성 완료'
      }

      const createdQuote = {
        id: 'quote-456',
        ...quoteData,
        approval_state: 'pending',
        created_at: '2024-08-05T12:00:00Z'
      }

      // 격리된 mock 설정
      const quoteMockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: createdQuote,
          error: null
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => quoteMockQuery)

      const result = await SupabaseOrderService.createQuote(quoteData)

      expect(result).toEqual(createdQuote)
      expect(mockSupabaseAdminClient.from).toHaveBeenCalledWith('proxy_purchase_quotes')
    })

    it('should handle quote creation error', async () => {
      const quoteData = {
        request_id: 'order-123',
        product_cost: 80000,
        domestic_shipping: 3000,
        international_shipping: 15000,
        fee: 8000,
        total_amount: 106000,
        payment_method: 'card',
        valid_until: '2024-08-15T23:59:59Z'
      }

      // 격리된 에러 mock 설정
      const errorQuoteMockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => errorQuoteMockQuery)

      const result = await SupabaseOrderService.createQuote(quoteData)

      expect(result).toBeNull()
    })
  })

  describe('getOrderStats', () => {
    it('should calculate order statistics correctly', async () => {
      const mockOrders = [
        { status: 'payment_pending' },
        { status: 'payment_completed' },
        { status: 'payment_completed' },
        { status: 'delivered' },
        { status: 'cancelled' }
      ]

      // 격리된 mock 설정 - getOrderStats용
      const statsMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((onFulfilled) => {
          const result = { data: mockOrders, error: null }
          return Promise.resolve(result).then(onFulfilled)
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => statsMockQuery)

      const result = await SupabaseOrderService.getOrderStats()

      expect(result).toEqual({
        total: 5,
        pending: 1,
        processing: 2,
        completed: 1,
        cancelled: 1
      })
      expect(mockSupabaseAdminClient.from).toHaveBeenCalledWith('proxy_purchases_request')
    })

    it('should calculate user-specific statistics', async () => {
      const userId = 'user-123'
      const mockOrders = [
        { status: 'payment_pending' },
        { status: 'delivered' }
      ]

      // 격리된 mock 설정 - 사용자별 통계용 (userId가 있을 때 eq 호출)
      const userStatsMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((onFulfilled) => {
          const result = { data: mockOrders, error: null }
          return Promise.resolve(result).then(onFulfilled)
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => userStatsMockQuery)

      const result = await SupabaseOrderService.getOrderStats(userId)

      expect(result).toEqual({
        total: 2,
        pending: 1,
        processing: 0,
        completed: 1,
        cancelled: 0
      })
    })

    it('should handle statistics query error', async () => {
      // 격리된 에러 mock 설정
      const errorStatsMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((onFulfilled) => {
          const result = { data: null, error: { message: 'Database error' } }
          return Promise.resolve(result).then(onFulfilled)
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => errorStatsMockQuery)

      const result = await SupabaseOrderService.getOrderStats()

      expect(result).toBeNull()
    })
  })

  describe('addStatusHistory', () => {
    it('should add status history successfully', async () => {
      const historyData = {
        request_id: 'order-123',
        from_status: 'payment_pending',
        to_status: 'payment_completed',
        changed_by: 'admin-456',
        notes: '결제 확인 완료'
      }

      const createdHistory = {
        id: 'history-789',
        ...historyData,
        from_status: 'payment_pending',
        created_at: '2024-08-05T12:00:00Z'
      }

      // 격리된 mock 설정
      const historyMockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: createdHistory,
          error: null
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => historyMockQuery)

      const result = await SupabaseOrderService.addStatusHistory(
        historyData.request_id,
        historyData.from_status,
        historyData.to_status,
        historyData.changed_by,
        historyData.notes
      )

      expect(result).toEqual(createdHistory)
      expect(mockSupabaseAdminClient.from).toHaveBeenCalledWith('order_status_history')
    })

    it('should handle status history creation error', async () => {
      // 격리된 에러 mock 설정
      const errorHistoryMockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }

      mockSupabaseAdminClient.from = vi.fn(() => errorHistoryMockQuery)

      const result = await SupabaseOrderService.addStatusHistory(
        'order-123',
        'pending',
        'completed',
        'admin'
      )

      expect(result).toBeNull()
    })
  })
})