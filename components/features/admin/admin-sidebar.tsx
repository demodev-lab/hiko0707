'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  LogOut,
  ShoppingBag
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: '대시보드',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: '대리 구매',
    href: '/admin/buy-for-me',
    icon: ShoppingBag
  },
  {
    name: '핫딜 관리',
    href: '/admin/hotdeals',
    icon: TrendingUp
  }
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="p-6">
        <h2 className="text-2xl font-bold">HiKo Admin</h2>
      </div>
      
      <nav className="px-4 py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 bg-gray-600 rounded-full" />
          <div>
            <p className="text-sm font-medium">관리자</p>
            <p className="text-xs text-gray-400">admin@hiko.kr</p>
          </div>
        </div>
        <Link href="/login">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </Link>
      </div>
    </div>
  )
}