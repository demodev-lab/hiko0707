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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs transition-colors',
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5',
                isActive && 'text-blue-600'
              )} />
              <span>{t(`nav.${item.name}`)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}