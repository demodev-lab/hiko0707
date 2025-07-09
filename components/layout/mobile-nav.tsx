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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t dark:border-gray-800 md:hidden safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-14 sm:h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs transition-colors p-1',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <item.icon className={cn(
                'w-4 h-4 sm:w-5 sm:h-5',
                isActive && 'text-blue-600 dark:text-blue-400'
              )} />
              <span className="font-medium">{t(`nav.${item.name}`)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}