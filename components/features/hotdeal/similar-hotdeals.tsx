'use client'

import { HotDeal } from '@/types/hotdeal'
import { HotDealCard } from './hotdeal-card'

interface SimilarHotDealsProps {
  deals: HotDeal[]
}

export function SimilarHotDeals({ deals }: SimilarHotDealsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {deals.map((deal) => (
        <HotDealCard key={deal.id} deal={deal} />
      ))}
    </div>
  )
}