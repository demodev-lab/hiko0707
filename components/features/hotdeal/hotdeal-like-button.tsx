'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useHotDealLike } from '@/hooks/use-hotdeals'

interface HotDealLikeButtonProps {
  hotdealId: string
  initialCount: number
}

export function HotDealLikeButton({ hotdealId, initialCount }: HotDealLikeButtonProps) {
  const { isLiked, toggleLike, isLoading } = useHotDealLike(hotdealId)
  const [count, setCount] = useState(initialCount)

  const handleClick = async () => {
    toggleLike()
    setCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  return (
    <Button 
      variant={isLiked ? 'default' : 'outline'} 
      className="flex-1"
      onClick={handleClick}
      disabled={isLoading}
    >
      <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
      찜하기 {count}
    </Button>
  )
}