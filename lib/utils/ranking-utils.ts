import { HotDeal } from '@/types/hotdeal'

/**
 * 오늘 업로드된 핫딜들의 순위를 계산하여 반환
 * 커뮤니티 조회수 기준 상위 10개에 순위 부여
 */
export function calculateTodayRankings(hotdeals: HotDeal[]): HotDeal[] {
  const today = new Date()
  const todayStr = today.toDateString()
  
  // 오늘 크롤링된 핫딜만 필터링
  const todayDeals = hotdeals.filter(deal => {
    const crawledDate = new Date(deal.created_at)
    return crawledDate.toDateString() === todayStr
  })
  
  // 조회수 기준 정렬
  const sortedDeals = [...todayDeals].sort((a, b) => {
    return (b.views || 0) - (a.views || 0)
  })
  
  // 상위 10개에만 순위 부여
  const rankedDeals = sortedDeals.slice(0, 10).map((deal, index) => ({
    ...deal,
    ranking: index + 1
  }))
  
  // 원본 배열에서 순위가 있는 것만 업데이트
  return hotdeals.map(deal => {
    const rankedDeal = rankedDeals.find(rd => rd.id === deal.id)
    return rankedDeal ? { ...deal, ranking: rankedDeal.ranking } : deal
  })
}