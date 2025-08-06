'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToggleFavoriteHotDeal, useUserFavoriteHotDeals } from '@/hooks/use-supabase-hotdeals'
import { useClerkRole } from '@/hooks/use-clerk-role'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { useRouter } from 'next/navigation'

// Favorite 타입 정의 (LocalStorage 의존성 제거)
interface Favorite {
  id: string
  userId: string
  itemId: string
  itemType: 'hotdeal' | 'product'
  createdAt: Date
  metadata?: {
    title?: string
    image?: string
    price?: number
    discount?: number
  }
}

interface FavoriteButtonProps {
  itemId: string
  itemType: 'hotdeal' | 'product'
  metadata?: Favorite['metadata']
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'icon'
  className?: string
}

export function FavoriteButton({
  itemId,
  itemType,
  metadata,
  showCount = false,
  size = 'md',
  variant = 'default',
  className
}: FavoriteButtonProps) {
  const router = useRouter()
  const { isAuthenticated } = useClerkRole()
  const { user } = useSupabaseUser()
  const { data: userFavorites = [] } = useUserFavoriteHotDeals(user?.id || '')
  const toggleFavorite = useToggleFavoriteHotDeal()
  const [isAnimating, setIsAnimating] = useState(false)
  
  // 현재 아이템이 찜 목록에 있는지 확인
  const isFavorited = userFavorites.some(fav => fav.id === itemId)
  // favoriteCount 기능은 현재 Supabase 서비스에 없으므로 제거
  const favoriteCount = 0
  
  const handleToggle = async () => {
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }
    
    setIsAnimating(true)
    try {
      await toggleFavorite.mutateAsync({ hotdealId: itemId, userId: user.id })
    } finally {
      setTimeout(() => setIsAnimating(false), 300)
    }
  }
  
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size]
  
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={toggleFavorite.isPending}
        className={cn(
          'relative group',
          className
        )}
      >
        <Heart
          className={cn(
            iconSize,
            'transition-all duration-300',
            isAnimating && 'scale-125',
            isFavorited 
              ? 'fill-red-500 text-red-500' 
              : 'text-gray-500 group-hover:text-red-500'
          )}
        />
        {showCount && favoriteCount > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {favoriteCount > 99 ? '99+' : favoriteCount}
          </span>
        )}
      </Button>
    )
  }
  
  return (
    <Button
      variant={isFavorited ? 'default' : 'outline'}
      size={size === 'md' ? 'default' : size}
      onClick={handleToggle}
      disabled={toggleFavorite.isPending}
      className={cn(
        'transition-all duration-300',
        isFavorited && 'bg-red-500 hover:bg-red-600 border-red-500',
        className
      )}
    >
      <Heart
        className={cn(
          iconSize,
          'mr-2 transition-all duration-300',
          isAnimating && 'scale-125',
          isFavorited ? 'fill-white' : ''
        )}
      />
      <span>
        {isFavorited ? '찜 완료' : '찜하기'}
        {showCount && favoriteCount > 0 && ` (${favoriteCount})`}
      </span>
    </Button>
  )
}