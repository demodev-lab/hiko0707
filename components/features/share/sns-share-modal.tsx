'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Share2,
  Link,
  Facebook,
  Twitter,
  Mail,
  MessageCircle,
  Check,
  QrCode,
  Instagram,
  Send
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface SNSShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  url?: string
  title: string
  description?: string
  imageUrl?: string
  hashtags?: string[]
}

interface SharePlatform {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  bgColor: string
  shareUrl: (params: ShareParams) => string | null
}

interface ShareParams {
  url: string
  title: string
  description: string
  hashtags: string[]
}

const sharePlatforms: SharePlatform[] = [
  {
    id: 'kakao',
    name: '카카오톡',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'text-yellow-900',
    bgColor: 'bg-yellow-400 hover:bg-yellow-500',
    shareUrl: () => null // Kakao SDK 필요
  },
  {
    id: 'facebook',
    name: '페이스북',
    icon: <Facebook className="w-5 h-5" />,
    color: 'text-white',
    bgColor: 'bg-blue-600 hover:bg-blue-700',
    shareUrl: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    id: 'twitter',
    name: '트위터',
    icon: <Twitter className="w-5 h-5" />,
    color: 'text-white',
    bgColor: 'bg-black hover:bg-gray-800',
    shareUrl: ({ url, description, hashtags }) => {
      const text = hashtags.length > 0 ? `${description} ${hashtags.join(' ')}` : description
      return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    }
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'text-white',
    bgColor: 'bg-green-500 hover:bg-green-600',
    shareUrl: ({ url, description }) => 
      `https://wa.me/?text=${encodeURIComponent(`${description} ${url}`)}`
  },
  {
    id: 'telegram',
    name: '텔레그램',
    icon: <Send className="w-5 h-5" />,
    color: 'text-white',
    bgColor: 'bg-sky-500 hover:bg-sky-600',
    shareUrl: ({ url, description }) => 
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(description)}`
  },
  {
    id: 'email',
    name: '이메일',
    icon: <Mail className="w-5 h-5" />,
    color: 'text-white',
    bgColor: 'bg-gray-600 hover:bg-gray-700',
    shareUrl: ({ url, title, description }) => 
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`
  }
]

export function SNSShareModal({
  open,
  onOpenChange,
  url,
  title,
  description,
  imageUrl,
  hashtags = []
}: SNSShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareDescription = description || title
  
  // 카카오 SDK 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Kakao?.isInitialized()) {
      // 카카오 SDK는 실제 프로덕션에서 API 키로 초기화 필요
      // window.Kakao.init('YOUR_KAKAO_API_KEY')
    }
  }, [])
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('링크가 복사되었습니다')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('링크 복사에 실패했습니다')
    }
  }
  
  const handleShare = async (platform: SharePlatform) => {
    const params: ShareParams = {
      url: shareUrl,
      title,
      description: shareDescription,
      hashtags
    }
    
    if (platform.id === 'kakao') {
      // 카카오톡 공유 구현
      if (typeof window !== 'undefined' && window.Kakao) {
        try {
          window.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title: title,
              description: shareDescription,
              imageUrl: imageUrl || '',
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
            buttons: [
              {
                title: '자세히 보기',
                link: {
                  mobileWebUrl: shareUrl,
                  webUrl: shareUrl,
                },
              },
            ],
          })
          toast.success('카카오톡으로 공유되었습니다')
        } catch (error) {
          toast.error('카카오톡 공유에 실패했습니다')
        }
      } else {
        toast.info('카카오톡 공유는 준비 중입니다')
      }
      return
    }
    
    const shareLink = platform.shareUrl(params)
    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer,width=600,height=400')
    }
  }
  
  const formattedHashtags = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              공유하기
            </DialogTitle>
            <DialogDescription>
              친구들과 함께 공유해보세요
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="px-6 pb-6 space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* 상품 미리보기 */}
          {(imageUrl || title) && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {imageUrl && (
                <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={imageUrl}
                    alt={title}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{title}</h4>
                {shareDescription && (
                  <p className="text-xs text-muted-foreground truncate">
                    {shareDescription}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* 해시태그 */}
          {formattedHashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formattedHashtags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* SNS 버튼 */}
          <div className="grid grid-cols-3 gap-2">
            {sharePlatforms.map((platform) => (
              <Button
                key={platform.id}
                onClick={() => handleShare(platform)}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3 px-1 min-w-0",
                  platform.bgColor,
                  platform.color
                )}
              >
                {platform.icon}
                <span className="text-xs font-medium truncate w-full text-center">{platform.name}</span>
              </Button>
            ))}
          </div>
          
          {/* 링크 복사 및 QR 코드 */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-1 min-w-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-600 flex-shrink-0" />
                    <span className="truncate">복사됨!</span>
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">링크 복사</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowQR(!showQR)}
                variant="outline"
                className="flex-1 min-w-0"
              >
                <QrCode className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">QR 코드</span>
              </Button>
            </div>
            
            {/* QR 코드 표시 */}
            {showQR && (
              <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <QRCodeSVG
                  value={shareUrl}
                  size={160}
                  level="M"
                  includeMargin
                />
              </div>
            )}
          </div>
          
          {/* URL 입력 필드 */}
          <div className="relative">
            <Input
              value={shareUrl}
              readOnly
              className="pr-16 text-xs bg-gray-50 dark:bg-gray-800 truncate"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyLink}
              className="absolute right-1 top-1 h-7 px-2 text-xs"
            >
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Window 타입 확장
declare global {
  interface Window {
    Kakao?: any
  }
}