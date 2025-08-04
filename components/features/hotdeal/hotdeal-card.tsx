'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Eye, Heart, MessageSquare, ThumbsUp, User, Truck } from 'lucide-react'
import { HotDeal } from '@/types/hotdeal'
import Link from 'next/link'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { useLanguage } from '@/lib/i18n/context'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { ShareIconButton } from '@/components/features/share/share-icon-button'
import { BuyForMeButton } from '@/components/features/order/buy-for-me-button'
import { formatCurrency, formatRelativeTime } from '@/lib/i18n/format'
import { getRelativeTimeKorean } from '@/lib/utils/date-utils'
import { TranslatedContent } from '@/components/features/translation/translated-content'
import { TranslationIndicator } from '@/components/features/translation/translation-indicator'
import { useHotDealTranslation } from '@/hooks/use-supabase-translations'
import { AnimatedCard } from '@/components/ui/animated'
import { PriceDisplay } from '@/components/features/price-display'

interface HotDealCardProps {
  deal: HotDeal
}

export function HotDealCard({ deal }: HotDealCardProps) {
  const { t, language } = useLanguage()
  const { data: translation } = useHotDealTranslation(deal.id)
  const isHot = ((deal.communityRecommendCount || 0) > 1000) || ((deal.viewCount || 0) > 10000)
  
  // 오늘 날짜 확인 (크롤링된 날짜가 오늘인지)
  const isToday = deal.crawledAt ? 
    new Date(deal.crawledAt).toDateString() === new Date().toDateString() : 
    false
  
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
  
  return (
    <AnimatedCard 
      className="group relative overflow-hidden h-full focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
      role="article"
      aria-labelledby={`deal-title-${deal.id}`}
      aria-describedby={`deal-price-${deal.id}`}
      hoverScale={1.01}
    >
      <Card className="h-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
      {/* 액션 버튼들 - 카드 오른쪽 상단 */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <ShareIconButton
          url={`${typeof window !== 'undefined' ? window.location.origin : ''}/hotdeals/${deal.id}`}
          title={deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim()}
          description={`${formatCurrency(deal.price || 0, language)}`}
          imageUrl={deal.originalImageUrl}
          hashtags={['핫딜', '하이코', sourceLabels[deal.source] || deal.source]}
          className="bg-white/90 backdrop-blur-sm shadow-md hover:bg-white w-8 h-8"
        />
        <FavoriteButton
          itemId={deal.id}
          itemType="hotdeal"
          metadata={{
            title: deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim(),
            image: deal.originalImageUrl,
            price: deal.price
          }}
          variant="icon"
          size="sm"
          className="bg-white/90 backdrop-blur-sm shadow-md hover:bg-white w-8 h-8"
        />
      </div>
      
      {/* 이미지 영역 */}
      <Link href={`/hotdeals/${deal.id}`} className="block">
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 w-full h-48 sm:h-52 lg:h-56 xl:h-60">
          <OptimizedImage
            src={deal.originalImageUrl || undefined}
            alt={deal.title}
            width={400}
            height={320}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, (max-width: 1920px) 16vw, 14vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            priority={false}
            quality={85}
            showLoader={true}
            showFallbackIcon={true}
            fallbackText={deal.seller || '상품 이미지'}
            communitySource={deal.source}
            preload={isHot}
            monitorPerformance={true}
            onLoadComplete={() => console.log('🖼️ HotDeal image loaded:', deal.title, deal.originalImageUrl)}
            onError={() => console.log('🚫 HotDeal image failed:', deal.title, deal.originalImageUrl)}
          />
          
          {/* 디버그: imageUrl 정보 표시 (개발용) - 비활성화됨 */}
          {false && process.env.NODE_ENV === 'development' && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 truncate">
              ID: {deal.id} | {deal.originalImageUrl || 'No image URL'}
            </div>
          )}
        
          
          {/* 핫딜 뱃지 */}
          {isHot && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 border-0 text-white shadow-lg px-3 py-1.5 text-sm font-semibold">
                🔥 {t('hotdeals.hot')}
              </Badge>
            </div>
          )}
        </div>
      </Link>
      
      {/* 콘텐츠 영역 - 개선된 패딩과 구분 */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
          {/* 쇼핑몰과 커뮤니티 정보 */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 border-0 shrink-0 font-medium px-3 py-1 shadow-sm">
              🛒 {deal.seller}
            </Badge>
            <Badge variant="outline" className="text-xs shrink-0 bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1">
              📍 {sourceLabels[deal.source] || deal.source}
            </Badge>
            
            {/* 라벨들 - HOT, 인기, 순위 순서 */}
            {deal.isHot && (
              <Badge className="text-xs bg-gradient-to-r from-orange-400 to-orange-500 text-white border-0 shrink-0 shadow-sm">
                🔥 HOT
              </Badge>
            )}
            {deal.isPopular && (
              <Badge className="text-xs bg-gradient-to-r from-red-400 to-pink-500 text-white border-0 shrink-0 shadow-sm">
                ⭐ 인기
              </Badge>
            )}
            {deal.ranking && isToday && (
              <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-0 shrink-0 shadow-sm font-semibold">
                🏆 {deal.ranking}위
              </Badge>
            )}
            {/* 번역 상태 표시 */}
            {language !== 'ko' && translation && !translation.is_auto_translated && (
              <TranslationIndicator 
                status={'pending'} 
                language={language}
                showLabel={false}
              />
            )}
          </div>
        
          {/* 제목 - 컴팩트한 디자인 */}
          <Link href={`/hotdeals/${deal.id}`} className="block mb-3">
            <div className="min-h-[3.5rem] sm:min-h-[4rem] flex items-start">
              <h3 
                id={`deal-title-${deal.id}`}
                className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg leading-relaxed hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer word-break-keep-all break-words focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                <TranslatedContent 
                  hotDeal={{
                    ...deal,
                    // 제목에서 가격 정보 제거
                    title: deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim()
                  }} 
                  field="title" 
                  showIndicator={false}
                />
              </h3>
            </div>
          </Link>
        
          {/* 가격 정보 */}
          <Link href={`/hotdeals/${deal.id}`} className="block mb-2">
            <div 
              id={`deal-price-${deal.id}`}
              className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            >
              <div className="flex flex-col items-end gap-1">
                {/* 가격 정보 */}
                <div className="text-right">
                  {(deal.price === 0 && /다양/i.test(deal.title)) ? (
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      가격 다양
                    </span>
                  ) : deal.price === 0 ? (
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      프로모션
                    </span>
                  ) : deal.price === -1 ? (
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      가격 다양
                    </span>
                  ) : deal.price > 0 ? (
                    <PriceDisplay 
                      price={deal.price} 
                      originalCurrency="KRW"
                      className="text-2xl font-bold text-red-500 dark:text-red-400"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">가격 정보 없음</span>
                  )}
                </div>
                
                {/* 배송비 정보 - 가격 다양이거나 일반 가격일 때만 표시 */}
                {(deal.price === -1 || deal.price > 0 || (deal.price === 0 && /다양/i.test(deal.title))) && deal.shipping?.isFree && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Truck className="w-3 h-3" />
                    <span className="font-medium">무료배송</span>
                  </div>
                )}
              </div>
            </div>
          </Link>

          {/* 통계 정보 - 개선된 디자인 */}
          <div className="flex items-center justify-between mb-4 mt-auto bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-medium">{(deal.viewCount || 0) > 999 ? `${Math.floor((deal.viewCount || 0) / 1000)}k` : (deal.viewCount || 0).toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="font-medium">{(deal.communityRecommendCount || 0).toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="font-medium">{deal.commentCount || 0}</span>
              </span>
              {/* 게시자 정보 - 모바일 1열 또는 태블릿 2열일 때 표시 */}
              {deal.userId && (
                <span className="flex lg:hidden items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="text-gray-400">•</span>
                  <User className="w-3 h-3" />
                  <span className="font-medium truncate max-w-[80px]">{deal.userId}</span>
                </span>
              )}
            </div>
            
            {/* 시간 정보 */}
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {getRelativeTimeKorean(deal.crawledAt || new Date())}
            </span>
          </div>
        
          {/* 버튼들 - 컴팩트한 배치 */}
          <div className="space-y-1.5">
            {/* Buy for Me 버튼 - 주요 액션 */}
            <BuyForMeButton
              hotdeal={{
                id: deal.id,
                title: deal.title.replace(/\s*\([^)]*원[^)]*\)\s*$/, '').trim(),
                price: (deal.price || 0).toString(),
                imageUrl: deal.originalImageUrl,
                productUrl: deal.originalUrl || '',
                seller: deal.seller,
              }}
              variant="default"
              size="sm"
              className="w-full h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-sm"
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
                size="sm"
                className="w-full h-10 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>원글 보기</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </Button>
            </Link>
          </div>
        
        </div>
      </Card>
    </AnimatedCard>
  )
}