'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import { toast } from 'sonner'
import { useEffect } from 'react'
import type { Database } from '@/database.types'

type CommentRow = Database['public']['Tables']['hot_deal_comments']['Row']
type CommentInsert = Database['public']['Tables']['hot_deal_comments']['Insert']

interface NestedComment extends CommentRow {
  replies?: NestedComment[]
  user?: {
    name: string
    email: string
    avatar_url?: string
  }
}

export function useHotDealComments(hotdealId: string, enablePolling = true) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['hotdeal-comments', hotdealId],
    queryFn: async () => {
      // 모든 댓글 가져오기 (부모 + 자식)
      const { data: comments, error } = await supabase()
        .from('hot_deal_comments')
        .select(`
          *,
          users (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('hotdeal_id', hotdealId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) throw error

      // 중첩 구조로 변환
      const nestedComments: NestedComment[] = []
      const commentMap = new Map<string, NestedComment>()

      // 먼저 모든 댓글을 맵에 저장
      comments?.forEach(comment => {
        const nestedComment: NestedComment = {
          ...comment,
          user: comment.users ? {
            name: comment.users.name || 'Unknown',
            email: comment.users.email || '',
            avatar_url: comment.users.avatar_url
          } : undefined,
          replies: []
        }
        commentMap.set(comment.id, nestedComment)
      })

      // 부모-자식 관계 설정
      comments?.forEach(comment => {
        const nestedComment = commentMap.get(comment.id)!
        
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id)
          if (parent) {
            parent.replies!.push(nestedComment)
          }
        } else {
          nestedComments.push(nestedComment)
        }
      })

      return nestedComments
    },
    enabled: !!hotdealId,
    staleTime: 30 * 1000, // 30초
    refetchInterval: enablePolling ? 10 * 1000 : false // 10초마다 폴링
  })

  // 실시간 구독 설정
  useEffect(() => {
    if (!hotdealId) return

    const channel = supabase()
      .channel(`hotdeal-comments-${hotdealId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모든 이벤트
          schema: 'public',
          table: 'hot_deal_comments',
          filter: `hotdeal_id=eq.${hotdealId}`
        },
        (payload) => {
          console.log('댓글 실시간 업데이트:', payload)
          // 댓글 변경 시 해당 핫딜의 댓글 쿼리 무효화
          queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', hotdealId] })
          queryClient.invalidateQueries({ queryKey: ['hotdeal', hotdealId] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'hot_deal_comment_likes'
        },
        (payload) => {
          console.log('댓글 좋아요 실시간 업데이트:', payload)
          // 댓글 좋아요 변경 시 관련 쿼리 무효화
          queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', hotdealId] })
          queryClient.invalidateQueries({ queryKey: ['comment-likes'] })
        }
      )
      .subscribe()

    return () => {
      supabase().removeChannel(channel)
    }
  }, [hotdealId, queryClient])

  // Focus시 refetch (실시간 구독의 백업용)
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', hotdealId] })
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [hotdealId, queryClient])

  return query
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
      
      const commentData: CommentInsert = {
        hotdeal_id: hotdealId,
        user_id: currentUser.id,
        content,
        parent_id: parentId || null,
        is_deleted: false
      }

      const { data, error } = await supabase()
        .from('hot_deal_comments')
        .insert(commentData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', data.hotdeal_id] })
      queryClient.invalidateQueries({ queryKey: ['hotdeal', data.hotdeal_id] })
      
      // 댓글 수 업데이트
      updateCommentCount(data.hotdeal_id)
      
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
      
      // 댓글 소유권 확인
      const { data: comment, error: fetchError } = await supabase()
        .from('hot_deal_comments')
        .select('user_id, hotdeal_id')
        .eq('id', commentId)
        .single()

      if (fetchError || !comment) {
        throw new Error('댓글을 찾을 수 없습니다')
      }

      if (comment.user_id !== currentUser.id) {
        throw new Error('수정 권한이 없습니다')
      }

      // 댓글 업데이트
      const { data, error } = await supabase()
        .from('hot_deal_comments')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single()

      if (error) throw error
      return { ...data, hotdeal_id: comment.hotdeal_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', data.hotdeal_id] })
      toast.success('댓글이 수정되었습니다')
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
      
      // 댓글 소유권 확인
      const { data: comment, error: fetchError } = await supabase()
        .from('hot_deal_comments')
        .select('user_id, hotdeal_id')
        .eq('id', commentId)
        .single()

      if (fetchError || !comment) {
        throw new Error('댓글을 찾을 수 없습니다')
      }

      if (comment.user_id !== currentUser.id) {
        throw new Error('삭제 권한이 없습니다')
      }

      // Soft delete
      const { error } = await supabase()
        .from('hot_deal_comments')
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (error) throw error
      return comment.hotdeal_id
    },
    onSuccess: (hotdealId) => {
      queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', hotdealId] })
      queryClient.invalidateQueries({ queryKey: ['hotdeal', hotdealId] })
      
      // 댓글 수 업데이트
      updateCommentCount(hotdealId)
      
      toast.success('댓글이 삭제되었습니다')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '댓글 삭제에 실패했습니다')
    }
  })
}

export function useLikeComment() {
  const { currentUser } = useAuth()
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
      
      // 댓글 정보 가져오기
      const { data: comment } = await supabase()
        .from('hot_deal_comments')
        .select('hotdeal_id')
        .eq('id', commentId)
        .single()

      if (!comment) {
        throw new Error('댓글을 찾을 수 없습니다')
      }

      if (isLiked) {
        // 좋아요 취소
        const { error } = await supabase()
          .from('hot_deal_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id)

        if (error) throw error
      } else {
        // 좋아요 추가
        const { error } = await supabase()
          .from('hot_deal_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUser.id
          })

        if (error) {
          // 이미 좋아요한 경우 무시
          if (error.code !== '23505') {
            throw error
          }
        }
      }

      // 좋아요 수 업데이트
      await updateCommentLikeCount(commentId)

      return comment.hotdeal_id
    },
    onSuccess: (hotdealId) => {
      queryClient.invalidateQueries({ queryKey: ['hotdeal-comments', hotdealId] })
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

// 헬퍼 함수들
async function updateCommentCount(hotdealId: string) {
  try {
    const { count } = await supabase()
      .from('hot_deal_comments')
      .select('id', { count: 'exact', head: true })
      .eq('hotdeal_id', hotdealId)
      .eq('is_deleted', false)

    await supabase()
      .from('hot_deals')
      .update({ comment_count: count || 0 })
      .eq('id', hotdealId)
  } catch (error) {
    console.error('댓글 수 업데이트 오류:', error)
  }
}

async function updateCommentLikeCount(commentId: string) {
  try {
    const { count } = await supabase()
      .from('hot_deal_comment_likes')
      .select('id', { count: 'exact', head: true })
      .eq('comment_id', commentId)

    await supabase()
      .from('hot_deal_comments')
      .update({ like_count: count || 0 })
      .eq('id', commentId)
  } catch (error) {
    console.error('댓글 좋아요 수 업데이트 오류:', error)
  }
}

// 사용자가 댓글에 좋아요했는지 확인
export function useCommentLikes(commentIds: string[]) {
  const { currentUser } = useAuth()
  
  return useQuery({
    queryKey: ['comment-likes', currentUser?.id, ...commentIds],
    queryFn: async () => {
      if (!currentUser || commentIds.length === 0) return {}
      
      const { data, error } = await supabase()
        .from('hot_deal_comment_likes')
        .select('comment_id')
        .in('comment_id', commentIds)
        .eq('user_id', currentUser.id)

      if (error) throw error

      // comment_id를 키로 하는 객체로 변환
      const likedMap: Record<string, boolean> = {}
      data?.forEach(like => {
        likedMap[like.comment_id] = true
      })

      return likedMap
    },
    enabled: !!currentUser && commentIds.length > 0
  })
}