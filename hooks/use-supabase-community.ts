'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { SupabaseCommentService } from '@/lib/services/supabase-comment-service'
import { SupabaseLikeService } from '@/lib/services/supabase-like-service'
import { SupabaseFavoriteService } from '@/lib/services/supabase-favorite-service'
import type { Database } from '@/database.types'

// 타입 정의
type CommentRow = Database['public']['Tables']['hot_deal_comments']['Row']
type CommentInsert = Database['public']['Tables']['hot_deal_comments']['Insert']
type HotDealLikeRow = Database['public']['Tables']['hot_deal_likes']['Row']
type UserFavoriteHotDealRow = Database['public']['Tables']['user_favorite_hotdeals']['Row']
type HotDealRow = Database['public']['Tables']['hot_deals']['Row']

// Query Keys
const COMMUNITY_KEYS = {
  // 댓글 관련
  comments: (hotdealId: string) => ['comments', hotdealId] as const,
  topLevelComments: (hotdealId: string) => ['comments', 'top-level', hotdealId] as const,
  replies: (parentCommentId: string) => ['comments', 'replies', parentCommentId] as const,
  userComments: (userId: string) => ['comments', 'user', userId] as const,
  commentStats: (hotdealId?: string) => ['comments', 'stats', hotdealId] as const,
  
  // 좋아요 관련
  likedHotdeals: (userId: string) => ['likes', 'user', userId] as const,
  hotdealLikeStatus: (hotdealId: string, userId: string) => ['likes', 'status', hotdealId, userId] as const,
  hotdealLikeUsers: (hotdealId: string) => ['likes', 'users', hotdealId] as const,
  likeStats: (hotdealId?: string) => ['likes', 'stats', hotdealId] as const,
  userLikeStats: (userId: string) => ['likes', 'user-stats', userId] as const,
  popularHotdeals: (options?: any) => ['hotdeals', 'popular', options] as const,
  
  // 즐겨찾기 관련
  favorites: (userId: string) => ['favorites', 'user', userId] as const,
  favoritesByCategory: (userId: string) => ['favorites', 'by-category', userId] as const,
  favoriteStatus: (hotdealId: string, userId: string) => ['favorites', 'status', hotdealId, userId] as const,
  favoriteStats: (userId: string) => ['favorites', 'stats', userId] as const,
  recommendedHotdeals: (userId: string) => ['favorites', 'recommended', userId] as const,
} as const

/**
 * 댓글 관련 hooks
 */
export function useComments(hotdealId: string, options?: {
  limit?: number
  offset?: number
  includeDeleted?: boolean
}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: COMMUNITY_KEYS.comments(hotdealId),
    queryFn: () => SupabaseCommentService.getCommentsByHotdeal(hotdealId, options),
    staleTime: 1000 * 60 * 2, // 2분
  })

  // 실시간 댓글 구독 - 페이지 가시성 기반 최적화
  useEffect(() => {
    if (!hotdealId) return

    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel(`comments-${hotdealId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hot_deal_comments',
            filter: `hotdeal_id=eq.${hotdealId}`
          },
          (payload) => {
            console.log('댓글 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.comments(hotdealId) })
            queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.commentStats(hotdealId) })
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
  }, [hotdealId, queryClient])

  return query
}

export function useTopLevelComments(hotdealId: string, options?: {
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.topLevelComments(hotdealId),
    queryFn: () => SupabaseCommentService.getTopLevelComments(hotdealId, options),
    staleTime: 1000 * 60 * 2,
  })
}

export function useReplies(parentCommentId: string) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.replies(parentCommentId),
    queryFn: () => SupabaseCommentService.getReplies(parentCommentId),
    staleTime: 1000 * 60 * 2,
  })
}

export function useUserComments(userId: string, options?: {
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.userComments(userId),
    queryFn: () => SupabaseCommentService.getCommentsByUser(userId, options),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

export function useCommentStats(hotdealId?: string) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.commentStats(hotdealId),
    queryFn: () => SupabaseCommentService.getCommentStats(hotdealId),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * 댓글 작성/수정/삭제 mutations
 */
export function useCreateComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<CommentInsert, 'created_at' | 'updated_at'>) => 
      SupabaseCommentService.createComment(data),
    onSuccess: (newComment) => {
      if (newComment) {
        // 관련 쿼리들 무효화
        queryClient.invalidateQueries({ queryKey: ['comments'] })
        queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.commentStats() })
        if (newComment.hotdeal_id) {
          queryClient.invalidateQueries({ 
            queryKey: COMMUNITY_KEYS.commentStats(newComment.hotdeal_id) 
          })
        }
      }
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, updates }: { 
      commentId: string
      updates: Pick<Database['public']['Tables']['hot_deal_comments']['Update'], 'content'>
    }) => SupabaseCommentService.updateComment(commentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (commentId: string) => SupabaseCommentService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.commentStats() })
    },
  })
}

export function useLikeComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, userId }: { commentId: string; userId: string }) =>
      SupabaseCommentService.likeComment(commentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}

export function useUnlikeComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, userId }: { commentId: string; userId: string }) =>
      SupabaseCommentService.unlikeComment(commentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}

/**
 * 좋아요 관련 hooks
 */
export function useLikedHotdeals(userId: string, options?: {
  limit?: number
  offset?: number
}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: COMMUNITY_KEYS.likedHotdeals(userId),
    queryFn: () => SupabaseLikeService.getLikedHotDealsByUser(userId, options),
    staleTime: 1000 * 60 * 5,
  })

  // 실시간 좋아요 구독 - throttling과 페이지 가시성 기반 최적화
  useEffect(() => {
    if (!userId) return

    const isVisible = () => !document.hidden
    let channel: any = null
    let throttleTimeout: NodeJS.Timeout | null = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel(`likes-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hot_deal_likes',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            // 좋아요 업데이트는 2초 throttling 적용
            if (throttleTimeout) {
              clearTimeout(throttleTimeout)
            }
            
            throttleTimeout = setTimeout(() => {
              console.log('좋아요 실시간 업데이트:', payload)
              queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.likedHotdeals(userId) })
              queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.userLikeStats(userId) })
              // 인기 핫딜 쿼리는 덜 자주 업데이트
              if (Math.random() < 0.3) { // 30% 확률로만 업데이트
                queryClient.invalidateQueries({ queryKey: ['hotdeals', 'popular'] })
              }
            }, 2000)
          }
        )
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (isVisible()) {
        setupSubscription()
      } else {
        if (channel) {
          supabase().removeChannel(channel)
          channel = null
        }
        if (throttleTimeout) {
          clearTimeout(throttleTimeout)
          throttleTimeout = null
        }
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
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, queryClient])

  return query
}

export function useHotdealLikeStatus(hotdealId: string, userId: string) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.hotdealLikeStatus(hotdealId, userId),
    queryFn: () => SupabaseLikeService.isHotDealLikedByUser(hotdealId, userId),
    staleTime: 1000 * 60 * 2,
    enabled: !!userId, // userId가 있을 때만 실행
  })
}

export function useHotdealLikeUsers(hotdealId: string, options?: {
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.hotdealLikeUsers(hotdealId),
    queryFn: () => SupabaseLikeService.getUsersWhoLikedHotDeal(hotdealId, options),
    staleTime: 1000 * 60 * 5,
  })
}

export function useHotdealLikeStats(hotdealId?: string) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.likeStats(hotdealId),
    queryFn: () => SupabaseLikeService.getHotDealLikeStats(hotdealId),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUserLikeStats(userId: string) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.userLikeStats(userId),
    queryFn: () => SupabaseLikeService.getUserLikeStats(userId),
    staleTime: 1000 * 60 * 10, // 10분
  })
}

export function usePopularHotdeals(options?: {
  limit?: number
  category?: string
  timeframe?: 'day' | 'week' | 'month' | 'all'
}) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.popularHotdeals(options),
    queryFn: () => SupabaseLikeService.getPopularHotDeals(options),
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * 좋아요 추가/제거 mutations
 */
export function useLikeHotdeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ hotdealId, userId }: { hotdealId: string; userId: string }) =>
      SupabaseLikeService.likeHotDeal(hotdealId, userId),
    onSuccess: (result, { hotdealId, userId }) => {
      if (result) {
        // 관련 쿼리들 무효화
        queryClient.invalidateQueries({ queryKey: ['likes'] })
        queryClient.invalidateQueries({ queryKey: ['hotdeals', 'popular'] })
        queryClient.setQueryData(
          COMMUNITY_KEYS.hotdealLikeStatus(hotdealId, userId),
          true
        )
      }
    },
  })
}

export function useUnlikeHotdeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ hotdealId, userId }: { hotdealId: string; userId: string }) =>
      SupabaseLikeService.unlikeHotDeal(hotdealId, userId),
    onSuccess: (success, { hotdealId, userId }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['likes'] })
        queryClient.invalidateQueries({ queryKey: ['hotdeals', 'popular'] })
        queryClient.setQueryData(
          COMMUNITY_KEYS.hotdealLikeStatus(hotdealId, userId),
          false
        )
      }
    },
  })
}

/**
 * 즐겨찾기 관련 hooks
 */
export function useFavoriteHotdeals(userId: string, options?: {
  limit?: number
  offset?: number
  category?: string
  sortBy?: 'created_at' | 'hot_deal_created' | 'price' | 'discount'
  sortOrder?: 'asc' | 'desc'
}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: COMMUNITY_KEYS.favorites(userId),
    queryFn: () => SupabaseFavoriteService.getFavoriteHotDealsByUser(userId, options),
    staleTime: 1000 * 60 * 5,
  })

  // 즐겨찾기는 실시간성이 덜 중요하므로 폴링으로 최적화
  // 실시간 구독 대신 5분마다 자동 새로고침 사용
  useEffect(() => {
    if (!userId) return

    // 페이지가 포커스될 때만 즐겨찾기 새로고침
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.favorites(userId) })
    }

    // 페이지 포커스 이벤트만 감지 (실시간 구독 제거)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [userId, queryClient])

  return query
}

export function useFavoritesByCategory(userId: string) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.favoritesByCategory(userId),
    queryFn: () => SupabaseFavoriteService.getFavoritesByCategory(userId),
    staleTime: 1000 * 60 * 10,
  })
}

export function useFavoriteStatus(hotdealId: string, userId: string) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.favoriteStatus(hotdealId, userId),
    queryFn: () => SupabaseFavoriteService.isHotDealFavorited(hotdealId, userId),
    staleTime: 1000 * 60 * 2,
    enabled: !!userId,
  })
}

export function useFavoriteStats(userId: string) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.favoriteStats(userId),
    queryFn: () => SupabaseFavoriteService.getUserFavoriteStats(userId),
    staleTime: 1000 * 60 * 10,
  })
}

export function useRecommendedHotdeals(userId: string, options?: {
  limit?: number
  excludeExpired?: boolean
}) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.recommendedHotdeals(userId),
    queryFn: () => SupabaseFavoriteService.getRecommendedHotDeals(userId, options),
    staleTime: 1000 * 60 * 15, // 15분
    enabled: !!userId,
  })
}

/**
 * 즐겨찾기 추가/제거 mutations
 */
export function useAddToFavorites() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ hotdealId, userId }: { hotdealId: string; userId: string }) =>
      SupabaseFavoriteService.addToFavorites(hotdealId, userId),
    onSuccess: (result, { hotdealId, userId }) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['favorites'] })
        queryClient.setQueryData(
          COMMUNITY_KEYS.favoriteStatus(hotdealId, userId),
          true
        )
      }
    },
  })
}

export function useRemoveFromFavorites() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ hotdealId, userId }: { hotdealId: string; userId: string }) =>
      SupabaseFavoriteService.removeFromFavorites(hotdealId, userId),
    onSuccess: (success, { hotdealId, userId }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['favorites'] })
        queryClient.setQueryData(
          COMMUNITY_KEYS.favoriteStatus(hotdealId, userId),
          false
        )
      }
    },
  })
}

export function useSyncFavorites() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: string) => SupabaseFavoriteService.syncUserFavorites(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

/**
 * 통합 커뮤니티 데이터 hook
 */
export function useCommunityData(hotdealId: string, userId?: string) {
  const comments = useComments(hotdealId, { limit: 20 })
  const commentStats = useCommentStats(hotdealId)
  const likeStatus = useHotdealLikeStatus(hotdealId, userId || '')
  const favoriteStatus = useFavoriteStatus(hotdealId, userId || '')
  const likeStats = useHotdealLikeStats(hotdealId)
  
  return {
    comments: comments.data || [],
    commentStats: commentStats.data,
    isLiked: likeStatus.data || false,
    isFavorited: favoriteStatus.data || false,
    likeStats: likeStats.data,
    isLoading: comments.isLoading || commentStats.isLoading || likeStatus.isLoading || favoriteStatus.isLoading,
    isError: comments.isError || commentStats.isError || likeStatus.isError || favoriteStatus.isError,
  }
}

/**
 * 사용자 활동 통계 hook
 */
export function useUserActivity(userId: string) {
  const userComments = useUserComments(userId, { limit: 10 })
  const likedHotdeals = useLikedHotdeals(userId, { limit: 10 })
  const favoriteHotdeals = useFavoriteHotdeals(userId, { limit: 10 })
  const userLikeStats = useUserLikeStats(userId)
  const favoriteStats = useFavoriteStats(userId)
  
  return {
    recentComments: userComments.data || [],
    recentLikes: likedHotdeals.data || [],
    recentFavorites: favoriteHotdeals.data || [],
    likeStats: userLikeStats.data,
    favoriteStats: favoriteStats.data,
    isLoading: userComments.isLoading || likedHotdeals.isLoading || favoriteHotdeals.isLoading,
    isError: userComments.isError || likedHotdeals.isError || favoriteHotdeals.isError,
  }
}