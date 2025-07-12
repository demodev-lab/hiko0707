'use client'

import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CommentHighlightProps {
  children: ReactNode
  isNew?: boolean
  isHighlighted?: boolean
  className?: string
}

export function CommentHighlight({ 
  children, 
  isNew = false,
  isHighlighted = false,
  className 
}: CommentHighlightProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (isNew || isHighlighted) {
      setShouldAnimate(true)
      const timer = setTimeout(() => setShouldAnimate(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isNew, isHighlighted])

  return (
    <div 
      className={cn(
        "relative transition-all duration-500",
        shouldAnimate && "ring-2 ring-blue-400 ring-opacity-50",
        className
      )}
    >
      {shouldAnimate && (
        <div 
          className="absolute inset-0 bg-blue-100 dark:bg-blue-900 opacity-20 animate-pulse rounded-lg"
          style={{ animationDuration: '2s' }}
        />
      )}
      {children}
    </div>
  )
}