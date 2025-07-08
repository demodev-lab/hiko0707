'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db/database-service'
import { Favorite } from '@/lib/db/local/repositories/favorite-repository'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

export function useFavorites(itemType?: 'hotdeal' | 'product') {
  const { currentUser } = useAuth()
  
  return useQuery({
    queryKey: ['favorites', currentUser?.id, itemType],
    queryFn: async () => {
      if (!currentUser) return []
      const favorites = await db.favorites.findByUserId(currentUser.id)
      return itemType ? favorites.filter(fav => fav.itemType === itemType) : favorites
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
      return await db.favorites.getFavoriteIds(currentUser.id, itemType)
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
      return await db.favorites.isFavorited(currentUser.id, itemId, itemType)
    },
    enabled: !!currentUser && !!itemId,
    staleTime: 1 * 60 * 1000 // 1분
  })
}

export function useFavoriteCount(itemId: string, itemType: 'hotdeal' | 'product') {
  return useQuery({
    queryKey: ['favorite-count', itemId, itemType],
    queryFn: async () => {
      return await db.favorites.countByItem(itemId, itemType)
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
      
      return await db.favorites.toggle(currentUser.id, itemId, itemType, metadata)
    },
    onSuccess: (result, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] })
      queryClient.invalidateQueries({ queryKey: ['is-favorited', currentUser?.id, variables.itemId, variables.itemType] })
      queryClient.invalidateQueries({ queryKey: ['favorite-count', variables.itemId, variables.itemType] })
      
      // 토스트 메시지
      if (result.added) {
        toast.success('찜 목록에 추가되었습니다')
      } else {
        toast.info('찜 목록에서 제거되었습니다')
      }
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
      
      const favorite = await db.favorites.findById(favoriteId)
      if (!favorite) {
        throw new Error('찜 항목을 찾을 수 없습니다')
      }
      
      if (favorite.userId !== currentUser.id) {
        throw new Error('권한이 없습니다')
      }
      
      return await db.favorites.delete(favoriteId)
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] })
      queryClient.invalidateQueries({ queryKey: ['is-favorited'] })
      queryClient.invalidateQueries({ queryKey: ['favorite-count'] })
      
      toast.success('찜 목록에서 제거되었습니다')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    }
  })
}