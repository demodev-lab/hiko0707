'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const shareText = description || title

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  const handleShare = async (platform: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(false) // Close dropdown after selection
    
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
    <div className="relative" ref={dropdownRef}>
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
          setIsOpen(!isOpen)
        }}
      >
        <Share2 className="w-4 h-4" />
      </Button>
      
      {isOpen && (
        <Card className="absolute right-0 top-full mt-1 w-48 py-1 shadow-lg z-50">
          <button
            className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={(e) => handleShare('copy', e)}
          >
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
          </button>
          
          <button
            className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={(e) => handleShare('kakao', e)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            카카오톡
          </button>
          
          <button
            className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={(e) => handleShare('facebook', e)}
          >
            <Facebook className="w-4 h-4 mr-2" />
            페이스북
          </button>
          
          <button
            className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={(e) => handleShare('twitter', e)}
          >
            <Twitter className="w-4 h-4 mr-2" />
            트위터
          </button>
          
          <button
            className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={(e) => handleShare('email', e)}
          >
            <Mail className="w-4 h-4 mr-2" />
            이메일
          </button>
        </Card>
      )}
    </div>
  )
}