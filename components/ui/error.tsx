'use client'

import { AlertTriangle, RefreshCw, Home, ArrowLeft, Search, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useTranslation } from '@/hooks/use-translation'

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
  showSearch?: boolean
  showPopularLinks?: boolean
  className?: string
}

export function NotFound({
  title = '페이지를 찾을 수 없습니다',
  message = '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
  showHomeButton = true,
  showSearch = false,
  showPopularLinks = false,
  className
}: NotFoundProps) {
  const { t } = useTranslation()
  
  const popularLinks = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.hotdeals'), href: '/hotdeals', icon: TrendingUp },
    { name: t('nav.buyForMe'), href: '/order', icon: ShoppingBag },
  ]

  return (
    <div className={cn('flex items-center justify-center min-h-[70vh] py-12', className)}>
      <div className="text-center max-w-2xl mx-auto px-4">
        {/* 404 일러스트레이션 */}
        <div className="relative mx-auto mb-8 w-64 h-64">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 rounded-full opacity-50 blur-3xl"></div>
          <div className="relative flex items-center justify-center h-full">
            <div className="text-center">
              <span className="text-9xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                404
              </span>
              <div className="mt-2 flex justify-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 제목과 메시지 */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">{message}</p>

        {/* 검색 바 */}
        {showSearch && (
          <div className="mb-8 max-w-md mx-auto">
            <form action="/search" method="get" className="relative">
              <input
                type="text"
                name="q"
                placeholder={t('search.placeholder')}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* 인기 페이지 링크 */}
        {showPopularLinks && (
          <div className="mb-8">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('error.popularPages')}</p>
            <div className="flex flex-wrap justify-center gap-3">
              {popularLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 홈 버튼 */}
        {showHomeButton && (
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                {t('error.backToHome')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('error.previousPage')}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

import { Bell, Filter, ShoppingBag } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'default' | 'hotdeals' | 'search'
  showIllustration?: boolean
  additionalActions?: Array<{
    label: string
    onClick: () => void
    icon?: React.ReactNode
    variant?: 'default' | 'outline' | 'ghost'
  }>
  className?: string
}

export function EmptyState({
  title = '데이터가 없습니다',
  message = '표시할 항목이 없습니다.',
  actionLabel,
  onAction,
  variant = 'default',
  showIllustration = true,
  additionalActions = [],
  className
}: EmptyStateProps) {
  const { t } = useTranslation()

  // 핫딜 전용 일러스트레이션
  const HotDealsIllustration = () => (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950 dark:to-red-950 rounded-full opacity-50 blur-2xl"></div>
      <div className="relative flex items-center justify-center h-full">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-orange-500 mx-auto mb-2" />
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {showIllustration && (
        variant === 'hotdeals' ? (
          <HotDealsIllustration />
        ) : (
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
        )
      )}
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">{message}</p>
      
      {/* 메인 액션 버튼 */}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mb-4">
          {actionLabel}
        </Button>
      )}
      
      {/* 추가 액션 버튼들 */}
      {additionalActions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {additionalActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || 'outline'}
              size="sm"
              className="flex items-center gap-2"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}