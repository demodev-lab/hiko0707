'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-b-2 border-primary',
        {
          'h-4 w-4': size === 'sm',
          'h-8 w-8': size === 'md',
          'h-12 w-12': size === 'lg',
        },
        className
      )}
    />
  )
}

interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ message = '로딩 중...', size = 'md', className }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <LoadingSpinner size={size} className="mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        {message && <p className="text-xl text-gray-600">{message}</p>}
      </div>
    </div>
  )
}

interface CardLoadingProps {
  className?: string
}

export function CardLoading({ className }: CardLoadingProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="bg-gray-200 rounded-md h-4 mb-3"></div>
      <div className="bg-gray-200 rounded-md h-4 mb-3 w-3/4"></div>
      <div className="bg-gray-200 rounded-md h-4 w-1/2"></div>
    </div>
  )
}

interface ListLoadingProps {
  count?: number
  className?: string
}

export function ListLoading({ count = 3, className }: ListLoadingProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <CardLoading />
        </div>
      ))}
    </div>
  )
}