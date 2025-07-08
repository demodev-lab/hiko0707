'use client'

import { MessageCircle } from 'lucide-react'
import { useHotDealComments } from '@/hooks/use-hotdeal-comments'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface CommentSectionProps {
  hotdealId: string
  commentCount?: number
}

export function CommentSection({ hotdealId, commentCount = 0 }: CommentSectionProps) {
  const { data: comments = [], isLoading } = useHotDealComments(hotdealId)
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          댓글
        </h2>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        댓글 {comments.length > 0 ? comments.length : commentCount}개
      </h2>
      
      {/* 댓글 작성 폼 */}
      <Card>
        <CardContent className="pt-6">
          <CommentForm hotdealId={hotdealId} />
        </CardContent>
      </Card>
      
      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
            <p>첫 번째 댓글을 작성해보세요!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <Card key={comment.id}>
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
    </div>
  )
}