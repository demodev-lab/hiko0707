'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'
import { SectionTransition } from '@/components/common/page-transition'
import { StaggerContainer, StaggerItem } from '@/components/ui/animated'
import { useHotDeals } from '@/hooks/use-local-db'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { calculateTodayRankings } from '@/lib/utils/ranking-utils'

export function HotDealsSection() {
  // 클라이언트에서 데이터 가져오기 - 자동 JSON 로드 기능 포함
  const { hotdeals, loading, error } = useHotDeals()
  
  // 순위 계산된 핫딜 목록
  const rankedHotdeals = calculateTodayRankings(hotdeals)
  
  // 오늘 업로드된 핫딜 중 커뮤니티 조회수가 가장 높은 6개 선택
  const today = new Date()
  const todayStr = today.toDateString()
  
  const topDeals = rankedHotdeals
    .filter(deal => {
      // 오늘 크롤링된 핫딜만 필터링
      const crawledDate = new Date(deal.crawledAt)
      return crawledDate.toDateString() === todayStr
    })
    .sort((a, b) => {
      // 커뮤니티 조회수(viewCount) 내림차순 정렬
      return (b.viewCount || 0) - (a.viewCount || 0)
    })
    .slice(0, 6) // 상위 6개만 선택

  // 오늘 핫딜이 없는 경우 전체에서 인기순으로 선택
  const displayDeals = topDeals.length > 0 ? topDeals : rankedHotdeals
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 6)

  // 디버깅용 로그
  console.log('HotDealsSection:', { 
    totalHotdeals: hotdeals.length,
    todayDeals: hotdeals.filter(deal => {
      const crawledDate = new Date(deal.crawledAt)
      return crawledDate.toDateString() === todayStr
    }).length,
    topDealsCount: topDeals.length,
    displayDealsCount: displayDeals.length,
    topViewCounts: displayDeals.map(deal => ({ id: deal.id, viewCount: deal.viewCount })),
    loading, 
    error
  })

  if (loading) {
    return (
      <SectionTransition>
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">🔥 오늘의 핫딜</h2>
              <p className="text-gray-600">실시간 인기 쇼핑 정보</p>
            </div>
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner />
            </div>
          </div>
        </section>
      </SectionTransition>
    )
  }

  if (error) {
    return (
      <SectionTransition>
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">🔥 오늘의 핫딜</h2>
              <p className="text-gray-600">실시간 인기 쇼핑 정보</p>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">핫딜을 불러오는 중 문제가 발생했습니다.</p>
              <Link href="/hotdeals">
                <Button variant="outline">전체 핫딜 보기</Button>
              </Link>
            </div>
          </div>
        </section>
      </SectionTransition>
    )
  }

  return (
    <SectionTransition>
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          {/* 헤더 */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">🔥 오늘의 핫딜</h2>
            <p className="text-gray-600">실시간 인기 쇼핑 정보</p>
          </div>

          {/* 핫딜 목록 */}
          {displayDeals.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {displayDeals.map((deal, index) => (
                <StaggerItem key={deal.id} index={index}>
                  <HotDealCard deal={deal} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="text-center py-8 mb-8">
              <p className="text-gray-500 mb-4">아직 표시할 핫딜이 없습니다.</p>
              <Link href="/hotdeals">
                <Button variant="outline">전체 핫딜 보기</Button>
              </Link>
            </div>
          )}

          {/* 더 보기 버튼 */}
          <div className="text-center">
            <Link href="/hotdeals">
              <Button size="lg" className="px-8">
                전체 핫딜 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </SectionTransition>
  )
}