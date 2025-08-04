'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  LogOut,
  ShoppingBag,
  Globe,
  Database,
  BarChart3,
  Users,
  Settings,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigationGroups = [
  {
    title: '대시보드',
    items: [
      {
        name: '메인 대시보드',
        href: '/admin',
        icon: LayoutDashboard
      }
    ]
  },
  {
    title: '비즈니스 관리',
    items: [
      {
        name: '대리 구매',
        href: '/admin/buy-for-me',
        icon: ShoppingBag
      },
      {
        name: '핫딜 관리',
        href: '/admin/hotdeal-manager',
        icon: Database
      }
    ]
  },
  {
    title: '분석 & 관리',
    items: [
      {
        name: '통계 분석',
        href: '/admin/analytics',
        icon: BarChart3
      },
      {
        name: '핫딜 Analytics',
        href: '/admin/hotdeal-analytics',
        icon: Activity
      },
      {
        name: '사용자 관리',
        href: '/admin/users',
        icon: Users
      }
    ]
  },
  {
    title: '시스템',
    items: [
      {
        name: '시스템 설정',
        href: '/admin/settings',
        icon: Settings
      }
    ]
  }
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          HiKo Admin
        </h2>
        <p className="text-sm text-gray-400 mt-1">관리자 대시보드</p>
      </div>
      
      <nav className="px-4 py-6 space-y-6">
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.title}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group',
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                    )} />
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <div className="absolute right-3 w-2 h-2 bg-white rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-700 bg-gray-900/50">
        <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-gray-800/50 rounded-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">관</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">관리자</p>
            <p className="text-xs text-gray-400">admin@hiko.kr</p>
          </div>
        </div>
        <Link href="/login" className="block">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </Link>
      </div>
    </div>
  )
}