'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { SNSShareModal } from './sns-share-modal'

interface ShareButtonProps {
  url?: string
  title: string
  description?: string
  imageUrl?: string
  hashtags?: string[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  showLabel?: boolean
}

export function ShareButton({
  url,
  title,
  description,
  imageUrl,
  hashtags,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true
}: ShareButtonProps) {
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
        aria-label="공유하기"
      >
        <Share2 className={showLabel ? "w-4 h-4 mr-2" : "w-4 h-4"} />
        {showLabel && '공유하기'}
      </Button>
      
      <SNSShareModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        url={url}
        title={title}
        description={description}
        imageUrl={imageUrl}
        hashtags={hashtags}
      />
    </>
  )
}