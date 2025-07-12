'use client'

import { ErrorFallback } from '@/components/common/error-fallback'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorFallback error={error} reset={reset} type="page" />
}