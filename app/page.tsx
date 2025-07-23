'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { 
  Truck, 
  CreditCard, 
  Globe, 
  Star, 
  TrendingUp, 
  ShoppingBag,
  Shield,
  Heart,
  ArrowRight,
  CheckCircle,
  Users,
  MessageSquare,
  Zap,
  ChevronRight
} from 'lucide-react'
import { HotDealsSection } from '@/components/features/home/hotdeals-section'
import { useHotDeals } from '@/hooks/use-local-db'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignedIn, SignedOut } from '@clerk/nextjs'


export default function Home() {
  const router = useRouter()
  const [searchKeyword, setSearchKeyword] = useState('')
  
  // 실시간 핫딜 데이터 가져오기
  const { hotdeals } = useHotDeals()
  
  // 3일 이내 핫딜만 필터링
  const activeHotDeals = useMemo(() => {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    return hotdeals.filter(deal => {
      const crawledDate = new Date(deal.crawledAt)
      return crawledDate >= threeDaysAgo
    })
  }, [hotdeals])
  
  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchKeyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchKeyword)}`)
    }
  }
  
  // 6개 커뮤니티 정보
  const communities = [
    {
      name: '뽐뿌',
      description: '전자제품, 생활용품 특가',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      features: ['전자제품 특화', '생활용품 할인', '실사용 후기']
    },
    {
      name: '루리웹',
      description: '게임, PC 부품 할인',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      features: ['게임 특가', 'PC 부품', '콘솔 게임']
    },
    {
      name: '클리앙',
      description: '애플, IT 기기 정보',
      color: 'from-gray-600 to-gray-700',
      bgColor: 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      features: ['애플 제품', 'IT 기기', '스마트 기기']
    },
    {
      name: '쿨엔조이',
      description: '컴퓨터, 주변기기',
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      borderColor: 'border-green-200 dark:border-green-800',
      features: ['컴퓨터 부품', '주변기기', '하드웨어']
    },
    {
      name: '퀘이사존',
      description: 'PC 하드웨어 전문',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      features: ['그래픽카드', 'CPU/메모리', '벤치마크']
    },
    {
      name: '이토랜드',
      description: 'IT 전반 핫딜',
      color: 'from-red-500 to-red-600',
      bgColor: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      borderColor: 'border-red-200 dark:border-red-800',
      features: ['IT 전반', '소프트웨어', '디지털 기기']
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section - 핫딜 정보 플랫폼으로 포지셔닝 */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Clerk 인증 상태 표시 */}
          <div className="mb-4 flex justify-center">
            <SignedIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  로그인되었습니다! 핫딜을 둘러보세요
                </span>
              </div>
            </SignedIn>
            <SignedOut>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  로그인하고 더 많은 혜택을 받으세요
                </span>
              </div>
            </SignedOut>
          </div>
          
          {/* 실시간 알림 배너 */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-200 dark:border-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                지금 {activeHotDeals.length}개의 핫딜이 진행중입니다
              </span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                한국 핫딜 정보
              </span>
              <span className="text-gray-900 dark:text-white">의 모든 것</span>
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
              한국인들만 알던 꿀정보를 당신의 언어로
            </p>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              6개 커뮤니티 • 실시간 모니터링 • 7개 언어 자동번역
            </p>
          </div>
          
          {/* 실시간 통계 */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {activeHotDeals.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">활성 핫딜</div>
            </div>
            <div className="text-center border-x border-gray-200 dark:border-gray-700">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">6</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">커뮤니티</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">지원언어</div>
            </div>
          </div>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200 text-lg px-8">
              <Link href="/hotdeals">
                <TrendingUp className="w-5 h-5 mr-2" />
                지금 핫딜 보기
              </Link>
            </Button>
            <SignedOut>
              <Button asChild variant="outline" size="lg" className="border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 text-lg px-8">
                <Link href="/sign-up">
                  <Users className="w-5 h-5 mr-2" />
                  무료 회원가입
                </Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button asChild variant="outline" size="lg" className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 text-lg px-8">
                <Link href="/order">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  대리구매 시작
                </Link>
              </Button>
            </SignedIn>
          </div>

          {/* 핵심 가치 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card className="text-center p-6 hover:shadow-lg transition-all hover:scale-105 duration-200 border-2 border-transparent hover:border-orange-200 dark:hover:border-orange-800">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full flex items-center justify-center">
                <Zap className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">실시간 모니터링</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">24시간 놓치지 않는 핫딜</p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-all hover:scale-105 duration-200 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                <Globe className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">7개 언어 지원</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">언어 장벽 없는 쇼핑 정보</p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-all hover:scale-105 duration-200 border-2 border-transparent hover:border-green-200 dark:hover:border-green-800">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">커뮤니티 검증</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">진짜 핫딜만 모아서</p>
            </Card>
          </div>
        </div>
      </section>

      {/* 왜 HiKo인가 - 커뮤니티 소개 섹션 */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              한국인들만 알던 핫딜의 비밀
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              6개 주요 커뮤니티에서 실시간으로 수집한 검증된 핫딜 정보를 
              <br className="hidden sm:block" />
              당신의 언어로 편하게 확인하세요
            </p>
          </div>

          {/* 커뮤니티 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {communities.map((community, index) => (
              <Card 
                key={index} 
                className={`relative overflow-hidden border-2 ${community.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${community.bgColor} opacity-50`} />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className={`text-2xl font-bold mb-1 bg-gradient-to-r ${community.color} bg-clip-text text-transparent`}>
                        {community.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{community.description}</p>
                    </div>
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                      <MessageSquare className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {community.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 정보의 가치 강조 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              정보만 있어도 쇼핑이 달라집니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              매일 500개 이상의 새로운 핫딜이 올라오며, 커뮤니티 회원들의 추천과 검증을 거친 
              진짜 할인 정보만 모아서 보여드립니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
                <Link href="/hotdeals">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  핫딜 둘러보기
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 사용자 경로 분기 섹션 */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              어떤 도움이 필요하신가요?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              상황에 맞는 최적의 서비스를 제공합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* 직접 구매 가능한 경우 */}
            <Card className="relative overflow-hidden border-2 border-green-200 dark:border-green-800 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-bl-full opacity-10" />
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  한국 쇼핑몰 이용이 가능해요
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  회원가입과 결제가 가능하신 분들을 위한 핫딜 정보 서비스
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">실시간 핫딜 정보 제공</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">7개 언어로 자동 번역</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">커뮤니티 검증된 정보만 엄선</span>
                  </li>
                </ul>
                <Button asChild className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg">
                  <Link href="/hotdeals">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    핫딜 정보 보러가기
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* 도움이 필요한 경우 */}
            <Card className="relative overflow-hidden border-2 border-blue-200 dark:border-blue-800 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-bl-full opacity-10" />
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  한국 쇼핑몰 이용이 어려워요
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  복잡한 회원가입과 결제를 대신 처리해드리는 대리구매 서비스
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">복잡한 회원가입 대행</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">한국 결제 시스템 대행</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">고객 주소로 직배송</span>
                  </li>
                </ul>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    💡 수수료: 구매금액의 8% (최소 3,000원)
                  </p>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg">
                  <Link href="/order">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    대리구매 서비스 알아보기
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 추가 안내 메시지 */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              <span className="font-semibold text-gray-900 dark:text-white">걱정하지 마세요!</span> 
              {' '}핫딜 정보는 누구나 무료로 이용할 수 있으며, 
              대리구매는 필요하신 분만 선택적으로 이용하시면 됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* 검색 섹션 */}
      <section className="py-8 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          
          {/* 검색 영역 */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="찾고 싶은 제품을 검색하세요 / Search for products"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            
            {/* 인기 카테고리 빠른 버튼 */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              <Link href="/hotdeals?category=beauty">
                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700">
                  K-뷰티 | K-Beauty
                </Button>
              </Link>
              <Link href="/hotdeals?category=fashion">
                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700">
                  K-패션 | K-Fashion
                </Button>
              </Link>
              <Link href="/hotdeals?category=electronics">
                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700">
                  전자제품 | Electronics
                </Button>
              </Link>
              <Link href="/hotdeals?category=food">
                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700">
                  식품 | Food
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* 실시간 핫딜 섹션 - 강화된 버전 */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          {/* 섹션 헤더 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-200 dark:border-red-800 mb-6">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                실시간 업데이트 중
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              지금 가장 핫한 딜
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              커뮤니티에서 검증된 최고의 할인 정보를 실시간으로 확인하세요
            </p>
          </div>

          {/* 빠른 필터 버튼 */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Button variant="outline" size="sm" className="border-2 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all">
              🔥 인기순
            </Button>
            <Button variant="outline" size="sm" className="border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
              ⏰ 최신순
            </Button>
            <Button variant="outline" size="sm" className="border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all">
              💸 할인율순
            </Button>
            <Button variant="outline" size="sm" className="border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
              🚚 무료배송
            </Button>
          </div>

          {/* 핫딜 컴포넌트 */}
          <HotDealsSection />

          {/* 더 보기 CTA */}
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200 px-8">
              <Link href="/hotdeals">
                모든 핫딜 보러가기
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              매일 500개 이상의 새로운 핫딜이 업데이트됩니다
            </p>
          </div>
        </div>
      </section>

      {/* 서비스 흐름 섹션 */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">간단한 이용 방법</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: '상품 찾기', desc: '핫딜을 둘러보거나 원하는 상품 URL을 입력하세요' },
              { step: '2', title: '주문 신청', desc: '배송 정보와 결제 정보를 입력하세요' },
              { step: '3', title: 'HiKo가 대리 구매', desc: '전문 구매팀이 한국 사이트에서 구매를 진행합니다' },
              { step: '4', title: '안전한 배송', desc: '검수 후 고객님께 안전하게 배송해드립니다' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '50K+', label: '활성 사용자', color: 'text-white' },
              { number: '1M+', label: '처리된 주문', color: 'text-white' },
              { number: '98%', label: '고객 만족도', color: 'text-white' },
              { number: '24/7', label: '고객 지원', color: 'text-white' }
            ].map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 고객 후기 섹션 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">전 세계 고객들의 이야기</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Chen',
                country: '🇺🇸 미국',
                comment: '한국 쇼핑이 이렇게 쉬울 줄 몰랐어요! HiKo 덕분에 좋아하는 K-뷰티 제품을 쉽게 구매할 수 있게 되었습니다.'
              },
              {
                name: 'Nguyen Minh',
                country: '🇻🇳 베트남',
                comment: '베트남어로 모든 정보를 볼 수 있어서 정말 편해요. 대리 구매 서비스도 너무 만족스럽습니다!'
              },
              {
                name: 'Ahmed Hassan',
                country: '🇸🇦 사우디아라비아',
                comment: '아랍어 지원이 완벽해요. 한국 전자제품을 안전하게 구매할 수 있는 최고의 플랫폼입니다.'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    &ldquo;{testimonial.comment}&rdquo;
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{testimonial.country}</div>
                    <div className="font-semibold">{testimonial.name}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <SignedOut>
            <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요!</h2>
            <p className="text-xl mb-8 text-blue-100">
              회원가입하고 첫 주문 시 10% 할인 혜택을 받으세요
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-2xl hover:shadow-xl hover:scale-105 transition-all duration-200 gap-2 px-10 py-6 text-lg font-semibold">
                <Link href="/sign-up">
                  <CheckCircle className="w-6 h-6" />
                  무료 회원가입
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:border-white transition-all duration-200 gap-2 px-10 py-6 text-lg">
                <Link href="/hotdeals">
                  핫딜 둘러보기
                  <ArrowRight className="w-6 h-6" />
                </Link>
              </Button>
            </div>
          </SignedOut>
          <SignedIn>
            <h2 className="text-3xl font-bold mb-6">환영합니다!</h2>
            <p className="text-xl mb-8 text-blue-100">
              지금 바로 핫딜을 확인하고 대리구매 서비스를 이용해보세요
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-2xl hover:shadow-xl hover:scale-105 transition-all duration-200 gap-2 px-10 py-6 text-lg font-semibold">
                <Link href="/hotdeals">
                  <TrendingUp className="w-6 h-6" />
                  핫딜 보러가기
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:border-white transition-all duration-200 gap-2 px-10 py-6 text-lg">
                <Link href="/order">
                  대리구매 시작하기
                  <ArrowRight className="w-6 h-6" />
                </Link>
              </Button>
            </div>
          </SignedIn>
        </div>
      </section>


      {/* 파트너 섹션 */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-lg font-semibold text-gray-600 mb-8">
            신뢰할 수 있는 파트너들과 함께합니다
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">쿠팡</div>
            <div className="text-2xl font-bold text-gray-400">네이버</div>
            <div className="text-2xl font-bold text-gray-400">G마켓</div>
            <div className="text-2xl font-bold text-gray-400">11번가</div>
            <div className="text-2xl font-bold text-gray-400">SSG</div>
          </div>
        </div>
      </section>
    </div>
  )
}