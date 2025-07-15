'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Eye, Heart, MessageSquare, ThumbsUp, User } from 'lucide-react'
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
import { useHotDealTranslation } from '@/hooks/use-translations'
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
      className="group relative overflow-hidden border-gray-200 h-full focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
      role="article"
      aria-labelledby={`deal-title-${deal.id}`}
      aria-describedby={`deal-price-${deal.id}`}
      hoverScale={1.03}
    >
      <Card className="h-full border-none shadow-md group-hover:shadow-lg transition-shadow duration-300 flex flex-col">
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
        <div className="relative overflow-hidden bg-gray-100 w-full h-64">
          <OptimizedImage
            src={deal.originalImageUrl || ''}
            alt={deal.title}
            width={320}
            height={256}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            priority={false}
            quality={85}
            showLoader={true}
            showFallbackIcon={true}
            fallbackText={deal.seller || '상품 이미지'}
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
            <Badge className="absolute top-2 right-2 bg-orange-500 border-0">
              🔥 {t('hotdeals.hot')}
            </Badge>
          )}
        </div>
      </Link>
      
      {/* 콘텐츠 영역 - 컴팩트한 디자인 */}
      <div className="p-3 flex flex-col flex-1">
          {/* 쇼핑몰과 커뮤니티 정보 */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 shrink-0">
              {deal.seller}
            </Badge>
            <Badge variant="outline" className="text-xs shrink-0">
              {sourceLabels[deal.source] || deal.source}
            </Badge>
            
            {/* 라벨들 - HOT, 인기, 순위 순서 */}
            {deal.isHot && (
              <Badge className="text-xs bg-orange-500 text-white border-0 shrink-0">
                HOT
              </Badge>
            )}
            {deal.isPopular && (
              <Badge className="text-xs bg-red-500 text-white border-0 shrink-0">
                인기
              </Badge>
            )}
            {deal.ranking && isToday && (
              <Badge className="text-xs bg-yellow-500 text-black border-0 shrink-0">
                {deal.ranking}위
              </Badge>
            )}
            {/* 번역 상태 표시 */}
            {language !== 'ko' && translation && translation.status !== 'completed' && (
              <TranslationIndicator 
                status={translation.status} 
                language={language}
                showLabel={false}
              />
            )}
          </div>
        
          {/* 제목 - 컴팩트한 디자인 */}
          <Link href={`/hotdeals/${deal.id}`} className="block">
            <h3 
              id={`deal-title-${deal.id}`}
              className="font-medium text-sm mb-2 leading-tight hover:text-blue-600 transition-colors cursor-pointer word-break-keep-all break-words focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded min-h-[2.2rem]"
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
          </Link>
        
          {/* 가격 정보 */}
          <Link href={`/hotdeals/${deal.id}`} className="block mb-2">
            <div 
              id={`deal-price-${deal.id}`}
              className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {deal.price ? (
                  <PriceDisplay 
                    price={deal.price} 
                    originalCurrency="KRW"
                    className="text-lg font-bold text-red-600"
                  />
                ) : (
                  <span className="text-lg font-bold text-red-600">가격 정보 없음</span>
                )}
                {/* 배송 정보 - 가격과 같은 라인 */}
                {deal.shipping?.isFree && (
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded shrink-0">
                    무료배송
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* 통계 정보 - 간소화된 디자인 */}
          <div className="flex items-center justify-between mb-3 mt-auto">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Eye className="w-3 h-3" />
                {(deal.viewCount || 0) > 999 ? `${Math.floor((deal.viewCount || 0) / 1000)}k` : (deal.viewCount || 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <ThumbsUp className="w-3 h-3" />
                {(deal.communityRecommendCount || 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-xs text-green-600">
                <MessageSquare className="w-3 h-3" />
                {deal.commentCount || 0}
              </span>
            </div>
            
            {/* 시간 정보 */}
            <span className="text-xs text-gray-400">
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
              className="w-full h-9"
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
                className="w-full h-9"
              >
                📋 원글 보기
              </Button>
            </Link>
          </div>
        
        </div>
      </Card>
    </AnimatedCard>
  )
}