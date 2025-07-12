'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MessageCircle, Edit2, Trash2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { HotDealComment } from '@/lib/db/local/repositories/hotdeal-comment-repository'
import { useAuth } from '@/hooks/use-auth'
import { useUpdateComment, useDeleteComment, useLikeComment } from '@/hooks/use-hotdeal-comments'
import { CommentForm } from './comment-form'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Animated, AnimatedButton } from '@/components/ui/animated'

interface CommentItemProps {
  comment: HotDealComment & { replies?: HotDealComment[] }
  hotdealId: string
  level?: number
}

export function CommentItem({ comment, hotdealId, level = 0 }: CommentItemProps) {
  const { currentUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const isLiked = currentUser && comment.likedByUsers?.includes(currentUser.id) || false
  
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const likeComment = useLikeComment()
  
  const isOwner = currentUser?.id === comment.userId
  const userName = comment.user?.name || 'Anonymous'
  const userInitial = userName.charAt(0).toUpperCase()
  
  const handleUpdate = async () => {
    if (!editContent.trim()) return
    
    try {
      await updateComment.mutateAsync({
        commentId: comment.id,
        content: editContent.trim()
      })
      setIsEditing(false)
    } catch (error) {
      // Error handled in mutation
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    
    try {
      await deleteComment.mutateAsync(comment.id)
    } catch (error) {
      // Error handled in mutation
    }
  }
  
  const handleLike = async () => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다')
      return
    }
    
    try {
      await likeComment.mutateAsync({
        commentId: comment.id,
        isLiked
      })
    } catch (error) {
      // Error handled in mutation
    }
  }
  
  return (
    <Animated 
      variant="fadeInUp" 
      delay={level * 0.1}
      className={cn("space-y-3", level > 0 && "ml-12 mt-3")}
    >
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.user?.image} />
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{userName}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { 
                  locale: ko, 
                  addSuffix: true 
                })}
              </span>
              {comment.updatedAt > comment.createdAt && (
                <span className="text-xs text-gray-400">(수정됨)</span>
              )}
            </div>
            
            {isOwner && !comment.isDeleted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-3 h-3 mr-2" />
                    수정
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(comment.content)
                  }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={!editContent.trim() || updateComment.isPending}
                >
                  {updateComment.isPending ? '수정 중...' : '수정'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
              
              {!comment.isDeleted && (
                <div className="flex items-center gap-4 pt-1">
                  <AnimatedButton
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-auto p-0 text-xs hover:bg-transparent transition-all",
                      isLiked && "text-red-500"
                    )}
                    onClick={handleLike}
                    disabled={likeComment.isPending}
                    tapScale={0.9}
                  >
                    <Heart 
                      className={cn(
                        "w-3 h-3 mr-1 transition-all",
                        isLiked && "fill-red-500 text-red-500",
                        likeComment.isPending && "animate-pulse"
                      )} 
                    />
                    <span className={cn(
                      "transition-all",
                      comment.likeCount > 0 ? "opacity-100" : "opacity-0"
                    )}>
                      {comment.likeCount > 0 && comment.likeCount}
                    </span>
                  </AnimatedButton>
                  
                  {level < 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs hover:bg-transparent"
                      onClick={() => setIsReplying(!isReplying)}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      답글
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {isReplying && (
        <div className="ml-11">
          <CommentForm
            hotdealId={hotdealId}
            parentId={comment.id}
            placeholder="답글을 작성해주세요..."
            onSuccess={() => setIsReplying(false)}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              hotdealId={hotdealId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </Animated>
  )
}