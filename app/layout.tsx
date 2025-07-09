import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/common/providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Toaster } from 'sonner'

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
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col pb-16 md:pb-0 bg-white dark:bg-gray-900">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <MobileNav />
          </div>
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  )
}