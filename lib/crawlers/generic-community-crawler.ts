import { CommunityCrawler } from './community-crawler'
import { CrawledHotDeal, CrawlerConfig } from './types'
import { HotDealSource } from '@/types/hotdeal'
import { 
  COMMUNITY_CONFIGS, 
  CATEGORY_NORMALIZATION_MAP,
  SELLER_PATTERNS,
  KNOWN_SELLERS,
  FREE_SHIPPING_KEYWORDS
} from './community-configs'

// 제네릭 커뮤니티 크롤러
// 대부분의 커뮤니티에서 공통적으로 사용할 수 있는 로직을 구현
export class GenericCommunityCrawler extends CommunityCrawler {
  protected communityName: HotDealSource
  protected communityConfig: typeof COMMUNITY_CONFIGS[HotDealSource]
  
  constructor(communityName: HotDealSource, config?: Partial<CrawlerConfig>) {
    const communityConfig = COMMUNITY_CONFIGS[communityName]
    if (!communityConfig) {
      throw new Error(`Unknown community: ${communityName}`)
    }
    
    const defaultConfig = {
      name: communityName,
      baseUrl: communityConfig.baseUrl,
      ...config
    }
    
    super(defaultConfig, communityConfig.selectors)
    this.communityName = communityName
    this.communityConfig = communityConfig
  }
  
  // URL 생성
  getListUrl(page: number = 1): string {
    // 기본 페이지 파라미터 패턴
    const params = new URLSearchParams({
      page: page.toString()
    })
    
    return `${this.communityConfig.boardUrl}?${params.toString()}`
  }
  
  // 리스트 데이터 추출 스크립트 커스터마이징 (필요시 오버라이드)
  extractListData(baseScript: string): string {
    return baseScript
  }
  
  // 상세 데이터 추출 스크립트 커스터마이징 (필요시 오버라이드)
  extractDetailData(baseScript: string): string {
    return baseScript
  }
  
  // 원시 데이터를 CrawledHotDeal로 변환
  transformRawData(rawData: any): CrawledHotDeal {
    const title = this.cleanTitle(rawData.title || '')
    
    // 이미지 URL 처리 - 원본 이미지 우선
    const thumbnailImageUrl = rawData.imageUrl || rawData.thumbnailImageUrl || rawData.thumbUrl || ''
    const originalImageUrl = rawData.originalImageUrl || rawData.detailImageUrl || rawData.largeImageUrl || ''
    const imageUrl = originalImageUrl || thumbnailImageUrl || ''
    
    return {
      id: `${this.communityName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      price: this.parsePrice(title),
      originalUrl: rawData.link || '',
      seller: this.extractSeller(title),
      source: this.communityName,
      crawledAt: new Date(),
      thumbnailImageUrl,
      originalImageUrl,
      imageUrl, // 고해상도 우선
      userId: rawData.author || '익명',
      communityCommentCount: this.parseNumber(rawData.commentCount || '0'),
      communityRecommendCount: this.parseNumber(rawData.recommend || '0'),
      viewCount: this.parseNumber(rawData.views || '0'),
      productComment: rawData.productComment || '',
      category: this.normalizeCategory(rawData.category || ''),
      shipping: {
        isFree: this.checkFreeShipping(title)
      },
      status: rawData.isEnded ? 'ended' : 'active' as const,
      likeCount: 0,
      commentCount: 0,
      translationStatus: 'pending' as const,
      createdAt: this.parseDate(rawData.date || ''),
      updatedAt: new Date(),
      crawlerId: `${this.communityName}-crawler`,
      crawlerVersion: '1.0.0'
    }
  }
  
  // 제목 정리
  protected cleanTitle(title: string): string {
    // 댓글 수 제거 [123]
    let cleaned = title.replace(/\[\d+\]$/, '').trim()
    
    // HTML 엔티티 디코드
    cleaned = this.decodeHtmlEntities(cleaned)
    
    // 추가 정리
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    
    return cleaned
  }
  
  // HTML 엔티티 디코드
  protected decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' '
    }
    
    return text.replace(/&[^;]+;/g, match => entities[match] || match)
  }
  
  // 가격 파싱
  protected parsePrice(title: string): number {
    // 커뮤니티별 커스텀 패턴이 있으면 우선 사용
    const patterns = this.communityConfig.parseRules?.pricePatterns || [
      /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/,
      /₩\s*(\d{1,3}(?:,\d{3})*)/,
      /(\d{1,3}(?:,\d{3})*)\s*~/,
      /\((\d{1,3}(?:,\d{3})*)[원)]/,
      /(\d{1,3}(?:,\d{3})*)\s*\$/,
      /\$\s*(\d{1,3}(?:,\d{3})*)/
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
  protected extractSeller(title: string): string {
    // 판매처 추출 패턴 사용
    for (const pattern of SELLER_PATTERNS) {
      const match = title.match(pattern)
      if (match) {
        const seller = match[1].trim()
        // 알려진 판매처 확인
        const knownSeller = KNOWN_SELLERS.find(s => 
          seller.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(seller.toLowerCase())
        )
        if (knownSeller) {
          return seller
        }
      }
    }
    
    return '기타'
  }
  
  // 숫자 파싱
  protected parseNumber(str: string): number {
    // 천 단위 약어 처리 (1.2k -> 1200)
    if (str.match(/\d+(\.\d+)?k/i)) {
      const num = parseFloat(str.replace(/k/i, ''))
      return Math.round(num * 1000)
    }
    
    // 만 단위 처리 (1.5만 -> 15000)
    if (str.includes('만')) {
      const num = parseFloat(str.replace(/[^\d.]/g, ''))
      return Math.round(num * 10000)
    }
    
    // 일반 숫자
    const num = parseInt(str.replace(/[^\d]/g, ''))
    return isNaN(num) ? 0 : num
  }
  
  // 날짜 파싱
  protected parseDate(dateStr: string): Date {
    const now = new Date()
    
    // 상대 시간 처리
    if (dateStr.includes('방금') || dateStr.includes('now')) {
      return now
    }
    
    if (dateStr.includes('분') || dateStr.includes('min')) {
      const minutes = parseInt(dateStr.match(/\d+/)?.[0] || '0')
      return new Date(now.getTime() - minutes * 60 * 1000)
    }
    
    if (dateStr.includes('시간') || dateStr.includes('hour')) {
      const hours = parseInt(dateStr.match(/\d+/)?.[0] || '0')
      return new Date(now.getTime() - hours * 60 * 60 * 1000)
    }
    
    if (dateStr.includes('일') || dateStr.includes('day')) {
      const days = parseInt(dateStr.match(/\d+/)?.[0] || '0')
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    }
    
    // 절대 날짜 형식들
    // YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr)
    }
    
    // YY/MM/DD 또는 YY-MM-DD
    if (dateStr.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{2}/)) {
      const parts = dateStr.split(/[\/\-]/)
      const year = parseInt(parts[0]) + 2000
      const month = parseInt(parts[1]) - 1
      const day = parseInt(parts[2])
      return new Date(year, month, day)
    }
    
    // MM/DD 또는 MM-DD (올해로 가정)
    if (dateStr.match(/^\d{2}[\/\-]\d{2}$/)) {
      const parts = dateStr.split(/[\/\-]/)
      return new Date(now.getFullYear(), parseInt(parts[0]) - 1, parseInt(parts[1]))
    }
    
    // HH:MM 형식 (오늘)
    if (dateStr.match(/^\d{2}:\d{2}/)) {
      const [hours, minutes] = dateStr.split(':').map(n => parseInt(n))
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      return date
    }
    
    return now
  }
  
  // 카테고리 정규화
  protected normalizeCategory(category: string): string {
    // [] 제거
    category = category.replace(/[\[\]]/g, '').trim()
    
    // 정규화 맵에서 찾기
    return CATEGORY_NORMALIZATION_MAP[category] || category || '기타'
  }
  
  // 무료배송 체크
  protected checkFreeShipping(title: string): boolean {
    const lowerTitle = title.toLowerCase()
    
    return FREE_SHIPPING_KEYWORDS.some(keyword => 
      lowerTitle.includes(keyword.toLowerCase()) || title.includes(keyword)
    )
  }
}