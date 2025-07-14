'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, Search, Languages, User, ShoppingBag, Heart, ChevronDown, Shield, Crown, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/features/notifications/notification-bell'
import { ThemeToggle } from '@/components/features/theme/theme-toggle'
import { CurrencySelector } from '@/components/features/currency-selector'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { languages } from '@/lib/i18n/config'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, usePathname } from 'next/navigation'
import { ShowForRole, RoleBasedContent } from '@/components/auth/role-based-content'
import { CurrencyCalculatorModal } from '@/components/features/currency-calculator-modal'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const { currentUser, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const langMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  // 핫딜 페이지와 검색 페이지에서는 검색바 숨김
  const hideSearchBar = pathname === '/hotdeals' || pathname === '/search'

  const currentLang = languages[0] // 기본 언어 (한국어)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const handleOrderClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      router.push('/login')
    } else {
      router.push('/order')
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header id="navigation" role="banner" className="sticky top-0 z-50 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-4 lg:gap-8">
          {/* 로고 영역 */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HiKo
              </h1>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 flex-shrink-0">
            <Link href="/hotdeals" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors whitespace-nowrap">
              핫딜
            </Link>
            <button onClick={handleOrderClick} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors whitespace-nowrap">
              대리 구매
            </button>
            <button 
              onClick={() => setCurrencyModalOpen(true)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <Calculator className="w-4 h-4" />
              환율 계산기
            </button>
            
            {/* 회원 전용 메뉴 */}
            <ShowForRole roles={['member', 'admin']}>
              <Link href="/mypage" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors whitespace-nowrap">
                마이페이지
              </Link>
            </ShowForRole>
            
            {/* 관리자 전용 메뉴 */}
            <ShowForRole roles={['admin']}>
              <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-1 whitespace-nowrap">
                <Shield className="w-4 h-4" />
                관리자
              </Link>
            </ShowForRole>
          </nav>

          {/* 검색바 (데스크톱) - 핫딜/검색 페이지에서는 숨김 */}
          {!hideSearchBar && (
            <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-md mx-4 xl:mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="핫딜 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full"
                />
              </div>
            </form>
          )}

          {/* 우측 메뉴 */}
          <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            {/* 언어 선택 - native dropdown */}
            <div className="relative" ref={langMenuRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 px-2"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
              >
                <Languages className="w-4 h-4" />
                <span className="text-sm font-medium">{currentLang.code.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
              {langMenuOpen && (
                <Card className="absolute right-0 top-full mt-1 w-40 py-1 shadow-lg z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        console.log('Language changed to:', lang.code)
                        setLangMenuOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center ${
                        currentLang.code === lang.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <span className="mr-2 text-lg">{lang.flag}</span>
                      <span className="text-sm">{lang.code.toUpperCase()}</span>
                    </button>
                  ))}
                </Card>
              )}
            </div>

            {/* 환율 선택기 */}
            <div className="flex items-center">
              <CurrencySelector />
            </div>

            {/* 테마 토글 */}
            <ThemeToggle />

            {/* 알림 */}
            <NotificationBell />

            {/* 사용자 메뉴 */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <RoleBasedContent
                    member={<User className="w-5 h-5" />}
                    admin={<Crown className="w-5 h-5 text-amber-600" />}
                  />
                  <span className="hidden sm:inline-block">{currentUser.name}</span>
                  <RoleBasedContent
                    admin={<Badge variant="secondary" className="ml-1">Admin</Badge>}
                  />
                </Button>
                {userMenuOpen && (
                  <Card className="absolute right-0 top-full mt-1 w-48 py-1 shadow-lg z-50">
                    {currentUser.role === 'admin' ? (
                      <Link 
                        href="/admin"
                        className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        관리자 대시보드
                      </Link>
                    ) : (
                      <>
                        <Link 
                          href="/mypage"
                          className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4 mr-2" />
                          마이페이지
                        </Link>
                        <Link 
                          href="/mypage"
                          className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          내 주문 내역
                        </Link>
                      </>
                    )}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button 
                      className="flex items-center w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        logout()
                        router.push('/login')
                        setUserMenuOpen(false)
                      }}
                    >
                      로그아웃
                    </button>
                  </Card>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline-block">로그인</span>
                </Button>
              </Link>
            )}

            {/* 모바일 메뉴 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* 모바일 검색바 - 핫딜/검색 페이지에서는 숨김 */}
        {!hideSearchBar && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 pt-3 pb-3">
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="핫딜 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 text-sm"
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 모바일 네비게이션 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-4 space-y-2">
            <Link
              href="/hotdeals"
              className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              핫딜
            </Link>
            <button
              onClick={(e) => {
                handleOrderClick(e)
                setIsMobileMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              대리 구매
            </button>
            <button
              onClick={() => {
                setCurrencyModalOpen(true)
                setIsMobileMenuOpen(false)
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <Calculator className="w-4 h-4" />
              환율 계산기
            </button>
            <Link
              href="/mypage"
              className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              마이페이지
            </Link>
          </div>
        </div>
      )}
      
      {/* 환율 계산기 모달 */}
      <CurrencyCalculatorModal 
        open={currencyModalOpen} 
        onOpenChange={setCurrencyModalOpen} 
      />
    </header>
  )
}