'use client'

import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ErrorDisplayProps {
  title?: string
  message?: string
  onRetry?: () => void
  onGoHome?: () => void
  onGoBack?: () => void
  className?: string
}

export function ErrorDisplay({
  title = '오류가 발생했습니다',
  message = '페이지를 불러오는 중에 문제가 발생했습니다.',
  onRetry,
  onGoHome,
  onGoBack,
  className
}: ErrorDisplayProps) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {onRetry && (
              <Button onClick={onRetry} variant="default" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </Button>
            )}
            
            {onGoBack && (
              <Button onClick={onGoBack} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                뒤로 가기
              </Button>
            )}
            
            {onGoHome && (
              <Button onClick={onGoHome} variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                홈으로
              </Button>
            )}
            
            {!onRetry && !onGoBack && !onGoHome && (
              <Button asChild variant="default" className="flex items-center gap-2">
                <Link href="/">
                  <Home className="w-4 h-4" />
                  홈으로 돌아가기
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface PageErrorProps {
  error?: Error & { digest?: string }
  reset?: () => void
}

export function PageError({ error, reset }: PageErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ErrorDisplay
        title="페이지 로딩 오류"
        message={error?.message || '페이지를 불러오는 중에 문제가 발생했습니다.'}
        onRetry={reset}
        onGoHome={() => window.location.href = '/'}
      />
    </div>
  )
}

interface ApiErrorProps {
  error: string
  onRetry?: () => void
  className?: string
}

export function ApiError({ error, onRetry, className }: ApiErrorProps) {
  return (
    <div className={cn('p-4 bg-red-50 border border-red-200 rounded-md', className)}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            오류가 발생했습니다
          </h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              확인
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface NotFoundProps {
  title?: string
  message?: string
  showHomeButton?: boolean
  className?: string
}

export function NotFound({
  title = '페이지를 찾을 수 없습니다',
  message = '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
  showHomeButton = true,
  className
}: NotFoundProps) {
  return (
    <div className={cn('flex items-center justify-center py-20', className)}>
      <div className="text-center">
        <div className="mx-auto mb-6 w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-4xl font-bold text-gray-400">404</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8 max-w-md">{message}</p>
        {showHomeButton && (
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  title = '데이터가 없습니다',
  message = '표시할 항목이 없습니다.',
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}