'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db/database-service'
import { useAuth } from './use-auth'
import { toast } from 'sonner'
import { HotDealComment } from '@/lib/db/local/repositories/hotdeal-comment-repository'

export function useHotDealComments(hotdealId: string) {
  return useQuery({
    queryKey: ['hotdeal-comments', hotdealId],
    queryFn: async () => {
      return await db.hotdealComments.getNestedComments(hotdealId)
    },
    enabled: !!hotdealId,
    staleTime: 1 * 60 * 1000 // 1분
  })
}

export function useCreateComment() {
  const { currentUser } = useAuth()
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
      
      return await db.hotdealComments.createComment({
        hotdealId,
        userId: currentUser.id,
        content,
        parentId
      })
    },
    onSuccess: (data) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', data.hotdealId] })
      queryClient.invalidateQueries({ queryKey: ['hotdeal', data.hotdealId] })
      
      toast.success('댓글이 작성되었습니다')
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
  const { currentUser } = useAuth()
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
      
      const comment = await db.hotdealComments.findById(commentId)
      if (!comment) {
        throw new Error('댓글을 찾을 수 없습니다')
      }
      
      if (comment.userId !== currentUser.id) {
        throw new Error('수정 권한이 없습니다')
      }
      
      return await db.hotdealComments.updateComment(commentId, content)
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', data.hotdealId] })
        toast.success('댓글이 수정되었습니다')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '댓글 수정에 실패했습니다')
    }
  })
}

export function useDeleteComment() {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다')
      }
      
      const comment = await db.hotdealComments.findById(commentId)
      if (!comment) {
        throw new Error('댓글을 찾을 수 없습니다')
      }
      
      if (comment.userId !== currentUser.id) {
        throw new Error('삭제 권한이 없습니다')
      }
      
      const success = await db.hotdealComments.deleteComment(commentId)
      if (!success) {
        throw new Error('댓글 삭제에 실패했습니다')
      }
      
      return comment.hotdealId
    },
    onSuccess: (hotdealId) => {
      queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', hotdealId] })
      queryClient.invalidateQueries({ queryKey: ['hotdeal', hotdealId] })
      toast.success('댓글이 삭제되었습니다')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '댓글 삭제에 실패했습니다')
    }
  })
}

export function useLikeComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      commentId, 
      isLiked 
    }: { 
      commentId: string
      isLiked: boolean 
    }) => {
      const result = isLiked 
        ? await db.hotdealComments.unlikeComment(commentId)
        : await db.hotdealComments.likeComment(commentId)
        
      if (!result) {
        throw new Error('좋아요 처리에 실패했습니다')
      }
      
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', data.hotdealId] })
    },
    onError: () => {
      toast.error('좋아요 처리에 실패했습니다')
    }
  })
}