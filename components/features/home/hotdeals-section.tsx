'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { HotDeal } from '@/types/hotdeal'
import { db } from '@/lib/db/database-service'
import { formatDate } from '@/lib/utils'

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
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">🔥 오늘의 핫딜</h2>
          <Button asChild variant="outline">
            <Link href="/hotdeals">모든 핫딜 보기</Link>
          </Button>
        </div>
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>핫딜을 불러오는 중...</p>
        </div>
      </section>
    )
  }

  if (hotdeals.length === 0) {
    return (
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">🔥 오늘의 핫딜</h2>
          <Button asChild variant="outline">
            <Link href="/hotdeals">모든 핫딜 보기</Link>
          </Button>
        </div>
        <div className="text-center py-16 text-gray-500">
          <p>현재 표시할 핫딜이 없습니다.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">🔥 오늘의 핫딜</h2>
        <Button asChild variant="outline">
          <Link href="/hotdeals">모든 핫딜 보기</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotdeals.map((deal) => (
          <Card key={deal.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary">{deal.category}</Badge>
                <Badge variant="outline">{deal.source}</Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">{deal.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">
                    ₩{deal.price.toLocaleString()}
                  </span>
                  {deal.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ₩{deal.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                
                {deal.discountRate && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {deal.discountRate}% 할인
                    </Badge>
                    <span className="text-sm text-green-600 font-medium">
                      ₩{((deal.originalPrice || deal.price) - deal.price).toLocaleString()} 절약
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>👍 {deal.likeCount || 0}</span>
                  <span>{formatDate(deal.crawledAt).split(' ')[0]}</span>
                </div>

                <div className="pt-2">
                  <Link href={`/hotdeals/${deal.id}`}>
                    <Button className="w-full">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      대신 사줘요
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}