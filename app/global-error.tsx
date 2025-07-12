'use client'

import { ErrorFallback } from '@/components/common/error-fallback'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <ErrorFallback error={error} reset={reset} type="page" />
      </body>
    </html>
  )
}