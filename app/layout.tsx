import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from '@/components/common/providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileNavV2 } from '@/components/layout/mobile-nav-v2'
import { SkipLinks } from '@/components/common/skip-links'
import { Toaster } from 'sonner'
import { WebsiteJsonLd, OrganizationJsonLd } from '@/components/seo/json-ld'
import { UserSyncProvider } from '@/components/auth/user-sync-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HiKo - 한국 쇼핑 도우미 | Korean Shopping Assistant',
  description: '외국인을 위한 한국 쇼핑 플랫폼. 7개 언어 지원, 대리구매, 실시간 핫딜 정보 제공. The best Korean shopping platform for foreigners.',
  keywords: '한국 쇼핑, Korean shopping, 대리구매, proxy buying, 핫딜, hot deals, K-beauty, K-fashion',
  openGraph: {
    title: 'HiKo - 한국 쇼핑 도우미',
    description: '외국인을 위한 똑똑한 한국 쇼핑 도우미',
    type: 'website',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="ko" suppressHydrationWarning>
        <head>
          <meta name="theme-color" content="#ffffff" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  const theme = localStorage.getItem('theme') || 'light'
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                  const shouldUseDark = theme === 'dark' || (theme === 'system' && systemPrefersDark)
                  
                  if (shouldUseDark) {
                    document.documentElement.classList.add('dark')
                  } else {
                    document.documentElement.classList.remove('dark')
                  }
                  
                  // Update theme-color meta tag
                  const themeColorMeta = document.querySelector('meta[name="theme-color"]')
                  if (themeColorMeta) {
                    themeColorMeta.setAttribute('content', shouldUseDark ? '#1f2937' : '#ffffff')
                  }
                } catch (e) {
                  // Fallback to light mode if anything fails
                  document.documentElement.classList.remove('dark')
                }
              `,
            }}
          />
          <WebsiteJsonLd />
          <OrganizationJsonLd />
        </head>
        <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`} suppressHydrationWarning>
          <Providers>
            <UserSyncProvider>
              <SkipLinks />
              <div className="min-h-screen flex flex-col pb-20 sm:pb-24 md:pb-0 bg-white dark:bg-gray-900">
                <Header />
                <main id="main-content" className="flex-1" tabIndex={-1} style={{ paddingTop: 'var(--header-height, 6rem)' }}>
                  {children}
                </main>
                <Footer />
                <MobileNavV2 />
              </div>
              <Toaster richColors position="top-center" />
            </UserSyncProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}