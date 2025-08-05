import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { LanguageProvider } from '@/lib/i18n/context'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
  },
})

interface TestProvidersProps {
  children: React.ReactNode
  language?: string
}

export function TestProviders({ children, language = 'ko' }: TestProvidersProps) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </JotaiProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { language?: string }
) => {
  const { language, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders language={language}>{children}</TestProviders>
    ),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'member',
  language: 'ko',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockHotDeal = (overrides = {}) => ({
  id: '1',
  title: 'Test Hot Deal',
  sale_price: 50000,
  original_price: 100000,
  discount_rate: 50,
  category: 'electronics',
  source: 'ppomppu' as const,
  seller: 'Test Shop',
  source_id: 'test-post-id-123',
  status: 'active' as const,
  image_url: '/test-image.jpg',
  thumbnail_url: '/test-image.jpg',
  original_url: 'https://test.com',
  views: 100,
  like_count: 10,
  comment_count: 5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  description: null,
  author_name: 'Test Author',
  shopping_comment: '',
  is_free_shipping: false,
  deleted_at: null,
  ...overrides,
})

export const createMockOrder = (overrides = {}) => ({
  id: '1',
  userId: '1',
  hotdealId: '1',
  status: 'pending',
  totalAmount: 50000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

// Utility functions
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}