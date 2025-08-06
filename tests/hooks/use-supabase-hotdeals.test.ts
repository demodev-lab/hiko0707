import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

// Mock 상태 관리를 위한 전역 변수들
let mockSupabaseHotDealServiceResult: any = null
let mockSupabaseClientResult: any = null
let mockChannelSubscription: any = null
let mockDocumentVisibilityState = 'visible'

// Mock SupabaseHotDealService
const mockSupabaseHotDealServiceMethods = {
  getHotDeals: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.getHotDeals || { data: [], count: 0 })
  }),
  getHotDealById: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.getHotDealById || null)
  }),
  getPopularHotDeals: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.getPopularHotDeals || [])
  }),
  getTranslatedHotDeals: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.getTranslatedHotDeals || { data: [], count: 0 })
  }),
  incrementViews: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.incrementViews || true)
  }),
  createHotDeal: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.createHotDeal || { id: 'new-hotdeal-id' })
  }),
  updateHotDeal: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.updateHotDeal || { id: 'updated-hotdeal-id' })
  }),
  deleteHotDeal: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.deleteHotDeal || true)
  }),
  toggleLike: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.toggleLike || { liked: true })
  }),
  hasUserLiked: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.hasUserLiked || false)
  }),
  getUserFavorites: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.getUserFavorites || [])
  }),
  toggleFavorite: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.toggleFavorite || { favorited: true })
  }),
  getHotDealStats: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.getHotDealStats || { total: 0, active: 0 })
  }),
  searchHotDeals: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseHotDealServiceResult?.searchHotDeals || { data: [], count: 0 })
  })
}

vi.mock('@/lib/services/supabase-hotdeal-service', () => ({
  SupabaseHotDealService: mockSupabaseHotDealServiceMethods
}))

// Mock Supabase client with realtime channel support
const createMockChannel = () => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockImplementation(() => {
    return mockChannelSubscription?.subscribe || Promise.resolve()
  })
})

const mockSupabaseClient = () => ({
  channel: vi.fn().mockImplementation(() => createMockChannel()),
  removeChannel: vi.fn().mockImplementation(() => {
    return mockSupabaseClientResult?.removeChannel || Promise.resolve()
  })
})

vi.mock('@/lib/supabase/client', () => ({
  supabase: vi.fn().mockImplementation(() => mockSupabaseClient())
}))

// Mock document.hidden property for visibility API
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false
})

// Mock addEventListener/removeEventListener
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(document, 'addEventListener', {
  writable: true,
  value: mockAddEventListener
})
Object.defineProperty(document, 'removeEventListener', {
  writable: true,
  value: mockRemoveEventListener
})

// Import hooks after mocking
import {
  useHotDeals,
  useHotDeal,
  usePopularHotDeals,
  useTranslatedHotDeals,
  useIncrementHotDealViews,
  useCreateHotDeal,
  useUpdateHotDeal,
  useDeleteHotDeal,
  useLikeHotDeal,
  useHasLikedHotDeal,
  useUserFavoriteHotDeals,
  useToggleFavoriteHotDeal,
  useHotDealStats,
  useSearchHotDeals,
  useSupabaseHotDeals
} from '@/hooks/use-supabase-hotdeals'

// Test wrapper component for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('use-supabase-hotdeals hooks', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseHotDealServiceResult = null
    mockSupabaseClientResult = null
    mockChannelSubscription = null
    mockDocumentVisibilityState = 'visible'
    
    // Reset mock service methods
    Object.values(mockSupabaseHotDealServiceMethods).forEach(mock => mock.mockClear())
    
    // Reset document event listeners
    mockAddEventListener.mockClear()
    mockRemoveEventListener.mockClear()
    
    // Reset document.hidden state
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false
    })
    
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('useHotDeals', () => {
    it('should fetch hot deals successfully', async () => {
      const mockHotDeals = {
        data: [
          {
            id: '1',
            title: '갤럭시 S24 특가',
            source: 'ppomppu',
            source_id: '123',
            sale_price: 800000
          }
        ],
        count: 1
      }

      mockSupabaseHotDealServiceResult = {
        getHotDeals: mockHotDeals
      }

      const { result } = renderHook(() => useHotDeals(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockHotDeals)
      expect(mockSupabaseHotDealServiceMethods.getHotDeals).toHaveBeenCalledWith({})
    })

    it('should fetch hot deals with filtering options', async () => {
      const options = {
        source: 'ppomppu',
        status: 'active' as const,
        minPrice: 100000,
        maxPrice: 1000000,
        limit: 20
      }

      mockSupabaseHotDealServiceResult = {
        getHotDeals: { data: [], count: 0 }
      }

      const { result } = renderHook(() => useHotDeals(options), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockSupabaseHotDealServiceMethods.getHotDeals).toHaveBeenCalledWith(options)
    })

    it('should handle error when fetching hot deals fails', async () => {
      const errorMessage = 'Failed to fetch hot deals'
      mockSupabaseHotDealServiceMethods.getHotDeals.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useHotDeals(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect((result.current.error as Error).message).toBe(errorMessage)
    })

    it('should setup realtime subscription for hot deals', async () => {
      const mockChannel = createMockChannel()
      const mockSupabaseInstance = mockSupabaseClient()
      vi.mocked(mockSupabaseInstance.channel).mockReturnValue(mockChannel)

      mockSupabaseHotDealServiceResult = {
        getHotDeals: { data: [], count: 0 }
      }

      renderHook(() => useHotDeals(), { wrapper })

      await waitFor(() => {
        expect(mockSupabaseInstance.channel).toHaveBeenCalledWith('hotdeals-realtime')
      })

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hot_deals',
          filter: 'status=eq.active'
        },
        expect.any(Function)
      )

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hot_deal_likes'
        },
        expect.any(Function)
      )
    })

    it('should handle visibility change for realtime subscription', async () => {
      mockSupabaseHotDealServiceResult = {
        getHotDeals: { data: [], count: 0 }
      }

      const { unmount } = renderHook(() => useHotDeals(), { wrapper })

      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
      })

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    })
  })

  describe('useHotDeal', () => {
    it('should fetch single hot deal by ID', async () => {
      const mockHotDeal = {
        id: '123',
        title: '갤럭시 S24 특가',
        source: 'ppomppu',
        source_id: '123',
        sale_price: 800000
      }

      mockSupabaseHotDealServiceResult = {
        getHotDealById: mockHotDeal
      }

      const { result } = renderHook(() => useHotDeal('123'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockHotDeal)
      expect(mockSupabaseHotDealServiceMethods.getHotDealById).toHaveBeenCalledWith('123')
    })

    it('should not fetch when ID is empty', () => {
      const { result } = renderHook(() => useHotDeal(''), { wrapper })

      expect(result.current.isPending).toBe(false)
      expect(mockSupabaseHotDealServiceMethods.getHotDealById).not.toHaveBeenCalled()
    })

    it('should handle error when fetching single hot deal fails', async () => {
      const errorMessage = 'Hot deal not found'
      mockSupabaseHotDealServiceMethods.getHotDealById.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useHotDeal('invalid-id'), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect((result.current.error as Error).message).toBe(errorMessage)
    })
  })

  describe('usePopularHotDeals', () => {
    it('should fetch popular hot deals with default limit', async () => {
      const mockPopularDeals = [
        { id: '1', title: '인기 상품 1', like_count: 100 },
        { id: '2', title: '인기 상품 2', like_count: 95 }
      ]

      mockSupabaseHotDealServiceResult = {
        getPopularHotDeals: mockPopularDeals
      }

      const { result } = renderHook(() => usePopularHotDeals(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockPopularDeals)
      expect(mockSupabaseHotDealServiceMethods.getPopularHotDeals).toHaveBeenCalledWith(10)
    })

    it('should fetch popular hot deals with custom limit', async () => {
      mockSupabaseHotDealServiceResult = {
        getPopularHotDeals: []
      }

      const { result } = renderHook(() => usePopularHotDeals(5), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockSupabaseHotDealServiceMethods.getPopularHotDeals).toHaveBeenCalledWith(5)
    })
  })

  describe('useTranslatedHotDeals', () => {
    it('should fetch translated hot deals when language is provided', async () => {
      const mockTranslatedDeals = {
        data: [{ id: '1', title: 'Galaxy S24 Special', source: 'ppomppu' }],
        count: 1
      }

      mockSupabaseHotDealServiceResult = {
        getTranslatedHotDeals: mockTranslatedDeals
      }

      const options = { limit: 20 }
      const { result } = renderHook(() => useTranslatedHotDeals('en', options), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockTranslatedDeals)
      expect(mockSupabaseHotDealServiceMethods.getTranslatedHotDeals).toHaveBeenCalledWith('en', options)
    })

    it('should not fetch when language is empty', () => {
      const { result } = renderHook(() => useTranslatedHotDeals(''), { wrapper })

      expect(result.current.isPending).toBe(false)
      expect(mockSupabaseHotDealServiceMethods.getTranslatedHotDeals).not.toHaveBeenCalled()
    })
  })

  describe('useIncrementHotDealViews', () => {
    it('should increment view count successfully', async () => {
      mockSupabaseHotDealServiceResult = {
        incrementViews: true
      }

      const { result } = renderHook(() => useIncrementHotDealViews(), { wrapper })

      result.current.mutate('123')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockSupabaseHotDealServiceMethods.incrementViews).toHaveBeenCalledWith('123')
    })

    it('should handle increment views error', async () => {
      const errorMessage = 'Failed to increment views'
      mockSupabaseHotDealServiceMethods.incrementViews.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useIncrementHotDealViews(), { wrapper })

      result.current.mutate('123')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect((result.current.error as Error).message).toBe(errorMessage)
    })
  })

  describe('useCreateHotDeal', () => {
    it('should create hot deal successfully', async () => {
      const newHotDeal = {
        title: '새로운 특가',
        source: 'test',
        source_id: 'new-123',
        sale_price: 50000
      }

      const createdHotDeal = { id: 'created-id', ...newHotDeal }

      mockSupabaseHotDealServiceResult = {
        createHotDeal: createdHotDeal
      }

      const { result } = renderHook(() => useCreateHotDeal(), { wrapper })

      result.current.mutate(newHotDeal as any)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(createdHotDeal)
      expect(mockSupabaseHotDealServiceMethods.createHotDeal).toHaveBeenCalledWith(newHotDeal)
    })
  })

  describe('useUpdateHotDeal', () => {
    it('should update hot deal successfully', async () => {
      const updates = { sale_price: 45000 }
      const updatedHotDeal = { id: '123', ...updates }

      mockSupabaseHotDealServiceResult = {
        updateHotDeal: updatedHotDeal
      }

      const { result } = renderHook(() => useUpdateHotDeal(), { wrapper })

      result.current.mutate({ id: '123', updates })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(updatedHotDeal)
      expect(mockSupabaseHotDealServiceMethods.updateHotDeal).toHaveBeenCalledWith('123', updates)
    })
  })

  describe('useDeleteHotDeal', () => {
    it('should delete hot deal successfully', async () => {
      mockSupabaseHotDealServiceResult = {
        deleteHotDeal: true
      }

      const { result } = renderHook(() => useDeleteHotDeal(), { wrapper })

      result.current.mutate('123')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockSupabaseHotDealServiceMethods.deleteHotDeal).toHaveBeenCalledWith('123')
    })
  })

  describe('useLikeHotDeal', () => {
    it('should toggle like successfully', async () => {
      const likeResult = { liked: true, likeCount: 15 }

      mockSupabaseHotDealServiceResult = {
        toggleLike: likeResult
      }

      const { result } = renderHook(() => useLikeHotDeal(), { wrapper })

      result.current.mutate({ hotdealId: '123', userId: 'user-456' })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(likeResult)
      expect(mockSupabaseHotDealServiceMethods.toggleLike).toHaveBeenCalledWith('123', 'user-456')
    })
  })

  describe('useHasLikedHotDeal', () => {
    it('should check if user has liked hot deal', async () => {
      mockSupabaseHotDealServiceResult = {
        hasUserLiked: true
      }

      const { result } = renderHook(() => useHasLikedHotDeal('123', 'user-456'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBe(true)
      expect(mockSupabaseHotDealServiceMethods.hasUserLiked).toHaveBeenCalledWith('123', 'user-456')
    })

    it('should not fetch when hotdealId or userId is empty', () => {
      const { result: result1 } = renderHook(() => useHasLikedHotDeal('', 'user-456'), { wrapper })
      const { result: result2 } = renderHook(() => useHasLikedHotDeal('123', ''), { wrapper })

      expect(result1.current.isPending).toBe(false)
      expect(result2.current.isPending).toBe(false)
      expect(mockSupabaseHotDealServiceMethods.hasUserLiked).not.toHaveBeenCalled()
    })
  })

  describe('useUserFavoriteHotDeals', () => {
    it('should fetch user favorite hot deals', async () => {
      const mockFavorites = [
        { id: '1', title: '즐겨찾기 1' },
        { id: '2', title: '즐겨찾기 2' }
      ]

      mockSupabaseHotDealServiceResult = {
        getUserFavorites: mockFavorites
      }

      const { result } = renderHook(() => useUserFavoriteHotDeals('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockFavorites)
      expect(mockSupabaseHotDealServiceMethods.getUserFavorites).toHaveBeenCalledWith('user-123')
    })

    it('should not fetch when userId is empty', () => {
      const { result } = renderHook(() => useUserFavoriteHotDeals(''), { wrapper })

      expect(result.current.isPending).toBe(false)
      expect(mockSupabaseHotDealServiceMethods.getUserFavorites).not.toHaveBeenCalled()
    })
  })

  describe('useToggleFavoriteHotDeal', () => {
    it('should toggle favorite successfully', async () => {
      const favoriteResult = { favorited: true }

      mockSupabaseHotDealServiceResult = {
        toggleFavorite: favoriteResult
      }

      const { result } = renderHook(() => useToggleFavoriteHotDeal(), { wrapper })

      result.current.mutate({ hotdealId: '123', userId: 'user-456' })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(favoriteResult)
      expect(mockSupabaseHotDealServiceMethods.toggleFavorite).toHaveBeenCalledWith('123', 'user-456')
    })
  })

  describe('useHotDealStats', () => {
    it('should fetch hot deal statistics with default period', async () => {
      const mockStats = { total: 1000, active: 800, expired: 200 }

      mockSupabaseHotDealServiceResult = {
        getHotDealStats: mockStats
      }

      const { result } = renderHook(() => useHotDealStats(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockStats)
      expect(mockSupabaseHotDealServiceMethods.getHotDealStats).toHaveBeenCalledWith('today')
    })

    it('should fetch hot deal statistics with custom period', async () => {
      const mockStats = { total: 5000, active: 3000, expired: 2000 }

      mockSupabaseHotDealServiceResult = {
        getHotDealStats: mockStats
      }

      const { result } = renderHook(() => useHotDealStats('month'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockSupabaseHotDealServiceMethods.getHotDealStats).toHaveBeenCalledWith('month')
    })
  })

  describe('useSearchHotDeals', () => {
    it('should search hot deals when search term is provided', async () => {
      const searchResults = {
        data: [{ id: '1', title: '갤럭시 S24 검색 결과' }],
        count: 1
      }

      mockSupabaseHotDealServiceResult = {
        searchHotDeals: searchResults
      }

      const options = { limit: 20 }
      const { result } = renderHook(() => useSearchHotDeals('갤럭시', options), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(searchResults)
      expect(mockSupabaseHotDealServiceMethods.searchHotDeals).toHaveBeenCalledWith('갤럭시', options)
    })

    it('should not search when search term is empty', () => {
      const { result } = renderHook(() => useSearchHotDeals(''), { wrapper })

      expect(result.current.isPending).toBe(false)
      expect(mockSupabaseHotDealServiceMethods.searchHotDeals).not.toHaveBeenCalled()
    })
  })

  describe('useSupabaseHotDeals (Legacy)', () => {
    it('should provide legacy interface for backward compatibility', async () => {
      const mockLegacyData = {
        data: [
          {
            id: '1',
            title: '레거시 테스트 상품',
            source: 'ppomppu',
            source_id: '123',
            sale_price: 100000
          }
        ],
        count: 1
      }

      mockSupabaseHotDealServiceResult = {
        getHotDeals: mockLegacyData,
        createHotDeal: { id: 'created-legacy-id' },
        updateHotDeal: { id: 'updated-legacy-id' },
        deleteHotDeal: true
      }

      const { result } = renderHook(() => useSupabaseHotDeals(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hotdeals).toEqual(mockLegacyData.data)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.createHotDeal).toBe('function')
      expect(typeof result.current.updateHotDeal).toBe('function')
      expect(typeof result.current.deleteHotDeal).toBe('function')
      expect(typeof result.current.deleteAllHotDeals).toBe('function')
      expect(typeof result.current.refetch).toBe('function')
      expect(typeof result.current.findHotDeals).toBe('function')
    })

    it('should create hot deal with legacy data transformation', async () => {
      const legacyHotDealData = {
        source: 'ppomppu',
        sourcePostId: '123456',
        title: '레거시 상품',
        price: 50000,
        originalPrice: 60000,
        category: '전자제품',
        seller: '테스트셀러',
        originalUrl: 'https://example.com/123456',
        imageUrl: 'https://example.com/image.jpg',
        viewCount: 100,
        likeCount: 5,
        commentCount: 3,
        status: 'active',
        authorName: '작성자',
        shipping: { isFree: true }
      }

      mockSupabaseHotDealServiceResult = {
        getHotDeals: { data: [], count: 0 },
        createHotDeal: { id: 'created-legacy-id' }
      }

      const { result } = renderHook(() => useSupabaseHotDeals(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const createdResult = await result.current.createHotDeal(legacyHotDealData)

      expect(mockSupabaseHotDealServiceMethods.createHotDeal).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'ppomppu',
          source_id: '123456',
          title: '레거시 상품',
          sale_price: 50000,
          original_price: 60000,
          discount_rate: 17, // (60000 - 50000) / 60000 * 100 rounded
          category: '전자제품',
          seller: '테스트셀러',
          original_url: 'https://example.com/123456',
          image_url: 'https://example.com/image.jpg',
          views: 100,
          like_count: 5,
          comment_count: 3,
          status: 'active',
          is_free_shipping: true,
          author_name: '작성자'
        })
      )

      expect(createdResult).toEqual({ id: 'created-legacy-id' })
    })

    it('should handle legacy deleteAllHotDeals safely', async () => {
      mockSupabaseHotDealServiceResult = {
        getHotDeals: { data: [], count: 0 }
      }

      const { result } = renderHook(() => useSupabaseHotDeals(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const deleteAllResult = await result.current.deleteAllHotDeals()

      // Legacy deleteAllHotDeals should return false for safety
      expect(deleteAllResult).toBe(false)
    })

    it('should handle legacy findHotDeals method', async () => {
      const findOptions = { source: 'ppomppu', limit: 10 }
      const mockFindResults = {
        data: [{ id: '1', title: '찾은 상품' }],
        count: 1
      }

      mockSupabaseHotDealServiceResult = {
        getHotDeals: { data: [], count: 0 }
      }

      // findHotDeals 호출 시 별도 결과 설정
      mockSupabaseHotDealServiceMethods.getHotDeals.mockResolvedValueOnce(mockFindResults)

      const { result } = renderHook(() => useSupabaseHotDeals(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const findResult = await result.current.findHotDeals(findOptions)

      expect(findResult).toEqual(mockFindResults.data)
      expect(mockSupabaseHotDealServiceMethods.getHotDeals).toHaveBeenCalledWith(findOptions)
    })
  })
})