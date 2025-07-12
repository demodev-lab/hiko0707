'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useCreateComment } from '@/hooks/use-hotdeal-comments'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface CommentFormProps {
  hotdealId: string
  parentId?: string
  onSuccess?: () => void
  onCancel?: () => void
  placeholder?: string
}

export function CommentForm({ 
  hotdealId, 
  parentId, 
  onSuccess, 
  onCancel,
  placeholder = '댓글을 작성해주세요...'
}: CommentFormProps) {
  const router = useRouter()
  const { isAuthenticated, currentUser } = useAuth()
  const [content, setContent] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const createComment = useCreateComment()
  
  const maxLength = 500
  const remainingChars = maxLength - content.length
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }
    
    if (!content.trim()) {
      toast.error('댓글 내용을 입력해주세요')
      return
    }
    
    try {
      await createComment.mutateAsync({
        hotdealId,
        content: content.trim(),
        parentId
      })
      
      setContent('')
      onSuccess?.()
    } catch (error) {
      // Error handled in mutation
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={!isAuthenticated ? '로그인 후 댓글을 작성하실 수 있습니다' : placeholder}
          rows={parentId ? 2 : 3}
          className={`resize-none transition-all ${
            !isAuthenticated ? 'opacity-60 cursor-not-allowed' : ''
          } ${isFocused ? 'ring-2 ring-blue-500' : ''}`}
          disabled={createComment.isPending || !isAuthenticated}
          maxLength={maxLength}
        />
        {isFocused && content.length > 0 && (
          <div className={`absolute bottom-2 right-2 text-xs ${
            remainingChars < 50 ? 'text-red-500' : 'text-gray-400'
          }`}>
            {remainingChars}자 남음
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {currentUser && (
            <span>작성자: {currentUser.name}</span>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={createComment.isPending}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || createComment.isPending || !isAuthenticated}
          >
            {createComment.isPending ? '작성 중...' : parentId ? '답글 작성' : '댓글 작성'}
          </Button>
        </div>
      </div>
    </form>
  )
}