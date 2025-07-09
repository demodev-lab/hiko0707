'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { HotDeal } from '@/types/hotdeal'
import { db } from '@/lib/db/database-service'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'

export function HotDealsSection() {
  const [hotdeals, setHotdeals] = useState<HotDeal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHotDeals() {
      try {
        const deals = await db.hotdeals.findAll()
        setHotdeals(deals.slice(0, 6)) // 최신 6개
      } catch (error) {
        console.error('Failed to fetch hotdeals:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHotDeals()
  }, [])

  if (loading) {
    return (
      <section className="mb-12 sm:mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">🔥 오늘의 핫딜</h2>
          <Button asChild variant="outline" size="sm" className="sm:size-default">
            <Link href="/hotdeals">모든 핫딜 보기</Link>
          </Button>
        </div>
        <div className="text-center py-12 sm:py-16">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>핫딜을 불러오는 중...</p>
        </div>
      </section>
    )
  }

  if (hotdeals.length === 0) {
    return (
      <section className="mb-12 sm:mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">🔥 오늘의 핫딜</h2>
          <Button asChild variant="outline" size="sm" className="sm:size-default">
            <Link href="/hotdeals">모든 핫딜 보기</Link>
          </Button>
        </div>
        <div className="text-center py-12 sm:py-16 text-gray-500">
          <p>현재 표시할 핫딜이 없습니다.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-12 sm:mb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold">🔥 오늘의 핫딜</h2>
        <Button asChild variant="outline" size="sm" className="sm:size-default">
          <Link href="/hotdeals">모든 핫딜 보기</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {hotdeals.map((deal) => (
          <HotDealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </section>
  )
}