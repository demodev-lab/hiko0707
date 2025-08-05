'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'
import { SectionTransition } from '@/components/common/page-transition'
import { StaggerContainer, StaggerItem } from '@/components/ui/animated'
import { usePopularHotDeals } from '@/hooks/use-supabase-hotdeals'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { calculateTodayRankings } from '@/lib/utils/ranking-utils'
import { transformSupabaseToLocal } from '@/lib/utils/hotdeal-transformers'

export function HotDealsSection() {
  // 인기 핫딜 6개 가져오기
  const { data: popularDeals, isLoading: loading, error } = usePopularHotDeals(6)
  
  // Supabase 데이터를 LocalStorage 형식으로 변환
  const hotdeals = popularDeals?.map(transformSupabaseToLocal) || []
  
  // 순위 계산된 핫딜 목록
  const rankedHotdeals = calculateTodayRankings(hotdeals)
  
  // 오늘 업로드된 핫딜 중 커뮤니티 조회수가 가장 높은 6개 선택
  const today = new Date()
  const todayStr = today.toDateString()
  
  const topDeals = rankedHotdeals
    .filter(deal => {
      // 오늘 크롤링된 핫딜만 필터링
      const crawledDate = new Date(deal.created_at)
      return crawledDate.toDateString() === todayStr
    })
    .sort((a, b) => {
      // 커뮤니티 조회수(views) 내림차순 정렬
      return (b.views || 0) - (a.views || 0)
    })
    .slice(0, 6) // 상위 6개만 선택

  // 디버깅용 로그
  console.log('HotDealsSection:', { 
    totalHotdeals: hotdeals.length,
    todayDeals: hotdeals.filter(deal => {
      const crawledDate = new Date(deal.created_at)
      return crawledDate.toDateString() === todayStr
    }).length,
    topDealsCount: topDeals.length,
    topViewCounts: topDeals.map(deal => ({ id: deal.id, viewCount: deal.views })),
    loading, 
    error
  })

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
          <LoadingSpinner />
          <p className="text-gray-500 mt-4">핫딜 로딩 중...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mb-12 sm:mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">🔥 오늘의 핫딜</h2>
          <Button asChild variant="outline" size="sm" className="sm:size-default">
            <Link href="/hotdeals">모든 핫딜 보기</Link>
          </Button>
        </div>
        <div className="text-center py-12 sm:py-16 text-red-500">
          <p>핫딜 로딩 중 오류가 발생했습니다: {error.message}</p>
        </div>
      </section>
    )
  }

  if (topDeals.length === 0) {
    return (
      <section className="mb-12 sm:mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">🔥 오늘의 핫딜</h2>
          <Button asChild variant="outline" size="sm" className="sm:size-default">
            <Link href="/hotdeals">모든 핫딜 보기</Link>
          </Button>
        </div>
        <div className="text-center py-12 sm:py-16 text-gray-500">
          <p>오늘 업로드된 핫딜이 없습니다.</p>
          <p className="text-sm mt-2">전체 핫딜 개수: {hotdeals.length}개</p>
          <p className="text-sm">오늘 업로드된 핫딜: {hotdeals.filter(deal => {
            const crawledDate = new Date(deal.created_at)
            return crawledDate.toDateString() === todayStr
          }).length}개</p>
        </div>
      </section>
    )
  }

  return (
    <SectionTransition className="mb-12 sm:mb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">🔥 오늘의 인기 핫딜</h2>
          <p className="text-sm text-gray-600 mt-1">오늘 업로드된 핫딜 중 조회수 상위 {topDeals.length}개</p>
        </div>
        <Button asChild variant="outline" size="sm" className="sm:size-default">
          <Link href="/hotdeals">모든 핫딜 보기</Link>
        </Button>
      </div>
      
      <StaggerContainer 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        staggerDelay={0.15}
      >
        {topDeals.map((deal, index) => (
          <StaggerItem key={deal.id} index={index}>
            <HotDealCard deal={deal} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SectionTransition>
  )
}