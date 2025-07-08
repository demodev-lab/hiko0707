'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db/database-service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Eye, Heart, MessageCircle, Share2, Truck, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { HotDealLikeButton } from '@/components/features/hotdeal/hotdeal-like-button'
import { SimilarHotDeals } from '@/components/features/hotdeal/similar-hotdeals'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { CommentSection } from '@/components/features/comments/comment-section'
import { ShareButton } from '@/components/features/share/share-button'
import { HotDeal } from '@/types/hotdeal'
import { Loading } from '@/components/ui/loading'

interface HotDealPageProps {
  params: Promise<{
    id: string
  }>
}

export default function HotDealDetailPage({ params }: HotDealPageProps) {
  const [id, setId] = useState<string>('')
  const [deal, setDeal] = useState<HotDeal | null>(null)
  const [similarDeals, setSimilarDeals] = useState<HotDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)

  useEffect(() => {
    async function fetchParams() {
      const { id: paramId } = await params
      setId(paramId)
    }
    fetchParams()
  }, [params])

  useEffect(() => {
    async function fetchDeal() {
      if (!id) return
      
      try {
        const dealData = await db.hotdeals.findById(id)
        
        if (!dealData) {
          setIsNotFound(true)
          return
        }
        
        setDeal(dealData)
        
        // 조회수 증가
        await db.hotdeals.incrementViewCount(id)
        
        // 유사 상품 가져오기
        const similar = await db.hotdeals.findSimilarDeals(id, 4)
        setSimilarDeals(similar)
      } catch (error) {
        console.error('Failed to fetch hotdeal:', error)
        setIsNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDeal()
  }, [id])
  
  const categoryLabels: Record<string, string> = {
    electronics: '전자제품',
    food: '식품',
    beauty: '뷰티',
    home: '홈/리빙',
    sports: '스포츠',
    other: '기타'
  }
  
  const sourceLabels: Record<string, string> = {
    ppomppu: '뽐뿌',
    fmkorea: 'FM코리아',
    ruliweb: '루리웹',
    clien: '클리앙',
    coolenjoy: '쿨엔조이',
    dvdprime: 'DVD프라임'
  }
  
  if (loading) {
    return <Loading />
  }
  
  if (isNotFound || !deal) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">핫딜을 찾을 수 없습니다</h1>
        <p className="text-gray-600 mb-8">요청하신 핫딜이 없거나 종료되었습니다.</p>
        <Link href="/hotdeals">
          <Button>핫딜 목록으로 돌아가기</Button>
        </Link>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/" className="hover:text-blue-600">홈</Link>
        <span>/</span>
        <Link href="/hotdeals" className="hover:text-blue-600">핫딜</Link>
        <span>/</span>
        <span className="text-gray-900">{categoryLabels[deal.category]}</span>
      </nav>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* 이미지 영역 */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {deal.imageUrl ? (
              <Image
                src={deal.imageUrl}
                alt={deal.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            {deal.discountRate && deal.discountRate > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-xl">
                -{deal.discountRate}% 할인
              </div>
            )}
          </div>
          
          {/* 공유 버튼 */}
          <div className="flex gap-2">
            <FavoriteButton 
              itemId={deal.id}
              itemType="hotdeal"
              metadata={{
                title: deal.title,
                image: deal.imageUrl,
                price: deal.price,
                discount: deal.discountRate
              }}
              showCount
              variant="default"
              className="flex-1"
            />
            <ShareButton
              title={deal.title}
              description={`${deal.price.toLocaleString()}원${deal.discountRate ? ` (${deal.discountRate}% 할인)` : ''}`}
              variant="outline"
              className="flex-1"
            />
          </div>
        </div>
        
        {/* 정보 영역 */}
        <div className="space-y-6">
          {/* 카테고리와 출처 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge>{categoryLabels[deal.category]}</Badge>
              <Badge variant="secondary">{sourceLabels[deal.source]}</Badge>
            </div>
            
            {/* 제목 */}
            <h1 className="text-2xl font-bold mb-2">{deal.title}</h1>
            
            {/* 메타 정보 */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{sourceLabels[deal.source]}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                조회 {deal.viewCount.toLocaleString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDistanceToNow(new Date(deal.crawledAt), { locale: ko, addSuffix: true })}
              </span>
            </div>
          </div>
          
          {/* 가격 정보 */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="space-y-3">
              {deal.originalPrice && deal.originalPrice > deal.price && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">정가</span>
                  <span className="text-gray-400 line-through">
                    ₩{deal.originalPrice.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-medium">판매가</span>
                <span className="text-2xl font-bold text-red-600">
                  ₩{deal.price.toLocaleString()}
                </span>
              </div>
              {deal.shipping && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">배송비</span>
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    {deal.shipping.isFree ? '무료배송' : 
                     deal.shipping.cost ? `₩${deal.shipping.cost.toLocaleString()}` : '배송비 별도'}
                  </span>
                </div>
              )}
              {deal.shipping?.method && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">배송방법</span>
                  <span className="text-sm">{deal.shipping.method}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 종료일 */}
          {deal.endDate && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <Clock className="w-5 h-5" />
                <span className="font-medium">
                  {formatDistanceToNow(new Date(deal.endDate), { locale: ko })} 후 종료
                </span>
              </div>
            </div>
          )}
          
          {/* 상품 설명 */}
          {deal.description && (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700">{deal.description}</p>
            </div>
          )}
          
          {/* 구매 버튼 */}
          <div className="space-y-3">
            <Link 
              href={deal.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
                쇼핑몰로 이동
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href={`/order?hotdeal=${deal.id}`}>
              <Button variant="outline" className="w-full h-12 text-lg">
                대신 사줘요 요청하기
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* 유사 상품 */}
      {similarDeals.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-xl font-bold mb-6">비슷한 핫딜</h2>
          <SimilarHotDeals deals={similarDeals} />
        </div>
      )}
      
      {/* 댓글 섹션 */}
      <div className="mt-12 border-t pt-8">
        <CommentSection 
          hotdealId={deal.id} 
          commentCount={deal.commentCount || 0} 
        />
      </div>
    </div>
  )
}