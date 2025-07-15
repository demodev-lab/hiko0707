import { chromium, Browser, Page, BrowserContext } from 'playwright'
import type { HotDeal } from '@/types/hotdeal'

export interface CrawlerOptions {
  headless?: boolean
  maxPages?: number
  delay?: number
  timeout?: number
  viewport?: { width: number; height: number }
  userAgent?: string
  timeFilterHours?: number // 시간 기준 필터링 (시간 단위)
  onProgress?: (current: number, total: number, step: string) => void // 진행도 콜백
}

export interface CrawlerStatistics {
  totalDeals: number
  activeDeals: number
  endedDeals: number
  categoryCounts: Record<string, number>
  storeCounts: Record<string, number>
  freeShippingCount: number
  popularCount: number
  imagesCount: number
  contentCount: number
}

export abstract class BaseHotdealCrawler {
  protected options: Required<Omit<CrawlerOptions, 'timeFilterHours' | 'onProgress'>> & { timeFilterHours?: number; onProgress?: (current: number, total: number, step: string) => void }
  protected browser: Browser | null = null
  protected context: BrowserContext | null = null
  protected page: Page | null = null
  protected results: HotDeal[] = []

  constructor(options: CrawlerOptions = {}) {
    this.options = {
      headless: options.headless ?? true,
      maxPages: options.maxPages ?? 2,
      delay: options.delay ?? 3000, // 3초로 증가
      timeout: options.timeout ?? 60000, // 60초로 증가
      viewport: options.viewport ?? { width: 1920, height: 1080 },
      userAgent: options.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timeFilterHours: options.timeFilterHours,
      onProgress: options.onProgress
    }
  }

  protected async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-web-security',
        '--disable-features=VizServiceDisplayCompositor',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ]
    })

    this.context = await this.browser.newContext({
      viewport: this.options.viewport,
      userAgent: this.options.userAgent,
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    })

    this.page = await this.context.newPage()
    
    // 광고 및 불필요한 리소스 차단
    await this.page.route('**/*', (route) => {
      const url = route.request().url()
      const resourceType = route.request().resourceType()
      
      // 광고 및 트래킹 도메인 차단
      if (url.includes('googlesyndication.com') || 
          url.includes('doubleclick.net') || 
          url.includes('google-analytics.com') ||
          url.includes('googleadservices.com') ||
          url.includes('googletagmanager.com') ||
          url.includes('facebook.com/tr') ||
          url.includes('naver.com/adsystem') ||
          resourceType === 'media' ||
          resourceType === 'font') {
        route.abort()
      } else {
        route.continue()
      }
    })
    
    // 타임아웃 설정을 더 관대하게
    this.page.setDefaultTimeout(60000)
    this.page.setDefaultNavigationTimeout(60000)
    
    // 네트워크 요청 실패 로그를 조용히 처리
    this.page.on('requestfailed', (request) => {
      const url = request.url()
      if (!url.includes('googlesyndication.com') && !url.includes('doubleclick.net')) {
        console.log(`Request failed: ${url} - ${request.failure()?.errorText}`)
      }
    })
  }

  protected async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close()
    }
    if (this.context) {
      await this.context.close()
    }
    if (this.browser) {
      await this.browser.close()
    }
  }

  protected async delay(ms: number = this.options.delay): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  protected parsePrice(text: string): string | null {
    // 다양한 가격 패턴 매칭: "27,600", "(27,600/무료)", "13,900원", "￦13,900" 등
    const patterns = [
      /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/g,  // "13,900원"
      /\((\d{1,3}(?:,\d{3})*(?:\.\d+)?)[\/\s]/g, // "(27,600/"
      /￦\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g,    // "￦13,900"
      /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*\//g,    // "27,600/"
      /(\d{4,})/g  // 4자리 이상 숫자 (천원 이상)
    ]
    
    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        // 숫자만 추출
        const priceMatch = matches[0].match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/)
        if (priceMatch) {
          return priceMatch[0]
        }
      }
    }
    
    return null
  }

  protected parseStore(title: string): string | null {
    const storeMatch = title.match(/^\[([^\]]+)\]/)
    return storeMatch ? storeMatch[1] : null
  }

  protected isFreeShipping(text: string): boolean {
    return /무료|free|무배/i.test(text)
  }

  protected inferCategory(title: string): string {
    const categories = {
      '[의류/잡화]': ['의류', '옷', '신발', '가방', '악세서리', '패션', '블랙야크', '나이키', '아디다스'],
      '[식품/건강]': ['식품', '음식', '건강', '비타민', '영양제', '홍삼', '건강식품'],
      '[가전/디지털]': ['가전', '전자', '디지털', '컴퓨터', '노트북', '스마트폰', '갤럭시', '아이폰'],
      '[생활/가구]': ['생활', '가구', '인테리어', '주방', '욕실', '청소', '수납'],
      '[도서/문구]': ['도서', '책', '문구', '필기구', '노트', '다이어리'],
      '[화장품/미용]': ['화장품', '미용', '스킨케어', '메이크업', '향수', '헤어'],
      '[기타]': []
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category
      }
    }

    return '[기타]'
  }

  protected parseDate(dateStr: string): Date {
    const now = new Date()
    
    // "11:23:45" 형식
    if (/^\d{2}:\d{2}:\d{2}$/.test(dateStr)) {
      const [hours, minutes, seconds] = dateStr.split(':').map(Number)
      const date = new Date(now)
      date.setHours(hours, minutes, seconds, 0)
      return date
    }
    
    // "19/11/16" 형식
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('/').map(Number)
      return new Date(2000 + year, month - 1, day)
    }
    
    // "12-25" 형식
    if (/^\d{2}-\d{2}$/.test(dateStr)) {
      const [month, day] = dateStr.split('-').map(Number)
      return new Date(now.getFullYear(), month - 1, day)
    }
    
    return now
  }

  protected generateId(source: string, postId: string): string {
    const timestamp = Date.now()
    return `hotdeal_${timestamp}_${postId}`
  }

  protected generateStatistics(): CrawlerStatistics {
    const stats: CrawlerStatistics = {
      totalDeals: this.results.length,
      activeDeals: this.results.filter(deal => deal.status === 'active').length,
      endedDeals: this.results.filter(deal => deal.status === 'ended').length,
      categoryCounts: {},
      storeCounts: {},
      freeShippingCount: this.results.filter(deal => deal.shipping?.isFree).length,
      popularCount: this.results.filter(deal => deal.isPopular).length,
      imagesCount: this.results.filter(deal => deal.imageUrl || deal.thumbnailImageUrl || deal.originalImageUrl).length,
      contentCount: this.results.filter(deal => deal.productComment && deal.productComment.length > 0).length
    }

    // Count by category
    this.results.forEach(deal => {
      if (deal.category) {
        stats.categoryCounts[deal.category] = (stats.categoryCounts[deal.category] || 0) + 1
      }
    })

    // Count by store
    this.results.forEach(deal => {
      if (deal.seller) {
        stats.storeCounts[deal.seller] = (stats.storeCounts[deal.seller] || 0) + 1
      }
    })

    return stats
  }

  abstract crawl(): Promise<HotDeal[]>
  
  protected abstract getSourceName(): string
}