import { BaseCrawler, CrawledHotDeal, CrawlerConfig, CrawlerResult } from './types'

export interface PpomppuSelectors {
  listRows: string
  imageThumb: string
  titleLink: string
  titleText: string
  category: string
  author: string
  date: string
  views: string
  recommend: string
  commentCount: string
}

// 뽐뿌 셀렉터 정의 (실제 사이트 구조에 맞게 업데이트)
export const PPOMPPU_SELECTORS: PpomppuSelectors = {
  listRows: '#revolution_main_table > tbody > tr.baseList',
  imageThumb: 'td.baseList-space.title > a > img',
  titleLink: 'td.baseList-space.title > div > div > a',
  titleText: 'td.baseList-space.title > div > div > a > span',
  category: 'td.baseList-space.title > div > small',
  author: 'td:nth-child(3) > div > nobr > a > span',
  date: 'td:nth-child(4) > time',
  views: 'td.baseList-space.baseList-views',
  recommend: 'td.baseList-space.baseList-rec',
  commentCount: 'td.baseList-space.title > div > div > span'
}

export class PpomppuCrawler extends BaseCrawler {
  public selectors: PpomppuSelectors

  constructor(config?: Partial<CrawlerConfig>) {
    super({
      name: 'ppomppu',
      baseUrl: 'https://www.ppomppu.co.kr',
      maxPages: 10, // 기본 10페이지까지
      targetDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 기본 어제까지
      delay: 1000, // 페이지 간 1초 딜레이
      ...config
    });
    
    this.selectors = PPOMPPU_SELECTORS;
  }

  // URL 생성
  getListUrl(page: number = 1, category?: string): string {
    const params = new URLSearchParams({
      id: 'ppomppu',
      page: page.toString()
    })
    
    if (category) {
      params.append('category', category)
    }
    
    return `${this.config.baseUrl}/zboard/zboard.php?${params.toString()}`
  }

  // 가격 파싱
  parsePrice(title: string): number {
    // 다양한 가격 패턴 매칭
    const patterns = [
      /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/,
      /₩\s*(\d{1,3}(?:,\d{3})*)/,
      /(\d{1,3}(?:,\d{3})*)\s*~/,
      /\((\d{1,3}(?:,\d{3})*)[원)]/
    ]
    
    for (const pattern of patterns) {
      const match = title.match(pattern)
      if (match) {
        const priceStr = match[1].replace(/,/g, '')
        const price = parseInt(priceStr)
        if (!isNaN(price) && price > 0) {
          return price
        }
      }
    }
    
    return 0
  }

  // 판매처 추출
  extractSeller(title: string): string {
    // [쿠팡], [G마켓] 등의 패턴
    const match = title.match(/\[([^\]]+)\]/)
    if (match) {
      return match[1].trim()
    }
    
    // 괄호 안의 판매처
    const parenMatch = title.match(/\(([^)]+)\)/)
    if (parenMatch) {
      const seller = parenMatch[1]
      const knownSellers = ['쿠팡', '마켓', '옥션', '위메프', '티몬', '11번가', 'SSG', '네이버', '인터파크', 'GS샵']
      if (knownSellers.some(s => seller.includes(s))) {
        return seller
      }
    }
    
    return '기타'
  }

  // 제목 정리
  cleanTitle(title: string): string {
    // 댓글 수 제거 [123]
    let cleaned = title.replace(/\[\d+\]$/, '').trim()
    
    // 추가 정리
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    
    return cleaned
  }

  // 날짜 파싱
  parseDate(dateStr: string): Date {
    // 25/07/11 형식
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
      const [year, month, day] = dateStr.split('/')
      const fullYear = parseInt(year) + 2000
      return new Date(fullYear, parseInt(month) - 1, parseInt(day))
    }
    
    // 07/11 형식 (올해 기준)
    if (dateStr.match(/^\d{2}\/\d{2}$/)) {
      const [month, day] = dateStr.split('/')
      const now = new Date()
      return new Date(now.getFullYear(), parseInt(month) - 1, parseInt(day))
    }
    
    // HH:MM 형식 (오늘)
    if (dateStr.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = dateStr.split(':')
      const now = new Date()
      now.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      return now
    }
    
    return new Date()
  }

  // 조회수 파싱
  parseViews(viewStr: string): number {
    const num = parseInt(viewStr.replace(/[^\d]/g, ''))
    return isNaN(num) ? 0 : num
  }

  // 추천수 파싱 (예: "5 - 1")
  parseRecommend(recStr: string): number {
    const parts = recStr.split('-')
    if (parts.length > 0) {
      const num = parseInt(parts[0].trim())
      return isNaN(num) ? 0 : num
    }
    return 0
  }

  // 카테고리 정규화
  normalizeCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      '컴퓨터': '전자',
      '디지털': '전자',
      '가전/가구': '생활/가전',
      '육아': '유아',
      '화장품': '뷰티',
      '의류/잡화': '패션',
      '식품/건강': '식품',
      '생활/주방': '생활/가전',
      '레저/자동차': '스포츠'
    }
    
    return categoryMap[category] || category || '기타'
  }

  // 무료배송 체크
  checkFreeShipping(title: string): boolean {
    const freeShippingKeywords = ['무료', '무배', '무료배송', '배송비무료']
    const lowerTitle = title.toLowerCase()
    
    return freeShippingKeywords.some(keyword => 
      lowerTitle.includes(keyword) || title.includes(keyword)
    )
  }

  // 크롤링 데이터 변환
  transformData(rawData: any): CrawledHotDeal {
    const title = this.cleanTitle(rawData.title || '')
    
    return {
      // id field not part of CrawledHotDeal interface - will be generated in convertToHotDeal
      title,
      price: this.parsePrice(title),
      originalUrl: rawData.link || '',
      seller: this.extractSeller(title),
      source: 'ppomppu' as const,
      crawledAt: new Date(),
      imageUrl: rawData.imageUrl || '',
      userId: rawData.author || '익명',
      communityCommentCount: parseInt(rawData.commentCount || '0'),
      communityRecommendCount: this.parseRecommend(rawData.recommend || '0'),
      viewCount: this.parseViews(rawData.views || '0'),
      productComment: '', // 상세 페이지에서 가져와야 함
      category: this.normalizeCategory(rawData.category || ''),
      shipping: {
        isFree: this.checkFreeShipping(title)
      },
      // status, likeCount, commentCount, translationStatus, createdAt, updatedAt not in CrawledHotDeal interface
      crawlerId: 'ppomppu-crawler-v1',
      crawlerVersion: '1.0.0'
    }
  }

  async crawl(): Promise<CrawlerResult> {
    const startTime = Date.now();
    const crawledDeals: CrawledHotDeal[] = [];
    let currentPage = 1;
    let shouldContinue = true;
    
    try {
      while (shouldContinue && currentPage <= (this.config.maxPages || 10)) {
        console.log(`🔍 뽐뿌 ${currentPage}페이지 크롤링 중...`);
        
        const pageDeals = await this.crawlPage(currentPage);
        
        if (pageDeals.length === 0) {
          console.log('더 이상 게시물이 없습니다.');
          break;
        }
        
        // 날짜 체크
        const oldestDeal = pageDeals[pageDeals.length - 1];
        if (this.config.targetDate && oldestDeal.crawledAt < this.config.targetDate) {
          // targetDate 이후의 게시물만 필터링
          const filteredDeals = pageDeals.filter(deal => deal.crawledAt >= this.config.targetDate!);
          crawledDeals.push(...filteredDeals);
          shouldContinue = false;
        } else {
          crawledDeals.push(...pageDeals);
        }
        
        currentPage++;
        
        // 다음 페이지로 가기 전 딜레이
        if (shouldContinue && currentPage <= (this.config.maxPages || 10)) {
          await new Promise(resolve => setTimeout(resolve, this.config.delay));
        }
      }
      
      return {
        success: true,
        data: crawledDeals,
        stats: {
          totalCrawled: crawledDeals.length,
          totalPages: currentPage - 1,
          duration: Date.now() - startTime
        }
      };
    } catch (error) {
      console.error('크롤링 중 오류 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        stats: {
          totalCrawled: crawledDeals.length,
          totalPages: currentPage - 1,
          duration: Date.now() - startTime
        }
      };
    }
  }

  private async crawlPage(pageNumber: number): Promise<CrawledHotDeal[]> {
    // 실제 크롤링은 action에서 Playwright MCP를 사용하여 구현
    // 여기서는 구조만 정의
    throw new Error('crawlPage는 action에서 구현되어야 합니다.');
  }
}

// 기본 크롤러 인스턴스 export
export const ppomppuCrawler = new PpomppuCrawler()