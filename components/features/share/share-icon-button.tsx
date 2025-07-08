'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Link, Facebook, Twitter, Mail, MessageCircle, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ShareIconButtonProps {
  url: string
  title: string
  description?: string
  className?: string
}

export function ShareIconButton({
  url,
  title,
  description,
  className
}: ShareIconButtonProps) {
  const [copied, setCopied] = useState(false)
  const shareText = description || title
  
  const handleShare = async (platform: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)
    const encodedText = encodeURIComponent(shareText)
    
    let shareLink = ''
    
    switch (platform) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          toast.success('링크가 복사되었습니다')
          setTimeout(() => setCopied(false), 2000)
        } catch (error) {
          toast.error('링크 복사에 실패했습니다')
        }
        return
        
      case 'kakao':
        toast.info('카카오톡 공유는 준비 중입니다')
        return
        
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
        
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`
        break
        
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        break
        
      case 'email':
        shareLink = `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`
        break
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer')
    }
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            className
          )}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={(e) => handleShare('copy', e)}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              복사됨!
            </>
          ) : (
            <>
              <Link className="w-4 h-4 mr-2" />
              링크 복사
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={(e) => handleShare('kakao', e)}>
          <MessageCircle className="w-4 h-4 mr-2" />
          카카오톡
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={(e) => handleShare('facebook', e)}>
          <Facebook className="w-4 h-4 mr-2" />
          페이스북
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={(e) => handleShare('twitter', e)}>
          <Twitter className="w-4 h-4 mr-2" />
          트위터
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={(e) => handleShare('email', e)}>
          <Mail className="w-4 h-4 mr-2" />
          이메일
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}