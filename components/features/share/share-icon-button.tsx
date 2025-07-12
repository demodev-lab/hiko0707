'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SNSShareModal } from './sns-share-modal'

interface ShareIconButtonProps {
  url?: string
  title: string
  description?: string
  imageUrl?: string
  hashtags?: string[]
  className?: string
}

export function ShareIconButton({
  url,
  title,
  description,
  imageUrl,
  hashtags,
  className
}: ShareIconButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setModalOpen(true)
  }
  
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          className
        )}
        onClick={handleClick}
        aria-label="공유하기"
      >
        <Share2 className="w-4 h-4" />
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