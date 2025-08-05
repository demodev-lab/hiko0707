import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'
import type { HotDeal } from '@/types/hotdeal'
import type { Database } from '@/database.types'

type HotDealRow = Database['public']['Tables']['hot_deals']['Row']
type HotDealInsert = Database['public']['Tables']['hot_deals']['Insert']
type HotDealUpdate = Database['public']['Tables']['hot_deals']['Update']

interface UseHotDealsOptions {
  source?: string
  status?: 'active' | 'ended' | 'deleted'
  category?: string
  minPrice?: number
  maxPrice?: number
  seller?: string
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'sale_price' | 'like_count' | 'views' | 'comment_count'
  sortOrder?: 'asc' | 'desc'
  searchTerm?: string
  language?: string
}

/**
 * Hook for fetching hot deals with optional filters
 */
export function useHotDeals(options: UseHotDealsOptions = {}) {
  const queryKey = ['hotdeals', options]
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await SupabaseHotDealService.getHotDeals(options)
      return result
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - 핫딜은 자주 변경되므로 짧게 설정
    refetchInterval: options.status === 'active' ? 5 * 60 * 1000 : false, // Auto-refresh active deals
  })

  // 실시간 구독 설정 - 조건부 구독으로 최적화
  useEffect(() => {
    // 페이지 가시성 체크
    const isVisible = () => !document.hidden
    
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel('hotdeals-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hot_deals',
            // 활성 상태의 핫딜만 구독하여 성능 최적화
            filter: 'status=eq.active'
          },
          (payload) => {
            console.log('핫딜 실시간 업데이트:', payload)
            // 특정 쿼리만 무효화하여 과도한 re-fetch 방지
            queryClient.invalidateQueries({ queryKey: ['hotdeals', options] })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hot_deal_likes'
          },
          (payload) => {
            // 좋아요 업데이트는 throttling 적용
            const throttleKey = `like-update-${(payload.new as any)?.hotdeal_id || 'unknown'}`
            const win = window as any
            
            if (win.lastLikeUpdate && win.lastLikeUpdate[throttleKey] && 
                Date.now() - win.lastLikeUpdate[throttleKey] < 1000) {
              return // 1초 내 중복 업데이트 방지
            }
            
            if (!win.lastLikeUpdate) win.lastLikeUpdate = {}
            win.lastLikeUpdate[throttleKey] = Date.now()
            
            console.log('핫딜 좋아요 실시간 업데이트:', payload)
            if ((payload.new as any)?.hotdeal_id) {
              queryClient.invalidateQueries({ queryKey: ['hotdeal', (payload.new as any).hotdeal_id] })
            }
          }
        )
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (isVisible()) {
        setupSubscription()
      } else if (channel) {
        supabase().removeChannel(channel)
        channel = null
      }
    }

    // 초기 설정
    setupSubscription()
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channel) {
        supabase().removeChannel(channel)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [queryClient, options])

  return query
}

/**
 * Hook for fetching a single hot deal by ID
 */
export function useHotDeal(id: string) {
  return useQuery({
    queryKey: ['hotdeal', id],
    queryFn: () => SupabaseHotDealService.getHotDealById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes - 개별 핫딜은 중간 정도로 설정
  })
}

/**
 * Hook for fetching popular hot deals
 */
export function usePopularHotDeals(limit: number = 10) {
  return useQuery({
    queryKey: ['hotdeals', 'popular', limit],
    queryFn: () => SupabaseHotDealService.getPopularHotDeals(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for fetching hot deals with translations
 */
export function useTranslatedHotDeals(language: string, options: UseHotDealsOptions = {}) {
  return useQuery({
    queryKey: ['hotdeals', 'translated', language, options],
    queryFn: () => SupabaseHotDealService.getTranslatedHotDeals(language, options),
    enabled: !!language,
    staleTime: 2 * 60 * 1000, // 2 minutes - 번역된 핫딜은 자주 업데이트
  })
}

/**
 * Hook for incrementing view count
 */
export function useIncrementHotDealViews() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => SupabaseHotDealService.incrementViews(id),
    onSuccess: (_, id) => {
      // Optimistically update the view count
      queryClient.setQueryData(['hotdeal', id], (old: HotDealRow | null) => {
        if (old) {
          return {
            ...old,
            views: (old.views || 0) + 1
          }
        }
        return old
      })
    }
  })
}

/**
 * Hook for creating a new hot deal
 */
export function useCreateHotDeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: HotDealInsert) => SupabaseHotDealService.createHotDeal(data),
    onSuccess: () => {
      // Invalidate all hotdeals queries
      queryClient.invalidateQueries({ queryKey: ['hotdeals'] })
    }
  })
}

/**
 * Hook for updating a hot deal
 */
export function useUpdateHotDeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: HotDealUpdate }) => 
      SupabaseHotDealService.updateHotDeal(id, updates),
    onSuccess: (_, { id }) => {
      // Invalidate specific hot deal and all lists
      queryClient.invalidateQueries({ queryKey: ['hotdeal', id] })
      queryClient.invalidateQueries({ queryKey: ['hotdeals'] })
    }
  })
}

/**
 * Hook for deleting a hot deal
 */
export function useDeleteHotDeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => SupabaseHotDealService.deleteHotDeal(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: ['hotdeal', id] })
      queryClient.invalidateQueries({ queryKey: ['hotdeals'] })
    }
  })
}

/**
 * Hook for toggling hot deal like
 */
export function useLikeHotDeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ hotdealId, userId }: { hotdealId: string; userId: string }) => {
      return SupabaseHotDealService.toggleLike(hotdealId, userId)
    },
    onSuccess: (_, { hotdealId }) => {
      // Invalidate the hot deal to refresh like counts
      queryClient.invalidateQueries({ queryKey: ['hotdeal', hotdealId] })
      queryClient.invalidateQueries({ queryKey: ['hotdeals'] })
    }
  })
}

/**
 * Hook for checking if a user has liked a hot deal
 */
export function useHasLikedHotDeal(hotdealId: string, userId: string) {
  return useQuery({
    queryKey: ['hotdeal', 'liked', hotdealId, userId],
    queryFn: () => SupabaseHotDealService.hasUserLiked(hotdealId, userId),
    enabled: !!hotdealId && !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for getting user's favorite hot deals
 */
export function useUserFavoriteHotDeals(userId: string) {
  return useQuery({
    queryKey: ['hotdeals', 'favorites', userId],
    queryFn: () => SupabaseHotDealService.getUserFavorites(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - 사용자 즐겨찾기는 덜 자주 변경
  })
}

/**
 * Hook for toggling favorite status
 */
export function useToggleFavoriteHotDeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ hotdealId, userId }: { hotdealId: string; userId: string }) => {
      return SupabaseHotDealService.toggleFavorite(hotdealId, userId)
    },
    onSuccess: (_, { userId }) => {
      // Invalidate user's favorites
      queryClient.invalidateQueries({ queryKey: ['hotdeals', 'favorites', userId] })
    }
  })
}

/**
 * Hook for getting hot deal statistics
 */
export function useHotDealStats(period: 'today' | 'week' | 'month' | 'all' = 'today') {
  return useQuery({
    queryKey: ['hotdeals', 'stats', period],
    queryFn: () => SupabaseHotDealService.getHotDealStats(period),
    staleTime: 30 * 60 * 1000, // 30 minutes - 통계는 자주 변경되지 않으므로 캐시 활용
  })
}

/**
 * Hook for search hot deals
 */
export function useSearchHotDeals(searchTerm: string, options: UseHotDealsOptions = {}) {
  return useQuery({
    queryKey: ['hotdeals', 'search', searchTerm, options],
    queryFn: () => SupabaseHotDealService.searchHotDeals(searchTerm, options),
    enabled: searchTerm.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute - 검색 결과는 매우 자주 변경
  })
}

/**
 * Legacy hook support for backward compatibility
 */
export function useSupabaseHotDeals() {
  const { data = { data: [], count: 0 }, isLoading, error } = useHotDeals({ limit: 1000 })
  
  return {
    hotdeals: data.data || [],
    loading: isLoading,
    error,
    createHotDeal: async (hotdealData: any) => {
      // Transform to Supabase format
      const currentDate = new Date().toISOString()
      const price = typeof hotdealData.price === 'number' ? hotdealData.price : 0
      const originalPrice = hotdealData.originalPrice || price
      
      const insertData = {
        source: hotdealData.source,
        source_id: hotdealData.sourcePostId || 'unknown',
        category: hotdealData.category || '기타',
        title: hotdealData.title,
        description: hotdealData.productComment || null,
        sale_price: price,
        original_price: originalPrice,
        discount_rate: originalPrice > 0 ? Math.round((originalPrice - price) / originalPrice * 100) : 0,
        seller: hotdealData.seller || null,
        original_url: hotdealData.originalUrl || '',
        image_url: hotdealData.imageUrl || '',
        thumbnail_url: hotdealData.thumbnailImageUrl || '',
        views: hotdealData.viewCount || 0,
        like_count: hotdealData.likeCount || 0,
        comment_count: hotdealData.commentCount || 0,
        status: hotdealData.status || 'active',
        is_free_shipping: hotdealData.shipping?.isFree || false,
        author_name: hotdealData.authorName || 'Unknown',
        shopping_comment: hotdealData.shoppingComment || '',
        end_date: hotdealData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 기본 7일 후
        created_at: currentDate,
        updated_at: currentDate,
      }
      return SupabaseHotDealService.createHotDeal(insertData)
    },
    updateHotDeal: async (id: string, updates: any) => {
      return SupabaseHotDealService.updateHotDeal(id, updates)
    },
    deleteHotDeal: async (id: string) => {
      return SupabaseHotDealService.deleteHotDeal(id)
    },
    deleteAllHotDeals: async () => {
      // This is dangerous and should be protected
      return false
    },
    refetch: () => {
      // React Query handles refetching
    },
    findHotDeals: async (options: any) => {
      const result = await SupabaseHotDealService.getHotDeals(options)
      return result.data
    }
  }
}