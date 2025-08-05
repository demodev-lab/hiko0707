'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, TrendingUp, ShoppingBag, User, Heart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/context'
import { useClerkRole } from '@/hooks/use-clerk-role'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  requireAuth?: boolean
}

export function MobileNavV2() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const { isAuthenticated } = useClerkRole()
  const { user: currentUser } = useSupabaseUser()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const navigation: NavItem[] = [
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
      name: 'wishlist',
      href: '/wishlist',
      icon: Heart,
      requireAuth: true,
    },
    {
      name: 'order',
      href: '/order',
      icon: ShoppingBag,
      requireAuth: true,
    },
    {
      name: 'mypage',
      href: currentUser?.role === 'admin' ? '/admin' : '/mypage',
      icon: User,
    },
  ]

  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    if (item.requireAuth && !isAuthenticated) {
      e.preventDefault()
      router.push('/login')
    }
  }

  // 5개 아이템을 4개로 줄이기 위해 찜하기를 제외 (데스크톱에서 보기)
  const visibleNavigation = navigation.filter(item => item.name !== 'wishlist')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* 배경 블러 효과 */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl" />
      
      {/* 그라데이션 보더 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
      
      <div className="relative grid grid-cols-4 h-16 px-1 safe-area-inset-bottom">
        {visibleNavigation.map((item, index) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 px-1 py-2 group',
                'transition-all duration-200 rounded-2xl mx-0.5',
                'active:scale-95 tap-highlight-transparent'
              )}
            >
              {/* 활성 상태 배경 */}
              <AnimatePresence>
                {isActive && mounted && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute inset-0 mx-2"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* 아이콘 컨테이너 */}
              <div className="relative z-10">
                <div className={cn(
                  'relative transition-all duration-300',
                  isActive ? 'transform translate-y-[-2px]' : 'group-hover:translate-y-[-1px]'
                )}>
                  {/* 아이콘 */}
                  <item.icon 
                    className={cn(
                      'w-6 h-6 transition-all duration-300',
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  
                  {/* 활성 상태 반짝임 효과 */}
                  {isActive && mounted && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-0 -m-1"
                    >
                      <Sparkles className="w-8 h-8 text-blue-400" />
                    </motion.div>
                  )}
                  
                </div>
              </div>
              
              {/* 라벨 */}
              <span 
                className={cn(
                  'relative z-10 text-[10px] font-medium transition-all duration-300 mt-0.5',
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                )}
              >
                {t(`nav.${item.name}`)}
              </span>

              {/* 터치 피드백 리플 효과 */}
              {mounted && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="touch-ripple" />
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}