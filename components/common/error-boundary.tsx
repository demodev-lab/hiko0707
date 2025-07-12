'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 서비스에 에러 정보 전송
    console.error('Error caught by boundary:', error, errorInfo)
    
    // 개발 환경에서는 더 자세한 정보 표시
    if (process.env.NODE_ENV === 'development') {
      console.error('Component Stack:', errorInfo.componentStack)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">문제가 발생했습니다</CardTitle>
              <CardDescription>
                예기치 않은 오류가 발생했습니다. 불편을 드려 죄송합니다.
              </CardDescription>
            </CardHeader>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <CardContent>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm">
                  <p className="font-mono text-red-600 dark:text-red-400 mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  <details className="cursor-pointer">
                    <summary className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                      스택 트레이스 보기
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto text-gray-600 dark:text-gray-400">
                      {this.state.error.stack}
                    </pre>
                  </details>
                </div>
              </CardContent>
            )}
            
            <CardFooter className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </Button>
              <Button asChild>
                <Link href="/" className="gap-2">
                  <Home className="w-4 h-4" />
                  홈으로 가기
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}