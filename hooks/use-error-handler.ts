'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface ErrorInfo {
  message: string
  code?: string
  statusCode?: number
  context?: Record<string, any>
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error: Error | ErrorInfo | string, context?: Record<string, any>) => {
    let errorInfo: ErrorInfo

    if (typeof error === 'string') {
      errorInfo = { message: error, context }
    } else if (error instanceof Error) {
      errorInfo = {
        message: error.message,
        code: (error as any).code,
        statusCode: (error as any).statusCode,
        context: { ...context, stack: error.stack }
      }
    } else {
      errorInfo = { ...error, context: { ...error.context, ...context } }
    }

    setError(errorInfo)

    // 토스트 메시지 표시
    const toastMessage = getErrorMessage(errorInfo)
    toast.error(toastMessage)

    // 에러 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', errorInfo)
    }

    // 프로덕션에서는 에러 로깅 서비스로 전송
    // logErrorToService(errorInfo)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const withErrorHandling = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      setIsLoading(true)
      try {
        const result = await fn()
        clearError()
        return result
      } catch (error) {
        handleError(error as Error)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [handleError, clearError]
  )

  return {
    error,
    isLoading,
    handleError,
    clearError,
    withErrorHandling,
  }
}

function getErrorMessage(error: ErrorInfo): string {
  // 특정 에러 코드에 대한 사용자 친화적 메시지
  const errorMessages: Record<string, string> = {
    'NETWORK_ERROR': '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.',
    'UNAUTHORIZED': '로그인이 필요합니다. 다시 로그인해주세요.',
    'FORBIDDEN': '접근 권한이 없습니다.',
    'NOT_FOUND': '요청한 페이지를 찾을 수 없습니다.',
    'INTERNAL_SERVER_ERROR': '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    'VALIDATION_ERROR': '입력한 정보에 오류가 있습니다. 확인 후 다시 시도해주세요.',
    'RATE_LIMIT_EXCEEDED': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  }

  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code]
  }

  if (error.statusCode) {
    switch (error.statusCode) {
      case 400:
        return '잘못된 요청입니다. 입력 정보를 확인해주세요.'
      case 401:
        return '로그인이 필요합니다.'
      case 403:
        return '접근 권한이 없습니다.'
      case 404:
        return '요청한 페이지를 찾을 수 없습니다.'
      case 429:
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      case 500:
        return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      default:
        return error.message || '알 수 없는 오류가 발생했습니다.'
    }
  }

  return error.message || '알 수 없는 오류가 발생했습니다.'
}

// 에러 로깅 서비스 (실제 구현 시 사용)
// function logErrorToService(error: ErrorInfo) {
//   // Sentry, LogRocket 등의 서비스로 에러 전송
// }