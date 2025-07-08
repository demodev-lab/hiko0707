'use client'

import { useEffect } from 'react'
import { PageError } from '@/components/ui/error'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 로깅 (예: Sentry, LogRocket 등)
    console.error('Application error:', error)
  }, [error])

  return <PageError error={error} reset={reset} />
}