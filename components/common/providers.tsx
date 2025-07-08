'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { LanguageProvider } from '@/lib/i18n/context'
import { NotificationProvider } from '@/contexts/notification-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { MockDataInitializer } from './mock-data-initializer'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <ThemeProvider>
          <LanguageProvider>
            <NotificationProvider>
              <MockDataInitializer />
              {children}
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </JotaiProvider>
    </QueryClientProvider>
  )
}