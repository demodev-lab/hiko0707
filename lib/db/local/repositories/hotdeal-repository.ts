import { BaseRepository } from './base-repository'
import { HotDeal, HotDealCategory, HotDealSource } from '@/types/hotdeal'

export class HotDealRepository extends BaseRepository<HotDeal> {
  protected tableName = 'hotdeals'

  // 기존 데이터에 sourcePostId가 없는 경우를 처리하는 메서드
  async findBySourceAndPostId(source: HotDealSource, sourcePostId: string): Promise<HotDeal | null> {
    const items = await this.findAll()
    console.log(`🔍 중복 체크: ${source} 소스에서 ${sourcePostId} 찾는 중 (전체 ${items.length}개)`)
    
    // sourcePostId가 있는 경우 정확한 매칭
    const exactMatch = items.find(item => 
      item.source === source && 
      item.sourcePostId === sourcePostId
    )
    
    if (exactMatch) {
      console.log(`✅ 정확한 매칭 발견: ${exactMatch.title}`)
      return exactMatch
    }
    
    // sourcePostId가 없는 기존 데이터의 경우 originalUrl로 매칭 시도
    const urlMatch = items.find(item => 
      item.source === source && 
      !item.sourcePostId && // sourcePostId가 없는 기존 데이터
      item.originalUrl.includes(sourcePostId) // URL에 게시글 번호 포함 여부 확인
    )
    
    if (urlMatch) {
      console.log(`✅ URL 매칭 발견: ${urlMatch.title} (URL: ${urlMatch.originalUrl})`)
      return urlMatch
    }
    
    console.log(`❌ 매칭 실패: ${source} ${sourcePostId} - 새로운 핫딜로 추가`)
    return null
  }

  async findByCategory(category: HotDealCategory): Promise<HotDeal[]> {
    const items = await this.findAll()
    return items.filter(item => item.category === category)
  }

  async findBySource(source: HotDealSource): Promise<HotDeal[]> {
    const items = await this.findAll()
    return items.filter(item => item.source === source)
  }

  async findActive(): Promise<HotDeal[]> {
    const items = await this.findAll()
    const now = new Date()
    return items.filter(item => {
      if (item.status !== 'active') return false
      if (item.endDate && new Date(item.endDate) < now) return false
      return true
    })
  }

  async findActiveByCategory(category: HotDealCategory): Promise<HotDeal[]> {
    const activeItems = await this.findActive()
    return activeItems.filter(item => item.category === category)
  }

  async findActiveBySource(source: HotDealSource): Promise<HotDeal[]> {
    const activeItems = await this.findActive()
    return activeItems.filter(item => item.source === source)
  }

  async findWithPagination(page: number = 1, limit: number = 20): Promise<{
    items: HotDeal[]
    total: number
    page: number
    totalPages: number
  }> {
    const items = await this.findActive()
    const total = items.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit

    // 최신순 정렬
    const sortedItems = items.sort((a, b) => 
      new Date(b.crawledAt).getTime() - new Date(a.crawledAt).getTime()
    )

    return {
      items: sortedItems.slice(start, end),
      total,
      page,
      totalPages
    }
  }

  async searchByKeyword(keyword: string): Promise<HotDeal[]> {
    const items = await this.findActive()
    const lowercaseKeyword = keyword.toLowerCase()
    
    return items.filter(item => 
      item.title.toLowerCase().includes(lowercaseKeyword) ||
      item.description?.toLowerCase().includes(lowercaseKeyword)
    )
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<HotDeal[]> {
    const items = await this.findActive()
    return items.filter(item => 
      item.price >= minPrice && item.price <= maxPrice
    )
  }

  async findByDiscountRate(minDiscount: number): Promise<HotDeal[]> {
    const items = await this.findActive()
    return items.filter(item => 
      item.discountRate && item.discountRate >= minDiscount
    )
  }

  async incrementViewCount(id: string): Promise<HotDeal | null> {
    const item = await this.findById(id)
    if (!item) return null

    return this.update(id, {
      viewCount: (item.viewCount || 0) + 1
    })
  }

  async incrementLikeCount(id: string): Promise<HotDeal | null> {
    const item = await this.findById(id)
    if (!item) return null

    return this.update(id, {
      likeCount: (item.likeCount || 0) + 1
    })
  }

  async decrementLikeCount(id: string): Promise<HotDeal | null> {
    const item = await this.findById(id)
    if (!item) return null

    const currentCount = item.likeCount || 0
    return this.update(id, {
      likeCount: Math.max(0, currentCount - 1)
    })
  }

  async updateStatus(id: string, status: 'active' | 'ended'): Promise<HotDeal | null> {
    return this.update(id, { status })
  }

  async findSimilarDeals(id: string, limit: number = 4): Promise<HotDeal[]> {
    const deal = await this.findById(id)
    if (!deal) return []

    const allDeals = await this.findActive()
    
    // 같은 카테고리의 다른 상품들
    const similarDeals = allDeals
      .filter(item => 
        item.id !== id && 
        item.category === deal.category
      )
      .sort((a, b) => {
        // 할인율이 비슷한 상품 우선
        const discountDiffA = Math.abs((a.discountRate || 0) - (deal.discountRate || 0))
        const discountDiffB = Math.abs((b.discountRate || 0) - (deal.discountRate || 0))
        return discountDiffA - discountDiffB
      })
      .slice(0, limit)

    return similarDeals
  }

  async getPopularDeals(limit: number = 10): Promise<HotDeal[]> {
    const items = await this.findActive()
    
    return items
      .sort((a, b) => {
        // 인기도 점수 계산 (조회수 + 좋아요수 * 10 + 댓글수 * 5)
        const scoreA = (a.viewCount || 0) + (a.likeCount || 0) * 10 + (a.commentCount || 0) * 5
        const scoreB = (b.viewCount || 0) + (b.likeCount || 0) * 10 + (b.commentCount || 0) * 5
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  async getEndingSoonDeals(hoursLeft: number = 24): Promise<HotDeal[]> {
    const items = await this.findActive()
    const now = new Date()
    const limitTime = new Date(now.getTime() + hoursLeft * 60 * 60 * 1000)
    
    return items
      .filter(item => 
        item.endDate && 
        new Date(item.endDate) > now && 
        new Date(item.endDate) <= limitTime
      )
      .sort((a, b) => 
        new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime()
      )
  }
}