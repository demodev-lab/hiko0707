'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AccessibleButtonProps extends ButtonProps {
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-pressed'?: boolean
  'aria-controls'?: string
  loading?: boolean
  loadingText?: string
  tooltip?: string
  hasNotification?: boolean
  notificationCount?: number
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    className,
    loading = false,
    loadingText,
    tooltip,
    hasNotification = false,
    notificationCount,
    disabled,
    ...props
  }, ref) => {
    const [isPressed, setIsPressed] = useState(false)

    const handleMouseDown = () => setIsPressed(true)
    const handleMouseUp = () => setIsPressed(false)
    const handleMouseLeave = () => setIsPressed(false)

    return (
      <div className="relative inline-block">
        <Button
          ref={ref}
          {...props}
          disabled={disabled || loading}
          className={cn(
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'active:scale-95 transition-transform',
            isPressed && 'scale-95',
            className
          )}
          aria-busy={loading}
          aria-label={loading ? loadingText : props['aria-label']}
          title={tooltip}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div 
                className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                aria-hidden="true"
              />
              <span>{loadingText || '로딩 중...'}</span>
            </div>
          ) : (
            children
          )}
        </Button>
        
        {/* 알림 뱃지 */}
        {hasNotification && (
          <div 
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center"
            aria-label={`${notificationCount || 1}개의 알림`}
            role="status"
          >
            {notificationCount && notificationCount > 99 ? '99+' : notificationCount || ''}
          </div>
        )}
      </div>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'