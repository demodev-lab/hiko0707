'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, FileWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  type?: 'page' | 'component' | 'loading'
}

export function ErrorFallback({ error, reset, type = 'page' }: ErrorFallbackProps) {
  const router = useRouter()

  useEffect(() => {
    // 에러 로깅
    console.error('Error:', error)
  }, [error])

  const getErrorIcon = () => {
    switch (type) {
      case 'loading':
        return <FileWarning className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
      case 'component':
        return <AlertTriangle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
      default:
        return <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
    }
  }

  const getErrorTitle = () => {
    switch (type) {
      case 'loading':
        return '데이터를 불러올 수 없습니다'
      case 'component':
        return '일부 기능에 문제가 있습니다'
      default:
        return '페이지를 표시할 수 없습니다'
    }
  }

  const getErrorDescription = () => {
    switch (type) {
      case 'loading':
        return '데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      case 'component':
        return '페이지의 일부 기능이 정상적으로 작동하지 않을 수 있습니다.'
      default:
        return '일시적인 문제가 발생했습니다. 새로고침하거나 잠시 후 다시 시도해주세요.'
    }
  }

  if (type === 'component') {
    // 컴포넌트 레벨 에러는 더 작은 UI로 표시
    return (
      <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              이 섹션을 표시할 수 없습니다
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error.message || '일시적인 문제가 발생했습니다.'}
            </p>
            <Button
              onClick={reset}
              variant="ghost"
              size="sm"
              className="mt-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            {getErrorIcon()}
          </div>
          <CardTitle className="text-2xl">{getErrorTitle()}</CardTitle>
          <CardDescription>{getErrorDescription()}</CardDescription>
        </CardHeader>

        {process.env.NODE_ENV === 'development' && (
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm">
              <p className="font-mono text-red-600 dark:text-red-400 mb-2">
                {error.name}: {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </CardContent>
        )}

        <CardFooter className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </Button>
          <Button onClick={() => router.push('/')} className="gap-2">
            <Home className="w-4 h-4" />
            홈으로 가기
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// 로딩 상태를 위한 스켈레톤 컴포넌트
export function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'list' | 'page' }) {
  if (type === 'list') {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'page') {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
    )
  }

  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
    </div>
  )
}