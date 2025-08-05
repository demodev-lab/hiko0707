'use client'

/**
 * @deprecated 이 훅은 더 이상 사용하지 마세요!
 * 
 * ⚠️ DEPRECATED: use-favorites.ts는 LocalStorage 기반 시스템을 사용합니다.
 * 
 * 🔄 대신 사용할 훅:
 * - useSupabaseFavorites() - 완전한 Supabase 기반 찜하기 시스템 (user_favorite_hotdeals 테이블)
 * 
 * 📋 마이그레이션 가이드:
 * 기존: const { data: favorites } = useFavorites('hotdeal')
 * 신규: const { favorites } = useSupabaseFavorites()
 * 
 * 기존: const { mutate: toggleFavorite } = useToggleFavorite()
 * 신규: const { toggleFavoriteAsync } = useSupabaseFavorites()
 * 
 * 이 파일은 Phase 4에서 완전히 제거될 예정입니다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

// Favorite 타입 정의 (LocalStorage 의존성 제거)
interface Favorite {
  id: string
  userId: string
  itemId: string
  itemType: 'hotdeal' | 'product'
  createdAt: Date
  metadata?: {
    title?: string
    image?: string
    price?: number
    discount?: number
  }
}

export function useFavorites(itemType?: 'hotdeal' | 'product') {
  const { currentUser } = useAuth()
  
  return useQuery({
    queryKey: ['favorites', currentUser?.id, itemType],
    queryFn: async () => {
      if (!currentUser) return []
      // Deprecated - LocalStorage removed
      console.warn('useFavorites is deprecated. Use useSupabaseFavorites instead.')
      return []
    },
    enabled: !!currentUser,
    staleTime: 1 * 60 * 1000 // 1분
  })
}

export function useFavoriteIds(itemType?: 'hotdeal' | 'product') {
  const { currentUser } = useAuth()
  
  return useQuery({
    queryKey: ['favorite-ids', currentUser?.id, itemType],
    queryFn: async () => {
      if (!currentUser) return []
      // Deprecated - LocalStorage removed
      console.warn('useFavoriteIds is deprecated. Use useSupabaseFavorites instead.')
      return []
    },
    enabled: !!currentUser,
    staleTime: 1 * 60 * 1000 // 1분
  })
}

export function useIsFavorited(itemId: string, itemType: 'hotdeal' | 'product') {
  const { currentUser } = useAuth()
  
  return useQuery({
    queryKey: ['is-favorited', currentUser?.id, itemId, itemType],
    queryFn: async () => {
      if (!currentUser) return false
      // Deprecated - LocalStorage removed
      console.warn('useIsFavorited is deprecated. Use useSupabaseFavorites instead.')
      return false
    },
    enabled: !!currentUser && !!itemId,
    staleTime: 1 * 60 * 1000 // 1분
  })
}

export function useFavoriteCount(itemId: string, itemType: 'hotdeal' | 'product') {
  return useQuery({
    queryKey: ['favorite-count', itemId, itemType],
    queryFn: async () => {
      // Deprecated - LocalStorage removed
      console.warn('useFavoriteCount is deprecated. Use useSupabaseFavorites instead.')
      return 0
    },
    enabled: !!itemId,
    staleTime: 1 * 60 * 1000 // 1분
  })
}

export function useToggleFavorite() {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      itemId, 
      itemType, 
      metadata 
    }: { 
      itemId: string
      itemType: 'hotdeal' | 'product'
      metadata?: Favorite['metadata']
    }) => {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다')
      }
      
      // Deprecated - LocalStorage removed
      console.warn('useToggleFavorite is deprecated. Use useSupabaseFavorites instead.')
      throw new Error('LocalStorage favorites is no longer supported. Please use Supabase.')
    },
    onSuccess: (result, variables) => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
    },
    onError: (error) => {
      if (error.message === '로그인이 필요합니다') {
        toast.error('로그인 후 이용해주세요')
      } else {
        toast.error('오류가 발생했습니다')
      }
    }
  })
}

export function useDeleteFavorite() {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (favoriteId: string) => {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다')
      }
      
      // Deprecated - LocalStorage removed
      console.warn('useDeleteFavorite is deprecated. Use useSupabaseFavorites instead.')
      throw new Error('LocalStorage favorites is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    }
  })
}