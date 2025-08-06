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
const mockSupabaseClient = {
  from: vi.fn(() => createMockQuery())
}

const mockSupabaseAdminClient = {
  from: vi.fn(() => createMockQuery())
}

vi.mock('@/lib/supabase/client', () => ({
  supabase: () => mockSupabaseClient,
  supabaseAdmin: () => mockSupabaseAdminClient
}))

// Mock getCurrentUser
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'test@example.com'
  }))
}))

import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'

describe('SupabaseHotDealService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = null
  })

  describe('getHotDeals', () => {
    it('should fetch hot deals successfully', async () => {
      const mockHotDeals = [
        {
          id: '1',
          title: '테스트 핫딜',
          source: 'ppomppu',
          original_price: 100000,
          sale_price: 50000,
          status: 'active'
        }
      ]

      // Setup mock response - getHotDeals returns { data, count, error? }
      mockQueryResult = {
        data: mockHotDeals,
        count: 1,
        error: null
      }

      const result = await SupabaseHotDealService.getHotDeals()

      expect(result).toEqual({
        data: mockHotDeals,
        count: 1
      })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('hot_deals')
    })

    it('should handle fetch error gracefully', async () => {
      // Setup mock error response
      mockQueryResult = {
        data: null,
        count: 0,
        error: { message: 'Database error' }
      }

      const result = await SupabaseHotDealService.getHotDeals()

      expect(result).toEqual({
        data: [],
        count: 0,
        error: 'Database error'
      })
    })
  })

  describe('getHotDealById', () => {
    it('should fetch single hot deal by ID', async () => {
      const mockHotDeal = {
        id: '1',
        title: '테스트 핫딜',
        source: 'ppomppu',
        original_price: 100000,
        sale_price: 50000,
        status: 'active'
      }

      // Setup mock response - getHotDealById uses single()
      mockQueryResult = {
        data: mockHotDeal,
        error: null
      }

      const result = await SupabaseHotDealService.getHotDealById('1')

      expect(result).toEqual(mockHotDeal)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('hot_deals')
    })

    it('should return null for non-existent hot deal', async () => {
      // Setup mock error response
      mockQueryResult = {
        data: null,
        error: { message: 'Not found' }
      }

      const result = await SupabaseHotDealService.getHotDealById('999')

      expect(result).toBeNull()
    })
  })

  describe('searchHotDeals', () => {
    it('should search hot deals with query', async () => {
      const mockHotDeals = [
        {
          id: '1',
          title: '마우스 특가',
          source: 'ppomppu',
          original_price: 50000,
          sale_price: 30000,
          status: 'active'
        }
      ]

      // Setup mock response - searchHotDeals returns { data, count }
      mockQueryResult = {
        data: mockHotDeals,
        count: 1,
        error: null
      }

      const result = await SupabaseHotDealService.searchHotDeals('마우스')

      expect(result).toEqual({
        data: mockHotDeals,
        count: 1
      })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('hot_deals')
    })

    it('should return empty result for failed search', async () => {
      // Setup mock error response
      mockQueryResult = {
        data: null,
        count: 0,
        error: { message: 'Search failed' }
      }

      const result = await SupabaseHotDealService.searchHotDeals('unknown')

      expect(result).toEqual({
        data: [],
        count: 0
      })
    })
  })


  describe('createHotDeal', () => {
    it('should create new hot deal successfully', async () => {
      const newHotDeal = {
        title: '새로운 핫딜',
        source: 'ppomppu' as const,
        source_id: 'test-123',
        original_price: 100000,
        sale_price: 80000,
        category: 'electronics',
        seller: '테스트 판매자',
        original_url: 'https://example.com',
        status: 'active' as const
      }

      const createdHotDeal = {
        id: '1',
        ...newHotDeal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Setup mock response - createHotDeal uses supabaseAdmin
      mockQueryResult = {
        data: createdHotDeal,
        error: null
      }

      const result = await SupabaseHotDealService.createHotDeal(newHotDeal)

      expect(result).toEqual(createdHotDeal)
      expect(mockSupabaseAdminClient.from).toHaveBeenCalledWith('hot_deals')
    })

    it('should handle creation error', async () => {
      const newHotDeal = {
        title: '새로운 핫딜',
        source: 'ppomppu' as const,
        source_id: 'test-123',
        original_price: 100000,
        sale_price: 80000,
        category: 'electronics',
        seller: '테스트 판매자',
        original_url: 'https://example.com',
        status: 'active' as const
      }

      // Setup mock error response
      mockQueryResult = {
        data: null,
        error: { message: 'Creation failed' }
      }

      const result = await SupabaseHotDealService.createHotDeal(newHotDeal)

      expect(result).toBeNull()
    })
  })
})