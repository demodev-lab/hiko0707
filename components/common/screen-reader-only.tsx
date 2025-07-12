'use client'

import { ReactNode } from 'react'

interface ScreenReaderOnlyProps {
  children: ReactNode
  as?: 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function ScreenReaderOnly({ children, as: Component = 'span' }: ScreenReaderOnlyProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  )
}

// 동적 안내 메시지를 위한 라이브 리전 컴포넌트
interface LiveRegionProps {
  children: ReactNode
  priority?: 'polite' | 'assertive'
  atomic?: boolean
  className?: string
}

export function LiveRegion({ 
  children, 
  priority = 'polite', 
  atomic = true,
  className = 'sr-only'
}: LiveRegionProps) {
  return (
    <div 
      aria-live={priority}
      aria-atomic={atomic}
      className={className}
    >
      {children}
    </div>
  )
}