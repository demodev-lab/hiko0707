'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Eye, Heart, MessageCircle, Truck } from 'lucide-react'
import { HotDeal } from '@/types/hotdeal'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/lib/i18n/context'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { ShareIconButton } from '@/components/features/share/share-icon-button'
import { BuyForMeButton } from '@/components/features/order/buy-for-me-button'
import { formatCurrency, formatRelativeTime } from '@/lib/i18n/format'

interface HotDealCardProps {
  deal: HotDeal
}

export function HotDealCard({ deal }: HotDealCardProps) {
  const { t, language } = useLanguage()
  const isEnding = deal.endDate && new Date(deal.endDate) < new Date(Date.now() + 24 * 60 * 60 * 1000)
  const isHot = deal.viewCount > 10000 || (deal.discountRate && deal.discountRate > 30)
  
  const sourceLabels: Record<string, string> = {
    ppomppu: '뽐뿌',
    fmkorea: 'FM코리아',
    ruliweb: '루리웹',
    clien: '클리앙',
    coolenjoy: '쿨엔조이',
    dvdprime: 'DVD프라임'
  }
  
  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 h-full">
      {/* 액션 버튼들 - 카드 오른쪽 상단 */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <ShareIconButton
          url={`${typeof window !== 'undefined' ? window.location.origin : ''}/hotdeals/${deal.id}`}
          title={deal.title}
          description={`${formatCurrency(deal.price, language)}${deal.discountRate ? ` (${deal.discountRate}% ${t('hotdeals.discount')})` : ''}`}
          className="bg-white/90 backdrop-blur-sm shadow-md hover:bg-white"
        />
        <FavoriteButton
          itemId={deal.id}
          itemType="hotdeal"
          metadata={{
            title: deal.title,
            image: deal.imageUrl,
            price: deal.price,
            discount: deal.discountRate
          }}
          variant="icon"
          size="sm"
          className="bg-white/90 backdrop-blur-sm shadow-md hover:bg-white"
        />
      </div>
      
      {/* 이미지 영역 */}
      <Link href={`/hotdeals/${deal.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {deal.imageUrl ? (
            <Image
              src={deal.imageUrl}
              alt={deal.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={false}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">{t('hotdeals.noImage')}</span>
            </div>
          )}
        
          {/* 할인율 뱃지 */}
          {deal.discountRate && deal.discountRate > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md font-bold text-sm">
              -{deal.discountRate}%
            </div>
          )}
        
          {/* 핫딜 뱃지 */}
          {isHot && (
            <Badge className="absolute top-12 right-2 bg-orange-500 border-0">
              🔥 {t('hotdeals.hot')}
            </Badge>
          )}
        
          {/* 종료 임박 */}
          {isEnding && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center">
              ⏰ {t('hotdeals.endingSoon')}
            </div>
          )}
        </div>
      </Link>
      
      {/* 콘텐츠 영역 */}
      <div className="p-4">
          {/* 카테고리와 출처 */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {t(`category.${deal.category}`)}
            </Badge>
            <span className="text-xs text-gray-500">{sourceLabels[deal.source] || deal.source}</span>
          </div>
        
          {/* 제목 - 2줄 제한 */}
          <Link href={`/hotdeals/${deal.id}`}>
            <h3 className="font-medium text-sm mb-2 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer break-words">
              {deal.title}
            </h3>
          </Link>
        
          {/* 가격 정보 */}
          <Link href={`/hotdeals/${deal.id}`} className="block mb-3">
            <div className="hover:opacity-80 transition-opacity cursor-pointer">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(deal.price, language)}
                </span>
                {deal.originalPrice && deal.originalPrice > deal.price && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatCurrency(deal.originalPrice, language)}
                  </span>
                )}
              </div>
          
              {/* 배송 정보 */}
              {deal.shipping && (
                <div className="flex items-center gap-1 mt-1">
                  <Truck className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {deal.shipping.isFree ? t('hotdeals.freeShipping') : deal.shipping.cost ? `${t('common.shippingFee')} ${formatCurrency(deal.shipping.cost, language)}` : t('common.shippingFee')}
                  </span>
                </div>
              )}
            </div>
          </Link>
        
          {/* 버튼들 */}
          <div className="space-y-2 mb-3">
            {/* 원본 링크 버튼 */}
            <Link 
              href={deal.originalUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                🔗 원본 보기
              </Button>
            </Link>
            
            {/* Buy for Me 버튼 */}
            <BuyForMeButton
              hotdeal={{
                id: deal.id,
                title: deal.title,
                price: deal.price.toString(),
                originalPrice: deal.originalPrice?.toString(),
                imageUrl: deal.imageUrl,
                productUrl: deal.originalUrl || '',
                discountRate: deal.discountRate?.toString(),
                category: deal.category,
                seller: deal.source,
                deadline: deal.endDate ? (deal.endDate instanceof Date ? deal.endDate.toISOString() : String(deal.endDate)) : undefined
              }}
              variant="default"
              size="sm"
              className="w-full"
            />
          </div>
        
          {/* 통계 정보 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {deal.viewCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {deal.likeCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {deal.commentCount || 0}
              </span>
            </div>
          
            {/* 시간 정보 */}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(deal.crawledAt, language)}
            </span>
          </div>
        
        </div>
    </Card>
  )
}