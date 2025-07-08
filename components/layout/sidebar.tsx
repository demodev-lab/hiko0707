'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  TrendingUp, 
  CreditCard,
  Package,
  Settings,
  User,
  Heart,
  Bell
} from 'lucide-react'
import { useAtom } from 'jotai'
import { isSidebarOpenAtom } from '@/states/ui-store'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '핫딜', href: '/hotdeals', icon: TrendingUp },
  { name: '대신 사줘요', href: '/order', icon: ShoppingBag },
  { name: '주문 내역', href: '/orders', icon: Package },
  { name: '결제 내역', href: '/dashboard/payments', icon: CreditCard },
  { name: '즐겨찾기', href: '/dashboard/favorites', icon: Heart },
]

const accountNavigation = [
  { name: '프로필', href: '/dashboard/profile', icon: User },
  { name: '알림 설정', href: '/dashboard/notifications', icon: Bell },
  { name: '설정', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isSidebarOpen] = useAtom(isSidebarOpenAtom)
  const { currentUser, logout } = useAuth()

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex h-full flex-col">
        {/* 사용자 정보 */}
        <div className="flex flex-col items-center p-6 border-b">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
            {currentUser?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <h3 className="font-medium text-gray-900">{currentUser?.name || '사용자'}</h3>
          <p className="text-sm text-gray-500">{currentUser?.email}</p>
          {currentUser?.preferredLanguage && (
            <div className="mt-2 text-xs text-gray-400">
              언어: {currentUser.preferredLanguage === 'ko' ? '한국어' : 
                     currentUser.preferredLanguage === 'en' ? 'English' :
                     currentUser.preferredLanguage === 'zh' ? '中文' :
                     currentUser.preferredLanguage === 'vi' ? 'Tiếng Việt' :
                     currentUser.preferredLanguage === 'mn' ? 'Монгол' :
                     currentUser.preferredLanguage === 'th' ? 'ไทย' :
                     currentUser.preferredLanguage === 'ja' ? '日本語' :
                     currentUser.preferredLanguage === 'ru' ? 'Русский' : currentUser.preferredLanguage}
            </div>
          )}
        </div>

        {/* 메인 네비게이션 */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3">
            <div className="mb-4">
              <h4 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                메인 메뉴
              </h4>
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 h-5 w-5 flex-shrink-0",
                            isActive
                              ? "text-blue-700"
                              : "text-gray-400 group-hover:text-gray-500"
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                계정
              </h4>
              <ul className="space-y-1">
                {accountNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 h-5 w-5 flex-shrink-0",
                            isActive
                              ? "text-blue-700"
                              : "text-gray-400 group-hover:text-gray-500"
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>
        </div>

        {/* 로그아웃 버튼 */}
        <div className="border-t p-4">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </aside>
  )
}