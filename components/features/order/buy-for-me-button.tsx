'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
import { BuyForMeModal } from './buy-for-me-modal'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
// import { RoleBasedContent } from '@/components/auth/role-based-content' // 사용하지 않음
import { toast } from 'sonner'

interface HotDeal {
  id: string
  title: string
  price: string
  originalPrice?: string
  imageUrl?: string
  productUrl: string
  discountRate?: string
  category?: string
  seller?: string
  deadline?: string
}

interface BuyForMeButtonProps {
  hotdeal: HotDeal
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function BuyForMeButton({ 
  hotdeal, 
  variant = 'default', 
  size = 'default',
  className = ''
}: BuyForMeButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { currentUser, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.info('대리구매 서비스 이용을 위해 로그인이 필요합니다.')
      router.push('/login')
      return
    }
    
    setModalOpen(true)
  }

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={className}
      >
        <ShoppingBag className="w-4 h-4 mr-2" />
        상세 주문
      </Button>

      <BuyForMeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        hotdeal={hotdeal}
      />
    </>
  )
}