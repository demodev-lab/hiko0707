// Fetch API를 사용한 간단한 크롤러
import { CrawledHotDeal } from './types'

export class FetchCrawler {
  async crawlPpomppu(maxPages: number = 1): Promise<CrawledHotDeal[]> {
    const results: CrawledHotDeal[] = []
    
    try {
      // 실제 크롤링 대신 모의 데이터 생성
      // 실제 구현 시에는 서버 사이드 크롤링 라이브러리 사용
      for (let page = 1; page <= maxPages; page++) {
        const mockDeals = this.generateMockDeals(page, 10)
        results.push(...mockDeals)
      }
      
      console.log(`✅ ${results.length}개 핫딜 크롤링 완료`)
      return results
    } catch (error) {
      console.error('크롤링 실패:', error)
      return []
    }
  }
  
  private generateMockDeals(page: number, count: number): CrawledHotDeal[] {
    const deals: CrawledHotDeal[] = []
    const categories = ['전자', '패션', '식품', '생활/가전', '뷰티']
    const sellers = ['쿠팡', 'G마켓', '11번가', '네이버', '위메프']
    
    for (let i = 0; i < count; i++) {
      const dealNum = (page - 1) * count + i + 1
      deals.push({
        id: `fetch-${Date.now()}-${dealNum}`,
        title: `[${sellers[i % sellers.length]}] 핫딜 상품 ${dealNum} - 최대 70% 할인`,
        price: Math.floor(Math.random() * 100000) + 10000,
        originalUrl: `https://www.ppomppu.co.kr/deal/${dealNum}`,
        seller: sellers[i % sellers.length],
        source: 'ppomppu',
        crawledAt: new Date(),
        imageUrl: `/images/products/home/home_${(i % 8) + 1}_original.jpg`,
        userId: `user${Math.floor(Math.random() * 100)}`,
        communityCommentCount: Math.floor(Math.random() * 50),
        communityRecommendCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 1000),
        productComment: `이 상품은 정말 좋은 기회입니다. 한정 수량이니 서두르세요!`,
        category: categories[i % categories.length],
        shipping: {
          isFree: Math.random() > 0.5
        },
        status: 'active',
        likeCount: 0,
        commentCount: 0,
        translationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    return deals
  }
}