import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/common/providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileNav } from '@/components/layout/mobile-nav'
import { SkipLinks } from '@/components/common/skip-links'
import { Toaster } from 'sonner'
import { WebsiteJsonLd, OrganizationJsonLd } from '@/components/seo/json-ld'
import { StagewiseToolbar } from '@stagewise/toolbar-next'
import ReactPlugin from '@stagewise-plugins/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HiKo - 한국 핫딜 모음',
  description: '외국인을 위한 한국 온라인 쇼핑 도우미 - Korean Hot Deals for Foreigners',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
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
          <SkipLinks />
          <div className="min-h-screen flex flex-col pb-16 md:pb-0 bg-white dark:bg-gray-900">
            <Header />
            <main id="main-content" className="flex-1" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <MobileNav />
          </div>
          <Toaster richColors position="top-center" />
        </Providers>
        <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
      </body>
    </html>
  )
}