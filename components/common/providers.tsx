'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { LanguageProvider } from '@/lib/i18n/context'
import { NotificationProvider } from '@/contexts/notification-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { MockDataInitializer } from './mock-data-initializer'
import { ErrorBoundary } from './error-boundary'
import { ChatProvider } from '@/components/features/chat/chat-provider'
// import { KakaoProvider } from '@/components/providers/kakao-provider'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        retry: (failureCount, error: any) => {
          // 특정 에러는 재시도하지 않음
          if (error?.status === 404 || error?.status === 403) return false
          // 최대 3번 재시도
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: false,
        onError: (error: any) => {
          console.error('Mutation error:', error)
        },
      },
    },
  }))

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <ThemeProvider>
            <LanguageProvider>
              <NotificationProvider>
                <ChatProvider>
                  <MockDataInitializer />
                  {children}
                </ChatProvider>
              </NotificationProvider>
            </LanguageProvider>
          </ThemeProvider>
        </JotaiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}