import { CommunityCrawler, CommunitySelectors } from './community-crawler'
import { CrawledHotDeal, CrawlerConfig, CrawlerResult } from './types'

// 뽐뿌 셀렉터 정의
const PPOMPPU_SELECTORS: CommunitySelectors = {
  // 목록 페이지
  listRows: '#revolution_main_table > tbody > tr.baseList',
  nextPageButton: '#bottom-table > div.info_bg > a',
  
  // 목록 항목
  titleLink: 'td.baseList-space.title > div > div > a',
  titleText: 'td.baseList-space.title > div > div > a > span',
  imageThumb: 'td.baseList-space.title > a > img',
  category: 'td.baseList-space.title > div > small',
  author: 'td:nth-child(3) > div > nobr > a > span',
  date: 'td:nth-child(4) > time, td:nth-child(4)',
  views: 'td.baseList-space.baseList-views',
  recommend: 'td.baseList-space.baseList-rec',
  commentCount: 'td.baseList-space.title > div > div > span',
  endedMark: 'td.baseList-space.title > div > div > img[alt="종료"]',
  
  // 상세 페이지
  detailImage: [
    'body > div.wrapper > div.contents > div.container > div > table:nth-child(14) > tbody > tr:nth-child(1) > td > table > tbody > tr > td > p:nth-child(2) > div > img',
    '.board-contents img',
    'td.board-contents img',
    '[class*="content"] img'
  ],
  detailContent: [
    'td.board-contents',
    'div.board-contents',
    'table.board-contents',
    '[class*="board_read_content"]',
    'body > div.wrapper > div.contents > div.container > div > table:nth-child(14) > tbody > tr:nth-child(1) > td > table > tbody > tr > td'
  ]
}

export class PpomppuRealCrawler extends CommunityCrawler {
  constructor(config?: Partial<CrawlerConfig>) {
    const defaultConfig = {
      name: 'ppomppu',
      baseUrl: 'https://www.ppomppu.co.kr',
      ...config
    }
    
    super(defaultConfig, PPOMPPU_SELECTORS)
  }
  
  // URL 생성
  getListUrl(page: number = 1): string {
    // 뽐뿌 게시판 URL
    const params = new URLSearchParams({
      id: 'ppomppu',
      page: page.toString()
    })
    
    return `${this.config.baseUrl}/zboard/zboard.php?${params.toString()}`
  }
  
  // 리스트 데이터 추출 스크립트 (뽐뿌 특화)
  extractListData(baseScript: string): string {
    // 기본 스크립트를 그대로 사용하거나 커스터마이징
    return baseScript
  }
  
  // 상세 데이터 추출 스크립트 (뽐뿌 특화)
  extractDetailData(baseScript: string): string {
    // 기본 스크립트를 그대로 사용하거나 커스터마이징
    return baseScript
  }
  
  // 원시 데이터를 CrawledHotDeal로 변환
  transformRawData(rawData: any): CrawledHotDeal {
    const title = this.cleanTitle(rawData.title || '')
    
    // 이미지 URL 처리 - 원본 이미지 우선
    const thumbnailImageUrl = rawData.imageUrl || rawData.thumbnailImageUrl || ''
    const originalImageUrl = rawData.originalImageUrl || rawData.detailImageUrl || ''
    const imageUrl = originalImageUrl || thumbnailImageUrl || ''
    
    return {
      // id field not part of CrawledHotDeal interface - will be generated in convertToHotDeal
      title,
      price: this.parsePrice(title),
      originalUrl: rawData.link || '',
      seller: this.extractSeller(title),
      source: 'ppomppu' as const,
      crawledAt: new Date(),
      thumbnailImageUrl,
      originalImageUrl,
      imageUrl, // 고해상도 우선
      userId: rawData.author || '익명',
      communityCommentCount: this.parseNumber(rawData.commentCount || '0'),
      communityRecommendCount: this.parseRecommend(rawData.recommend || '0'),
      viewCount: this.parseNumber(rawData.views || '0'),
      productComment: rawData.productComment || '',
      category: this.normalizeCategory(rawData.category || ''),
      shipping: {
        isFree: this.checkFreeShipping(title)
      },
      // status, likeCount, commentCount, translationStatus, createdAt, updatedAt not in CrawledHotDeal interface
      crawlerId: 'ppomppu-crawler',
      crawlerVersion: '1.0.0'
    }
  }
  
  // 제목 정리
  private cleanTitle(title: string): string {
    // 댓글 수 제거 [123]
    let cleaned = title.replace(/\[\d+\]$/, '').trim()
    
    // 추가 정리
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    
    return cleaned
  }
  
  // 가격 파싱
  private parsePrice(title: string): number {
    // 1순위: 가격 다양인 경우 -1 반환
    if (/다양|various|varied/i.test(title)) {
      return -1
    }
    
    // 2순위: 실제 가격 패턴 매칭 (배송비 키워드 무시하고 숫자 우선 추출)
    const patterns = [
      /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/,
      /₩\s*(\d{1,3}(?:,\d{3})*)/,
      /(\d{1,3}(?:,\d{3})*)\s*~/,
      /\((\d{1,3}(?:,\d{3})*)[원)]/,
      /\((\d{1,3}(?:,\d{3})*)[\/\s]/,  // "(16,950/"
      /(\d{1,3}(?:,\d{3})*)\s*\//,     // "16,950/"
      /(\d{4,})/  // 4자리 이상 숫자
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
    
    // 3순위: 프로모션 키워드 체크 (숫자가 없는 경우만)
    if (/이벤트|event|쿠폰|coupon|프로모션|promotion|추첨|경품/i.test(title)) {
      return 0
    }
    
    // 4순위: 순수 무료 상품 (숫자가 전혀 없는 무료 상품만)
    if (!/\d/.test(title) && /무료|free/i.test(title)) {
      return 0
    }
    
    // 가격을 찾을 수 없는 경우 -1 반환 (가격다양으로 처리)
    return -1
  }
  
  // 판매처 추출
  private extractSeller(title: string): string {
    // [쿠팡], [G마켓] 등의 패턴
    const match = title.match(/\[([^\]]+)\]/)
    if (match) {
      const seller = match[1].trim()
      // 알려진 쇼핑몰 확인
      const knownSellers = ['쿠팡', 'G마켓', '11번가', '옥션', '위메프', '티몬', 'SSG', '네이버', '인터파크', 'GS샵', '롯데온', '마켓컬리']
      if (knownSellers.some(s => seller.includes(s))) {
        return seller
      }
    }
    
    return '기타'
  }
  
  // 숫자 파싱
  private parseNumber(str: string): number {
    const num = parseInt(str.replace(/[^\d]/g, ''))
    return isNaN(num) ? 0 : num
  }
  
  // 추천수 파싱 (예: "5 - 1")
  private parseRecommend(recStr: string): number {
    const parts = recStr.split('-')
    if (parts.length > 0) {
      const num = parseInt(parts[0].trim())
      return isNaN(num) ? 0 : num
    }
    return 0
  }
  
  // 날짜 파싱
  private parseDate(dateStr: string): Date {
    // 25/07/11 형식
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
      const [year, month, day] = dateStr.split('/')
      const fullYear = parseInt(year) + 2000
      return new Date(fullYear, parseInt(month) - 1, parseInt(day))
    }
    
    // HH:MM 형식 (오늘)
    if (dateStr.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = dateStr.split(':')
      const now = new Date()
      now.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      return now
    }
    
    // HH:MM:SS 형식 (오늘)
    if (dateStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
      const [hours, minutes, seconds] = dateStr.split(':')
      const now = new Date()
      now.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0)
      return now
    }
    
    return new Date()
  }
  
  // 카테고리 정규화
  private normalizeCategory(category: string): string {
    // [] 제거
    category = category.replace(/[\[\]]/g, '').trim()
    
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
  private checkFreeShipping(title: string): boolean {
    const freeShippingKeywords = ['무료', '무배', '무료배송', '배송비무료']
    const lowerTitle = title.toLowerCase()
    
    return freeShippingKeywords.some(keyword => 
      lowerTitle.includes(keyword) || title.includes(keyword)
    )
  }
  
  // 뽐뿌 메인 페이지에서 탭 클릭 후 크롤링
  async crawlFromMainPage(options: any = {}): Promise<CrawlerResult> {
    try {
      // 브라우저 초기화
      await this.playwright.initialize()
      
      // 메인 페이지 접속
      console.log('🏠 뽐뿌 메인 페이지 접속...')
      await this.playwright.navigate({ 
        url: 'https://www.ppomppu.co.kr/index.php',
        waitUntil: 'domcontentloaded'
      })
      
      // '뽐뿌' 탭 클릭
      console.log('📍 뽐뿌 탭 클릭...')
      const tabSelector = 'body > div.wrapper > div.contents > div.contents_header.abs > div.top-nav > ul > li.menu01 > a'
      await this.playwright.click(tabSelector)
      
      // 페이지 로드 대기
      await this.playwright.waitForSelector(this.selectors.listRows, 5000)
      
      // 일반 크롤링 진행
      return await this.crawl(options)
      
    } catch (error) {
      console.error('메인 페이지 크롤링 실패:', error)
      throw error
    }
  }
}

// 기본 인스턴스 export
export const ppomppuRealCrawler = new PpomppuRealCrawler()