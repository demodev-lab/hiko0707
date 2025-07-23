'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, ShoppingBag, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'

const navigation = [
  {
    name: 'home',
    href: '/',
    icon: Home,
  },
  {
    name: 'hotdeals',
    href: '/hotdeals',
    icon: TrendingUp,
  },
  {
    name: 'order',
    href: '/order',
    icon: ShoppingBag,
  },
  {
    name: 'mypage',
    href: '/dashboard',
    icon: User,
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 md:hidden safe-area-inset-bottom shadow-lg">
      <div className="grid grid-cols-4 h-16 sm:h-18 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs transition-all duration-300 p-2 rounded-xl mx-1 my-2',
                'hover:bg-gray-50 dark:hover:bg-gray-800/50 active:scale-95',
                isActive
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {/* 활성 상태 인디케이터 */}
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
              
              <div className={cn(
                'relative transition-all duration-300',
                isActive ? 'transform scale-110' : 'transform scale-100'
              )}>
                <item.icon className={cn(
                  'w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300',
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                )} />
                
                {/* 활성 상태 배경 원 */}
                {isActive && (
                  <div className="absolute inset-0 -m-2 bg-blue-600/10 dark:bg-blue-400/10 rounded-full animate-pulse" />
                )}
              </div>
              
              <span className={cn(
                'font-medium transition-all duration-300',
                isActive ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-500 dark:text-gray-400'
              )}>
                {t(`nav.${item.name}`)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}