'use client'

import { useState } from 'react'
import { HotDealLikeButton } from '@/components/features/hotdeal/hotdeal-like-button'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { CommentSection } from '@/components/features/comments/comment-section'
import { ProductComment } from '@/components/features/comments/product-comment'
import { ShareButton } from '@/components/features/share/share-button'
import { BuyForMeButton } from '@/components/features/order/buy-for-me-button'
import { HotDeal } from '@/types/hotdeal'

interface HotDealDetailClientProps {
  deal: HotDeal
  sourceLabel: string
}

export function HotDealDetailClient({ deal, sourceLabel }: HotDealDetailClientProps) {
  return (
    <>
      {/* 공유 버튼 */}
      <div className="flex gap-2">
        <FavoriteButton 
          itemId={deal.id}
          itemType="hotdeal"
          metadata={{
            title: deal.title,
            image: deal.originalImageUrl || deal.imageUrl,
            price: deal.price
          }}
          showCount
          variant="default"
          className="flex-1"
        />
        <ShareButton
          title={deal.title}
          description={`${deal.price.toLocaleString()}원`}
          imageUrl={deal.originalImageUrl}
          hashtags={['핫딜', '하이코', sourceLabel, deal.seller]}
          variant="outline"
          className="flex-1"
        />
      </div>
    </>
  )
}