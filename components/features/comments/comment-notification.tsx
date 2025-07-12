'use client'

import { useState, useEffect } from 'react'
import { Bell, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CommentNotificationProps {
  currentCount: number
  previousCount: number
  onNewComment?: () => void
  className?: string
}

export function CommentNotification({ 
  currentCount, 
  previousCount, 
  onNewComment,
  className 
}: CommentNotificationProps) {
  const [show, setShow] = useState(false)
  const newComments = currentCount - previousCount

  useEffect(() => {
    if (newComments > 0 && previousCount > 0) {
      setShow(true)
      toast.info(`새로운 댓글이 ${newComments}개 달렸습니다`, {
        icon: <MessageCircle className="w-4 h-4" />,
        duration: 4000,
      })
      
      const timer = setTimeout(() => setShow(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [newComments, previousCount])

  if (!show || newComments <= 0) return null

  return (
    <div 
      className={cn(
        "fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300",
        className
      )}
    >
      <Button
        onClick={() => {
          onNewComment?.()
          setShow(false)
        }}
        className="shadow-lg hover:shadow-xl transition-shadow"
        size="sm"
      >
        <Bell className="w-4 h-4 mr-2 animate-pulse" />
        새로운 댓글 {newComments}개
        <Badge variant="secondary" className="ml-2">
          클릭해서 확인
        </Badge>
      </Button>
    </div>
  )
}