'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { useHotDealComments } from '@/hooks/use-supabase-hotdeal-comments'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'
import { CommentNotification } from './comment-notification'
import { CommentListSkeleton } from './comment-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Database } from '@/database.types'

type CommentRow = Database['public']['Tables']['hot_deal_comments']['Row']
interface NestedComment extends CommentRow {
  replies?: NestedComment[]
  user?: {
    name: string
    email: string
    avatar_url?: string
  }
}

interface CommentSectionProps {
  hotdealId: string
  commentCount?: number
}

export function CommentSection({ hotdealId, commentCount = 0 }: CommentSectionProps) {
  const { data: comments = [], isLoading, isFetching } = useHotDealComments(hotdealId)
  const previousCount = useRef(0)
  const sectionRef = useRef<HTMLDivElement>(null)
  
  // 총 댓글 수 계산 (중첩 댓글 포함)
  const getTotalCommentCount = (commentList: NestedComment[]): number => {
    return commentList.reduce((total, comment) => {
      return total + 1 + (comment.replies ? getTotalCommentCount(comment.replies) : 0)
    }, 0)
  }
  
  const totalComments = getTotalCommentCount(comments)
  
  // 이전 댓글 수 추적
  useEffect(() => {
    if (totalComments > 0 && previousCount.current === 0) {
      previousCount.current = totalComments
    }
  }, [totalComments])
  
  // 댓글 정렬 (최신순으로만)
  const processComments = (commentList: NestedComment[]): NestedComment[] => {
    let sorted = [...commentList]
    
    // 최신순 정렬
    sorted.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    
    // 중첩 댓글도 정렬
    return sorted.map(comment => ({
      ...comment,
      replies: comment.replies ? processComments(comment.replies) : undefined
    }))
  }
  
  const processedComments = processComments(comments)
  
  const handleNewCommentClick = () => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    previousCount.current = totalComments
  }
  
  if (isLoading) {
    return <CommentListSkeleton count={3} />
  }
  
  return (
    <div className="space-y-6" ref={sectionRef}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            댓글 
            <Badge variant="secondary" className="ml-1">
              {totalComments > 0 ? totalComments : commentCount}
            </Badge>
          </h2>
          {isFetching && !isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>새로고침 중...</span>
            </div>
          )}
        </div>
        
      </div>
      
      {/* 댓글 작성 폼 */}
      <Card>
        <CardContent className="pt-6">
          <CommentForm hotdealId={hotdealId} />
        </CardContent>
      </Card>
      
      {/* 댓글 목록 */}
      {processedComments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
            <p>첫 번째 댓글을 작성해보세요!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {processedComments.map(comment => (
            <Card 
              key={comment.id}
              className="transition-all duration-200 hover:shadow-md"
            >
              <CardContent className="p-4">
                <CommentItem
                  comment={comment}
                  hotdealId={hotdealId}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* 새 댓글 알림 */}
      <CommentNotification
        currentCount={totalComments}
        previousCount={previousCount.current}
        onNewComment={handleNewCommentClick}
      />
    </div>
  )
}