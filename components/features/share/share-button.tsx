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

interface ShareButtonProps {
  url?: string
  title: string
  description?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ShareButton({
  url,
  title,
  description,
  variant = 'outline',
  size = 'md',
  className
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareText = description || title
  
  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(title)
    const encodedText = encodeURIComponent(shareText)
    
    let shareLink = ''
    
    switch (platform) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          toast.success('링크가 복사되었습니다')
          setTimeout(() => setCopied(false), 2000)
        } catch (error) {
          toast.error('링크 복사에 실패했습니다')
        }
        return
        
      case 'kakao':
        // KakaoTalk sharing requires SDK integration
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
        
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title,
              text: shareText,
              url: shareUrl
            })
            toast.success('공유되었습니다')
          } catch (error) {
            // User cancelled sharing
          }
        } else {
          toast.error('이 브라우저는 공유 기능을 지원하지 않습니다')
        }
        return
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer')
    }
  }
  
  // Check if native sharing is available
  const canNativeShare = typeof window !== 'undefined' && !!navigator.share
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size === 'md' ? 'default' : size} className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          공유하기
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {canNativeShare && (
          <>
            <DropdownMenuItem onClick={() => handleShare('native')}>
              <Share2 className="w-4 h-4 mr-2" />
              공유하기
            </DropdownMenuItem>
            <div className="h-px bg-gray-200 my-1" />
          </>
        )}
        
        <DropdownMenuItem onClick={() => handleShare('copy')}>
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
        
        <DropdownMenuItem onClick={() => handleShare('kakao')}>
          <MessageCircle className="w-4 h-4 mr-2" />
          카카오톡
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="w-4 h-4 mr-2" />
          페이스북
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="w-4 h-4 mr-2" />
          트위터
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('email')}>
          <Mail className="w-4 h-4 mr-2" />
          이메일
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}