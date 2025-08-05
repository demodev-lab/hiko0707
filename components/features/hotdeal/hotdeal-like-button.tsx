'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useHotdealLikeStatus, useLikeHotdeal, useUnlikeHotdeal } from '@/hooks/use-supabase-community'
import { toast } from 'sonner'

interface HotDealLikeButtonProps {
  hotdealId: string
  initialCount: number
}

export function HotDealLikeButton({ hotdealId, initialCount }: HotDealLikeButtonProps) {
  const { user } = useUser()
  const [count, setCount] = useState(initialCount)
  
  // Supabase 기반 좋아요 상태 및 mutations
  const { data: isLiked = false, isLoading: statusLoading } = useHotdealLikeStatus(
    hotdealId, 
    user?.id || ''
  )
  const likeMutation = useLikeHotdeal()
  const unlikeMutation = useUnlikeHotdeal()
  
  const isLoading = statusLoading || likeMutation.isPending || unlikeMutation.isPending

  const handleClick = useCallback(async () => {
    if (!user) {
      toast.error('로그인이 필요합니다')
      return
    }

    try {
      if (isLiked) {
        await unlikeMutation.mutateAsync({ hotdealId, userId: user.id })
        setCount(prev => prev - 1)
        toast.success('찜하기를 취소했습니다')
      } else {
        await likeMutation.mutateAsync({ hotdealId, userId: user.id })
        setCount(prev => prev + 1)
        toast.success('찜하기에 추가했습니다')
      }
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error)
      toast.error('처리 중 오류가 발생했습니다')
    }
  }, [user, isLiked, hotdealId, likeMutation, unlikeMutation])

  return (
    <Button 
      variant={isLiked ? 'default' : 'outline'} 
      className="flex-1"
      onClick={handleClick}
      disabled={isLoading || !user}
    >
      <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
      찜하기 {count}
    </Button>
  )
}