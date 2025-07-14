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
import { useHotDeals } from '@/hooks/use-local-db'
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
  const { hotdeals, loading } = useHotDeals()
  const [deal, setDeal] = useState<HotDeal | null>(null)
  const [similarDeals, setSimilarDeals] = useState<HotDeal[]>([])
  
  // 오늘 날짜 확인 함수
  const isToday = (date: Date) => new Date(date).toDateString() === new Date().toDateString()

  useEffect(() => {
    if (!loading && hotdeals.length > 0) {
      const foundDeal = hotdeals.find(d => d.id === id)
      if (foundDeal) {
        setDeal(foundDeal)
        
        // 유사 상품 찾기 - 같은 쇼핑몰 또는 같은 커뮤니티
        const similar = hotdeals
          .filter(d => 
            d.id !== id && 
            (d.seller === foundDeal.seller || d.source === foundDeal.source) &&
            d.status === 'active'
          )
          .sort((a, b) => {
            // 추천수가 높은 순으로 정렬
            return b.communityRecommendCount - a.communityRecommendCount
          })
          .slice(0, 4)
        setSimilarDeals(similar)
      }
    }
  }, [id, hotdeals, loading])

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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
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
      
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-4 overflow-x-auto">
        <Link href="/" className="hover:text-blue-600 whitespace-nowrap">홈</Link>
        <span>/</span>
        <Link href="/hotdeals" className="hover:text-blue-600 whitespace-nowrap">핫딜</Link>
        <span>/</span>
        <span className="text-gray-900 whitespace-nowrap truncate max-w-[200px]">{deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim()}</span>
      </nav>
      
      {/* 모바일 레이아웃 */}
      <div className="lg:hidden space-y-4">
        {/* 이미지 영역 */}
        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
          {deal.originalImageUrl ? (
            <OptimizedImage
              src={deal.originalImageUrl}
              alt={deal.title}
              width={800}
              height={600}
              className="w-full h-full object-contain bg-white"
              sizes="100vw"
              priority
              showLoader={true}
              quality={90}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">이미지 없음</span>
            </div>
          )}
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
        
        {/* 공유 버튼 */}
        <HotDealDetailClient 
          deal={deal} 
          sourceLabel={sourceLabel} 
        />
        
        {/* 제목 및 정보 영역 */}
        <div className="space-y-6">
          {/* 쇼핑몰과 커뮤니티 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">{deal.seller}</Badge>
              <Badge variant="outline">{sourceLabel}</Badge>
            </div>
            
            {/* 제목 */}
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 break-words word-break-keep-all leading-tight">
              <TranslatedContent 
                hotDeal={{
                  ...deal,
                  // 제목에서 가격 정보 제거
                  title: deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim()
                }} 
                field="title" 
                showIndicator={true}
              />
              {/* 인기 게시물 뱃지 */}
              {deal.isPopular && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-500 text-white shrink-0">
                  🔥 인기
                </span>
              )}
              {/* 핫 게시물 뱃지 */}
              {deal.isHot && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-orange-500 text-white shrink-0">
                  🔥 HOT
                </span>
              )}
            </h1>
            
            {/* 메타 정보 */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium">조회</span>
                  <span className="text-gray-900 font-semibold">
                    {(deal.viewCount || 0) > 999 ? `${Math.floor((deal.viewCount || 0) / 1000)}k` : (deal.viewCount || 0).toLocaleString()}
                  </span>
                </span>
                <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                  <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  <span className="font-medium">추천</span>
                  <span className="text-blue-900 font-semibold">{deal.communityRecommendCount.toLocaleString()}</span>
                </span>
                <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span className="font-medium">댓글</span>
                  <span className="text-green-900 font-semibold">{deal.commentCount || 0}</span>
                </span>
                {deal.userId && (
                  <span className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded">
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
          
          {/* 가격 정보 - 모바일에서 한 줄로 표시 */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between gap-4">
              {deal.price ? (
                <PriceDisplay 
                  price={deal.price} 
                  originalCurrency="KRW"
                  className="text-2xl font-bold text-red-600"
                />
              ) : (
                <span className="text-2xl font-bold text-red-600">가격 정보 없음</span>
              )}
              {deal.shipping && deal.shipping.isFree && (
                <span className="flex items-center gap-1 text-sm bg-green-50 px-2 py-1 rounded">
                  <Truck className="w-3 h-3 text-green-600" />
                  <span className="font-semibold text-green-600">무료배송</span>
                </span>
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
          <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
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
              className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
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
                className="w-full h-12 text-base border-2 hover:bg-gray-50"
              >
                📋 원글 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* PC 레이아웃 */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* 이미지 영역 - PC에서 2칼럼 차지 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
            {deal.originalImageUrl ? (
              <OptimizedImage
                src={deal.originalImageUrl}
                alt={deal.title}
                width={800}
                height={600}
                className="w-full h-full object-contain bg-white"
                sizes="(max-width: 768px) 100vw, 66vw"
                priority
                showLoader={true}
                quality={90}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">이미지 없음</span>
              </div>
            )}
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
          <HotDealDetailClient 
            deal={deal} 
            sourceLabel={sourceLabel} 
          />
          
        </div>
        
        {/* 정보 영역 - PC에서 1칼럼, 고정 위치 */}
        <div className="lg:sticky lg:top-24 lg:h-fit space-y-6">
          {/* 쇼핑몰과 커뮤니티 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">{deal.seller}</Badge>
              <Badge variant="outline">{sourceLabel}</Badge>
            </div>
            
            {/* 제목 */}
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 break-words word-break-keep-all leading-tight">
              <TranslatedContent 
                hotDeal={{
                  ...deal,
                  // 제목에서 가격 정보 제거
                  title: deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim()
                }} 
                field="title" 
                showIndicator={true}
              />
              {/* 인기 게시물 뱃지 */}
              {deal.isPopular && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-500 text-white shrink-0">
                  🔥 인기
                </span>
              )}
              {/* 핫 게시물 뱃지 */}
              {deal.isHot && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-orange-500 text-white shrink-0">
                  🔥 HOT
                </span>
              )}
            </h1>
            
            {/* 메타 정보 */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium">조회</span>
                  <span className="text-gray-900 font-semibold">
                    {(deal.viewCount || 0) > 999 ? `${Math.floor((deal.viewCount || 0) / 1000)}k` : (deal.viewCount || 0).toLocaleString()}
                  </span>
                </span>
                <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                  <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  <span className="font-medium">추천</span>
                  <span className="text-blue-900 font-semibold">{deal.communityRecommendCount.toLocaleString()}</span>
                </span>
                <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span className="font-medium">댓글</span>
                  <span className="text-green-900 font-semibold">{deal.commentCount || 0}</span>
                </span>
                {deal.userId && (
                  <span className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded">
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
          
          {/* 가격 정보 */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm sm:text-base font-medium text-gray-700">판매가</span>
                {deal.price ? (
                  <PriceDisplay 
                    price={deal.price} 
                    originalCurrency="KRW"
                    className="text-2xl sm:text-3xl font-bold text-red-600 break-all"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-red-600 break-all">가격 정보 없음</span>
                )}
              </div>
              {deal.shipping && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-red-100">
                  <span className="text-sm sm:text-base text-gray-600">배송비</span>
                  <span className="flex items-center gap-1 text-sm sm:text-base">
                    <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    <span className={`font-semibold ${deal.shipping.isFree ? 'text-green-600' : 'text-gray-600'}`}>
                      {deal.shipping.isFree ? '무료배송' : (
                        deal.shipping.cost ? (
                          <PriceDisplay 
                            price={deal.shipping.cost} 
                            originalCurrency="KRW"
                            className="font-semibold text-gray-600"
                          />
                        ) : '배송비 별도'
                      )}
                    </span>
                  </span>
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
          <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
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
              className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
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
                className="w-full h-12 text-base border-2 hover:bg-gray-50"
              >
                📋 원글 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* 댓글 섹션 */}
      <div className="mt-12 border-t pt-8">
        {/* 쇼핑 코멘트 */}
        <ProductComment hotDeal={deal} />
        
        {/* 일반 댓글 */}
        <CommentSection 
          hotdealId={deal.id} 
          commentCount={deal.commentCount || 0} 
        />
      </div>
      
      {/* 유사 상품 */}
      {similarDeals.length > 0 && (
        <div id="similar-deals" className="mt-12 border-t pt-8">
          <h2 className="text-xl font-bold mb-6">비슷한 핫딜</h2>
          <SimilarHotDeals deals={similarDeals} />
        </div>
      )}
    </div>
  )
}