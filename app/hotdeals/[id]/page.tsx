'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Eye, Truck, MessageSquare, ThumbsUp, User } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getRelativeTimeKorean } from '@/lib/utils/date-utils'
import { BuyForMeButton } from '@/components/features/order/buy-for-me-button'
import { ko } from 'date-fns/locale'
import { SimilarHotDeals } from '@/components/features/hotdeal/similar-hotdeals'
import { TranslatedContent } from '@/components/features/translation/translated-content'
import { TranslationStatusPanel } from '@/components/features/translation/translation-status-panel'
import { HotDealDetailClient } from './hotdeal-detail-client'
import { CommentSection } from '@/components/features/comments/comment-section'
import { ProductComment } from '@/components/features/comments/product-comment'
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld'
import { HotDeal } from '@/types/hotdeal'
import { useHotDeal, useHotDeals } from '@/hooks/use-supabase-hotdeals'
import { transformSupabaseToLocal } from '@/lib/utils/hotdeal-transformers'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { Loading } from '@/components/ui/loading'
import { PriceDisplay } from '@/components/features/price-display'

const sourceLabels: Record<string, string> = {
  ppomppu: '뽐뿌',
  ruliweb: '루리웹',
  clien: '클리앙',
  quasarzone: '퀘이사존',
  coolenjoy: '쿨엔조이',
  eomisae: '어미새',
  zod: 'zod',
  algumon: '알구몬'
}

export default function HotDealDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data: supabaseDeal, isLoading: loading } = useHotDeal(id)
  const { data: allHotDeals, isLoading: allLoading } = useHotDeals({ limit: 5, sortBy: 'created_at', sortOrder: 'desc' })
  const [deal, setDeal] = useState<HotDeal | null>(null)
  const [similarDeals, setSimilarDeals] = useState<HotDeal[]>([])
  
  // 오늘 날짜 확인 함수
  const isToday = (date: Date) => new Date(date).toDateString() === new Date().toDateString()

  useEffect(() => {
    if (!loading && supabaseDeal) {
      // Supabase 데이터를 LocalStorage 형식으로 변환
      const transformedDeal = transformSupabaseToLocal(supabaseDeal)
      setDeal(transformedDeal)
    }
  }, [loading, supabaseDeal])

  useEffect(() => {
    if (!allLoading && allHotDeals && allHotDeals.data && allHotDeals.data.length > 0 && id) {
      // 최신 핫딜 4개 찾기 (현재 상품 제외)
      const similar = allHotDeals.data
        .filter(d => d.id !== id)
        .map(transformSupabaseToLocal)
        .slice(0, 4)
      setSimilarDeals(similar)
    }
  }, [id, allHotDeals, allLoading])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Loading />
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">핫딜을 찾을 수 없습니다</h1>
        <Link href="/hotdeals">
          <Button>핫딜 목록으로 돌아가기</Button>
        </Link>
      </div>
    )
  }
  
  const sourceLabel = sourceLabels[deal.source] || deal.source
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-6 sm:py-8 px-4 max-w-7xl">
      {/* 구조화된 데이터 */}
      <ProductJsonLd
        id={deal.id}
        name={deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim()}
        description={deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim()}
        image={deal.originalImageUrl}
        price={deal.price}
        originalPrice={undefined}
        availability={deal.status === 'active' ? 'InStock' : 'SoldOut'}
        seller={deal.seller}
        brand={undefined}
        category={undefined}
        url={deal.originalUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: '홈', url: 'https://hiko.kr' },
          { name: '핫딜', url: 'https://hiko.kr/hotdeals' },
          { name: deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim(), url: `https://hiko.kr/hotdeals/${deal.id}` }
        ]}
      />
      
        {/* 브레드크럼 - 개선된 디자인 */}
        <nav className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-4 px-1">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">홈</Link>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/hotdeals" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">핫딜</Link>
          {/* PC에서만 제품명 표시 */}
          <div className="hidden md:flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-500 dark:text-gray-400 truncate max-w-[250px]">{deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim()}</span>
          </div>
        </nav>
      
      {/* 모바일 레이아웃 */}
      <div className="lg:hidden space-y-4">
        {/* 이미지 영역 */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <OptimizedImage
            src={deal.originalImageUrl || ''}
            alt={deal.title}
            width={800}
            height={600}
            className="w-full h-full object-contain bg-white dark:bg-gray-900"
            sizes="100vw"
            priority
            showLoader={true}
            quality={90}
            showFallbackIcon={true}
            fallbackText={`${deal.seller} 상품`}
          />
          {deal.ranking && isToday(deal.crawledAt) && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 py-2.5 rounded-xl font-bold text-xl flex items-center gap-2 shadow-lg">
              🏆 {deal.ranking}위
            </div>
          )}
          {/* 인기 게시물 뱃지 - 이미지 위 */}
          {deal.isPopular && (
            <div className={`absolute ${deal.ranking && isToday(deal.crawledAt) ? 'top-20' : 'top-4'} left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-1 shadow-lg`}>
              ⭐ 인기
            </div>
          )}
          {/* 핫 게시물 뱃지 - 이미지 위 */}
          {deal.isHot && (
            <div className={`absolute ${deal.ranking && isToday(deal.crawledAt) && deal.isPopular ? 'top-36' : deal.ranking && isToday(deal.crawledAt) || deal.isPopular ? 'top-20' : 'top-4'} left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-1 shadow-lg`}>
              🔥 HOT
            </div>
          )}
        </div>
        
        {/* 공유 버튼 */}
        <HotDealDetailClient 
          deal={deal} 
          sourceLabel={sourceLabel} 
        />
        
        {/* 제목 및 정보 영역 */}
        <div className="space-y-6">
          {/* 카드 형태의 정보 영역 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-gray-700">
            {/* 쇼핑몰과 커뮤니티 정보 */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 border-0 px-3 py-1.5 font-medium shadow-sm">
                🛒 {deal.seller}
              </Badge>
              <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5">
                📍 {sourceLabel}
              </Badge>
            </div>
            
            {/* 제목 */}
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 break-words word-break-keep-all leading-relaxed whitespace-pre-wrap">
              <TranslatedContent 
                hotDeal={{
                  ...deal,
                  // 제목에서 가격 정보 제거
                  title: deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim()
                }} 
                field="title" 
                showIndicator={true}
              />
            </h1>
            
            {/* 메타 정보 - 간소화된 디자인 */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span className="font-medium">
                  {(deal.viewCount || 0) > 999 ? `${Math.floor((deal.viewCount || 0) / 1000)}k` : (deal.viewCount || 0).toLocaleString()}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <ThumbsUp className="w-4 h-4" />
                <span className="font-medium">{(deal.communityRecommendCount || 0).toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">{deal.commentCount || 0}</span>
              </span>
              {deal.userId && (
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-medium">{deal.userId}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 ml-auto">
                <Clock className="w-4 h-4" />
                <span className="text-xs">{getRelativeTimeKorean(deal.crawledAt)}</span>
              </span>
            </div>
          </div>
          
          {/* 가격 정보 - 개선된 디자인 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
            <div className="space-y-3">
              {/* 가격 영역 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">판매가</span>
                {(deal.price === 0 && /다양/i.test(deal.title)) ? (
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    가격 다양
                  </span>
                ) : deal.price === 0 ? (
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    프로모션
                  </span>
                ) : deal.price === -1 ? (
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    가격 다양
                  </span>
                ) : deal.price > 0 ? (
                  <PriceDisplay 
                    price={deal.price} 
                    originalCurrency="KRW"
                    className="text-3xl font-bold text-red-600 dark:text-red-500"
                  />
                ) : (
                  <span className="text-xl font-semibold text-gray-500">가격 정보 없음</span>
                )}
              </div>
              
              {/* 배송비 정보 - 가격 다양이거나 일반 가격일 때만 표시 */}
              {(deal.price === -1 || deal.price > 0 || (deal.price === 0 && /다양/i.test(deal.title))) && deal.shipping && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">배송비</span>
                    {deal.shipping.isFree ? (
                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        <Truck className="w-4 h-4" />
                        <span className="text-sm font-medium">무료배송</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-600 dark:text-gray-400">배송비 별도</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          
          {/* 번역 상태 패널 */}
          <TranslationStatusPanel 
            hotDealId={deal.id}
            compact={true}
            className="mb-4"
          />
          
          
          {/* 구매 버튼 - 개선된 스타일 */}
          <div className="space-y-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            {/* 대리구매 신청 버튼 - 주요 액션 */}
            <BuyForMeButton 
              hotdeal={{
                id: deal.id,
                title: deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim(),
                price: deal.price ? deal.price.toString() : '0',
                imageUrl: deal.originalImageUrl,
                productUrl: deal.originalUrl,
                seller: deal.seller,
              }}
              variant="default"
              size="lg"
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
            />
            
            {/* 원글 링크 버튼 - 보조 액션 */}
            <Link 
              href={deal.originalUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full h-12 text-base border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>원글 보기</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* PC 레이아웃 */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 이미지 영역 - PC에서 2칼럼 차지 */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <OptimizedImage
              src={deal.originalImageUrl || ''}
              alt={deal.title}
              width={800}
              height={600}
              className="w-full h-full object-contain bg-white dark:bg-gray-900"
              sizes="(max-width: 768px) 100vw, 66vw"
              priority
              showLoader={true}
              quality={90}
              showFallbackIcon={true}
              fallbackText={`${deal.seller} 상품`}
            />
            {deal.ranking && isToday(deal.crawledAt) && (
              <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-2 rounded-lg font-bold text-xl flex items-center gap-2">
                🏆 {deal.ranking}위
              </div>
            )}
            {/* 인기 게시물 뱃지 - 이미지 위 */}
            {deal.isPopular && (
              <div className={`absolute ${deal.ranking && isToday(deal.crawledAt) ? 'top-16' : 'top-4'} left-4 bg-red-500 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1`}>
                🔥 인기
              </div>
            )}
            {/* 핫 게시물 뱃지 - 이미지 위 */}
            {deal.isHot && (
              <div className={`absolute ${deal.ranking && isToday(deal.crawledAt) && deal.isPopular ? 'top-28' : deal.ranking && isToday(deal.crawledAt) || deal.isPopular ? 'top-16' : 'top-4'} left-4 bg-orange-500 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1`}>
                🔥 HOT
              </div>
            )}
          </div>
          
            {/* 공유 버튼 (클라이언트 컴포넌트) */}
            <div className="mt-6 flex-grow flex flex-col justify-end">
              <HotDealDetailClient 
                deal={deal} 
                sourceLabel={sourceLabel} 
              />
            </div>
          </div>
        
        {/* 정보 영역 - PC에서 1칼럼 */}
        <div className="space-y-6">
          {/* 카드 형태의 정보 영역 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            {/* 쇼핑몰과 커뮤니티 정보 */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 border-0 px-3 py-1.5 font-medium shadow-sm">
                🛒 {deal.seller}
              </Badge>
              <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5">
                📍 {sourceLabel}
              </Badge>
            </div>
            
            {/* 제목 */}
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 break-words word-break-keep-all leading-relaxed whitespace-pre-wrap">
              <TranslatedContent 
                hotDeal={{
                  ...deal,
                  // 제목에서 가격 정보 제거
                  title: deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim()
                }} 
                field="title" 
                showIndicator={true}
              />
            </h1>
            
            {/* 메타 정보 */}
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium">조회</span>
                  <span className="text-gray-900 font-semibold">
                    {(deal.viewCount || 0) > 999 ? `${Math.floor((deal.viewCount || 0) / 1000)}k` : (deal.viewCount || 0).toLocaleString()}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800">
                  <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  <span className="font-medium">추천</span>
                  <span className="text-blue-900 font-semibold">{(deal.communityRecommendCount || 0).toLocaleString()}</span>
                </span>
                <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg shadow-sm border border-green-200 dark:border-green-800">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span className="font-medium">댓글</span>
                  <span className="text-green-900 font-semibold">{deal.commentCount || 0}</span>
                </span>
                {deal.userId && (
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium">{deal.userId}</span>
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {getRelativeTimeKorean(deal.crawledAt)}
                </span>
              </div>
            </div>
          </div>
          
          
          {/* 가격 정보 - 개선된 디자인 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-sm">
            <div className="space-y-4">
              {/* 가격 영역 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">판매가</span>
                {(deal.price === 0 && /다양/i.test(deal.title)) ? (
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    가격 다양
                  </span>
                ) : deal.price === 0 ? (
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    프로모션
                  </span>
                ) : deal.price === -1 ? (
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    가격 다양
                  </span>
                ) : deal.price > 0 ? (
                  <PriceDisplay 
                    price={deal.price} 
                    originalCurrency="KRW"
                    className="text-4xl font-bold text-red-600 dark:text-red-500"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-gray-500">가격 정보 없음</span>
                )}
              </div>
              
              {/* 배송비 정보 - 가격 다양이거나 일반 가격일 때만 표시 */}
              {(deal.price === -1 || deal.price > 0 || (deal.price === 0 && /다양/i.test(deal.title))) && deal.shipping && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">배송비</span>
                    {deal.shipping.isFree ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Truck className="w-4 h-4" />
                        <span className="font-medium">무료배송</span>
                      </div>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">배송비 별도</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          
          {/* 번역 상태 패널 */}
          <TranslationStatusPanel 
            hotDealId={deal.id}
            compact={true}
            className="mb-4"
          />
          
          
          {/* 구매 버튼 - 개선된 스타일 */}
          <div className="space-y-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            {/* 대리구매 신청 버튼 - 주요 액션 */}
            <BuyForMeButton 
              hotdeal={{
                id: deal.id,
                title: deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim(),
                price: deal.price ? deal.price.toString() : '0',
                imageUrl: deal.originalImageUrl,
                productUrl: deal.originalUrl,
                seller: deal.seller,
              }}
              variant="default"
              size="lg"
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
            />
            
            {/* 원글 링크 버튼 - 보조 액션 */}
            <Link 
              href={deal.originalUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full h-12 text-base border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>원글 보기</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </div>
      
        {/* 댓글 섹션 */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
          {/* 쇼핑 코멘트 */}
          <ProductComment hotDeal={deal} />
          
          {/* 일반 댓글 */}
          <CommentSection 
            hotdealId={deal.id} 
            commentCount={deal.commentCount || 0} 
          />
        </div>
        
        {/* 최신 핫딜 추천 */}
        {similarDeals.length > 0 && (
          <div id="similar-deals" className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
            {/* 타이틀 영역 */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                {/* 아이콘 */}
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg">
                  <span className="text-2xl">🆕</span>
                </div>
                
                {/* 타이틀 */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  최신 핫딜
                </h2>
                
                {/* 갯수 뱃지 */}
                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium rounded-full">
                  {similarDeals.length}개
                </span>
              </div>
              
              {/* 서브텍스트 */}
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
                방금 등록된 따끈따끈한 할인 정보
              </p>
            </div>
            
            {/* 구분선 */}
            <div className="h-px bg-gray-200 dark:bg-gray-700 mb-6"></div>
            
            <SimilarHotDeals deals={similarDeals} />
          </div>
        )}
      </div>
    </div>
  )
}