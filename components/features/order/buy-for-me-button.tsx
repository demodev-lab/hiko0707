'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { BuyForMeModal } from './buy-for-me-modal'

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
  const { t } = useLanguage()
  const [modalOpen, setModalOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
        {t('order.buyForMe.title')}
      </Button>

      <BuyForMeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        hotdeal={hotdeal}
      />
    </>
  )
}