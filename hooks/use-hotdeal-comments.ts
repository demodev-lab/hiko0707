'use client'

/**
 * @deprecated 이 훅은 더 이상 사용하지 마세요!
 * 
 * ⚠️ DEPRECATED: use-hotdeal-comments.ts는 LocalStorage 기반 시스템을 사용합니다.
 * 
 * 🔄 대신 사용할 훅:
 * - useSupabaseHotdealComments() - 완전한 Supabase 기반 댓글 시스템 (hot_deal_comments 테이블)
 * 
 * 📋 마이그레이션 가이드:
 * 기존: const { data: comments } = useHotDealComments(hotdealId)
 * 신규: const { comments } = useSupabaseHotdealComments(hotdealId)
 * 
 * 기존: const { mutate: createComment } = useCreateComment()
 * 신규: const { createCommentAsync } = useSupabaseHotdealComments(hotdealId)
 * 
 * 이 파일은 Phase 4에서 완전히 제거될 예정입니다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabaseUser } from './use-supabase-user'
import { toast } from 'sonner'
import { useEffect } from 'react'

// HotDealComment 타입 정의 (LocalStorage 의존성 제거)
interface HotDealComment {
  id: string
  hotdealId: string
  userId: string
  content: string
  parentId?: string // For nested comments
  likeCount: number
  likedByUsers?: string[] // Array of user IDs who liked this comment
  createdAt: Date
  updatedAt: Date
  isDeleted?: boolean
  deletedAt?: Date
  user?: {
    id: string
    name: string
    image?: string
  }
}

export function useHotDealComments(hotdealId: string, enablePolling = true) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['hotdeal-comments', hotdealId],
    queryFn: async () => {
      // Deprecated - LocalStorage removed
      console.warn('useHotDealComments is deprecated. Use useSupabaseHotdealComments instead.')
      return []
    },
    enabled: !!hotdealId,
    staleTime: 30 * 1000, // 30초
    refetchInterval: enablePolling ? 10 * 1000 : false // 10초마다 폴링
  })

  // Focus시 refetch
  useEffect(() => {
    if (!enablePolling) return

    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', hotdealId] })
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [hotdealId, queryClient, enablePolling])

  return query
}

export function useCreateComment() {
  const { user: currentUser } = useSupabaseUser()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      hotdealId, 
      content, 
      parentId 
    }: { 
      hotdealId: string
      content: string
      parentId?: string 
    }) => {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다')
      }
      
      // Deprecated - LocalStorage removed
      console.warn('useCreateComment is deprecated. Use useSupabaseHotdealComments instead.')
      throw new Error('LocalStorage comments is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
    },
    onError: (error) => {
      if (error.message === '로그인이 필요합니다') {
        toast.error('로그인 후 이용해주세요')
      } else {
        toast.error('댓글 작성에 실패했습니다')
      }
    }
  })
}

export function useUpdateComment() {
  const { user: currentUser } = useSupabaseUser()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      commentId, 
      content 
    }: { 
      commentId: string
      content: string 
    }) => {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다')
      }
      
      // Deprecated - LocalStorage removed
      console.warn('useUpdateComment is deprecated. Use useSupabaseHotdealComments instead.')
      throw new Error('LocalStorage comments is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '댓글 수정에 실패했습니다')
    }
  })
}

export function useDeleteComment() {
  const { user: currentUser } = useSupabaseUser()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다')
      }
      
      // Deprecated - LocalStorage removed
      console.warn('useDeleteComment is deprecated. Use useSupabaseHotdealComments instead.')
      throw new Error('LocalStorage comments is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '댓글 삭제에 실패했습니다')
    }
  })
}

export function useLikeComment() {
  const { user: currentUser } = useSupabaseUser()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      commentId, 
      isLiked 
    }: { 
      commentId: string
      isLiked: boolean 
    }) => {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다')
      }
      
      // Deprecated - LocalStorage removed
      console.warn('useLikeComment is deprecated. Use useSupabaseHotdealComments instead.')
      throw new Error('LocalStorage comments is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
    },
    onError: (error) => {
      if (error.message === '로그인이 필요합니다') {
        toast.error('로그인 후 이용해주세요')
      } else {
        toast.error('좋아요 처리에 실패했습니다')
      }
    }
  })
}