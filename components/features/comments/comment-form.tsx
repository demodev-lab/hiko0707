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
  const { isAuthenticated } = useAuth()
  const [content, setContent] = useState('')
  const createComment = useCreateComment()
  
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
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="resize-none"
        disabled={createComment.isPending}
      />
      <div className="flex justify-end gap-2">
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
          disabled={!content.trim() || createComment.isPending}
        >
          {createComment.isPending ? '작성 중...' : '댓글 작성'}
        </Button>
      </div>
    </form>
  )
}