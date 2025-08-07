'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, Search, Languages, User, ShoppingBag, Heart, ChevronDown, Shield, Crown, Package, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/features/notifications/notification-bell'
import { ThemeToggle } from '@/components/features/theme/theme-toggle'
import { CurrencySelector } from '@/components/features/currency-selector'
import { MobileCurrencySelector } from '@/components/features/mobile-currency-selector'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { languages } from '@/lib/i18n/config'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { useClerkRole } from '@/hooks/use-clerk-role'
import { useRouter, usePathname } from 'next/navigation'
import { ShowForRole, RoleBasedContent } from '@/components/auth/role-based-content'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { user: currentUser, isLoading } = useSupabaseUser()
  const { isAuthenticated, isAdmin } = useClerkRole()
  const router = useRouter()
  const pathname = usePathname()
  const langMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  // 핫딜 관련 페이지에서만 검색바 표시 (사용자 편의성 개선)
  const showSearchBar = (pathname === '/hotdeals' || pathname.startsWith('/hotdeals/')) && pathname !== '/search'

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

  // 스크롤 방향 감지 및 헤더 표시/숨김 처리
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollThreshold = 100 // 스크롤 임계값 (px)
      
      if (currentScrollY < scrollThreshold) {
        // 상단 근처에서는 항상 헤더 표시
        setIsHeaderVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
        // 아래로 스크롤 시 헤더 숨김
        setIsHeaderVisible(false)
        // 열린 드롭다운 메뉴들 닫기
        setLangMenuOpen(false)
        setUserMenuOpen(false)
        setIsMobileMenuOpen(false)
      } else if (currentScrollY < lastScrollY) {
        // 위로 스크롤 시 헤더 표시
        setIsHeaderVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // 헤더 높이를 CSS 변수로 설정
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.getElementById('navigation')
      if (header) {
        const headerHeight = header.offsetHeight
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`)
      }
    }

    updateHeaderHeight()
    window.addEventListener('resize', updateHeaderHeight)
    return () => window.removeEventListener('resize', updateHeaderHeight)
  }, [isMobileMenuOpen, showSearchBar])

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
    <header 
      id="navigation" 
      role="banner" 
      className={`fixed top-0 left-0 right-0 z-50 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
        isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      style={{ WebkitTransform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)', transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)' }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12">
        <div className="flex items-center h-14 md:h-16 gap-2 md:gap-4 lg:gap-8 justify-between">
          {/* 로고 영역 - 모바일에서 크기 조정 */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HiKo
              </h1>
            </Link>
          </div>

          {/* 관리자 전용 중앙 네비게이션 */}
          <ShowForRole roles={['admin']}>
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 flex-shrink-0">
              <Link 
                href="/hotdeals" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors whitespace-nowrap px-3 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-gray-800"
              >
                핫딜
              </Link>
              <Link 
                href="/admin" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700"
              >
                <Shield className="w-4 h-4" />
                관리자 대시보드
              </Link>
            </nav>
          </ShowForRole>

          {/* 일반 사용자/회원 네비게이션 */}
          <ShowForRole roles={['guest', 'customer']} includeHigherRoles={false}>
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 flex-shrink-0">
              <Link href="/hotdeals" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors whitespace-nowrap">
                핫딜
              </Link>
              <button onClick={handleOrderClick} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors whitespace-nowrap">
                대리 구매
              </button>
            </nav>
          </ShowForRole>
          
          {/* 회원 전용 메뉴 */}
          <ShowForRole roles={['customer']} includeHigherRoles={false}>
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 flex-shrink-0">
              <Link href="/mypage" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors whitespace-nowrap">
                마이페이지
              </Link>
            </nav>
          </ShowForRole>

          {/* 검색바 (데스크톱) - 핫딜 관련 페이지에서만 표시, 관리자는 숨김 */}
          {showSearchBar && currentUser?.role !== 'admin' && (
            <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-md mx-4 xl:mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="핫딜 검색 (예: 노트북, 에어팟)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full"
                  aria-label="핫딜 검색"
                  role="searchbox"
                />
              </div>
            </form>
          )}

          {/* 우측 메뉴 - 모바일 최적화 */}
          <div className="flex items-center space-x-1 md:space-x-2 lg:space-x-4 flex-shrink-0">
            {/* 모바일에서는 중요한 기능만 표시 */}
            <div className="hidden md:flex items-center space-x-2">
              {/* 언어 선택 - 관리자가 아닌 경우만 표시 */}
              {currentUser?.role !== 'admin' && (
                <div className="relative" ref={langMenuRef}>
                  <Button 
                    id="language-button"
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 px-2"
                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setLangMenuOpen(!langMenuOpen)
                      }
                    }}
                    aria-label="언어 선택"
                    aria-expanded={langMenuOpen}
                    aria-haspopup="menu"
                  >
                    <Languages className="w-4 h-4" />
                    <span className="text-sm font-medium">{currentLang.code.toUpperCase()}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  {langMenuOpen && (
                    <Card className="absolute right-0 top-full mt-1 w-40 py-1 shadow-lg z-50" role="menu" aria-labelledby="language-button">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            console.log('Language changed to:', lang.code)
                            setLangMenuOpen(false)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              console.log('Language changed to:', lang.code)
                              setLangMenuOpen(false)
                            }
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center ${
                            currentLang.code === lang.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          role="menuitem"
                          aria-current={currentLang.code === lang.code ? 'true' : 'false'}
                        >
                          <span className="mr-2 text-lg">{lang.flag}</span>
                          <span className="text-sm">{lang.code.toUpperCase()}</span>
                        </button>
                      ))}
                    </Card>
                  )}
                </div>
              )}

              {/* 환율 선택기 - 관리자가 아닌 경우만 표시 */}
              {currentUser?.role !== 'admin' && (
                <div className="flex items-center">
                  <CurrencySelector />
                </div>
              )}
            </div>

            {/* 모바일에서 표시할 핵심 기능들 */}
            <div className="flex md:hidden items-center">
              {/* 모바일 검색 버튼 - 핫딜 페이지에서만 */}
              {showSearchBar && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2.5"
                  onClick={() => {
                    // 검색바로 포커스 이동
                    const searchInput = document.querySelector('input[type="text"][placeholder*="핫딜 검색"]') as HTMLInputElement;
                    if (searchInput) {
                      searchInput.focus();
                      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  aria-label="검색"
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* 테마 토글 - 모든 디바이스에서 표시 */}
            <ThemeToggle />

            {/* 알림 - 로그인한 사용자만 */}
            <SignedIn>
              <NotificationBell />
            </SignedIn>

            {/* Clerk 사용자 메뉴 - 데스크톱에서만 상세 표시 */}
            <div className="hidden md:flex items-center gap-2">
              <SignedOut>
                <SignInButton>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span className="hidden lg:inline-block">로그인</span>
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button variant="default" size="sm" className="bg-[#6c47ff] text-white hover:bg-[#5a3ad3] flex items-center space-x-2">
                    <span>회원가입</span>
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton 
                  afterSignOutUrl="/login"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </SignedIn>
            </div>

            {/* 모바일 메뉴 버튼 - 크기 증가 */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden relative p-2.5"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <div className="relative">
                  <Menu className="w-5 h-5" />
                  {/* 로그인 상태 표시 점 */}
                  {currentUser && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* 모바일 검색바 - 통합된 디자인 */}
        {showSearchBar && currentUser?.role !== 'admin' && (
          <div className="lg:hidden">
            <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <form onSubmit={handleSearch} className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="핫딜 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 h-9 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-label="핫딜 검색"
                      role="searchbox"
                    />
                  </div>
                  
                  {/* 필터와 통화 버튼 그룹 */}
                  <div className="flex items-center gap-1">
                    {/* 핫딜 페이지에서만 필터 버튼 표시 */}
                    {pathname === '/hotdeals' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-2.5 flex items-center gap-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => {
                          const filterModal = document.querySelector('.filter-modal-backdrop');
                          if (filterModal) {
                            const event = new CustomEvent('closeFilterModal');
                            window.dispatchEvent(event);
                          } else {
                            const mobileFilterButton = document.querySelector('.mobile-filter-button') as HTMLButtonElement;
                            if (mobileFilterButton) {
                              mobileFilterButton.click();
                            }
                          }
                        }}
                        aria-label="필터 설정"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="text-xs font-medium">필터</span>
                      </Button>
                    )}
                    
                    {/* 모바일 통화 설정 버튼 */}
                    <MobileCurrencySelector />
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 모바일 네비게이션 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
          <div className="px-4 py-3 space-y-1 max-h-[calc(100vh-64px)] overflow-y-auto">
            {/* Clerk 사용자 프로필 섹션 */}
            <SignedIn>
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 px-3 py-2">
                  <UserButton 
                    afterSignOutUrl="/login"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10"
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Clerk 계정으로 로그인됨
                    </p>
                  </div>
                </div>
              </div>
            </SignedIn>

            {/* 관리자 전용 모바일 메뉴 */}
            <ShowForRole roles={['admin']}>
              <div className="space-y-1 mb-4">
                <Link
                  href="/hotdeals"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="font-medium">핫딜</span>
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg transition-all duration-200 group shadow-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors shadow-sm">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium">관리자 대시보드</span>
                </Link>
              </div>
            </ShowForRole>
            
            {/* 일반 사용자 메뉴 */}
            <ShowForRole roles={['guest', 'customer']} includeHigherRoles={false}>
              <div className="space-y-1">
                <Link
                  href="/hotdeals"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="font-medium">핫딜</span>
                </Link>
                <button
                  onClick={(e) => {
                    handleOrderClick(e)
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="font-medium">대리 구매</span>
                </button>
              </div>
              
              {/* 구분선 */}
              <div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
            </ShowForRole>
            
            {/* Clerk 사용자 계정 관련 메뉴 */}
            <SignedIn>
              <div className="space-y-1 pt-2">
                <div className="flex items-center gap-3 px-4 py-3">
                  <UserButton 
                    afterSignOutUrl="/login"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10"
                      }
                    }}
                  />
                  <span className="font-medium text-gray-700 dark:text-gray-300">계정 관리</span>
                </div>
              </div>
            </SignedIn>
            <SignedOut>
              <div className="pt-2 space-y-1">
                <SignInButton>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-medium">로그인</span>
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-3 text-white bg-[#6c47ff] hover:bg-[#5a3ad3] rounded-lg transition-all duration-200 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#5a3ad3] flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-medium">회원가입</span>
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  )
}