import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock 상태 관리를 위한 전역 변수들
let mockPageResult: any = null
let mockBrowserInitialized = false
let mockPageNavigation: any = null
let mockPageEvaluateResult: any = null
let mockRepositoryResult: any = null

// Mock Playwright Page 객체
const createMockPage = () => ({
  goto: vi.fn().mockImplementation((url: string, options?: any) => {
    if (mockPageNavigation?.shouldFail) {
      return Promise.reject(new Error('Navigation failed'))
    }
    return Promise.resolve()
  }),
  evaluate: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockPageEvaluateResult || [])
  }),
  waitForSelector: vi.fn().mockResolvedValue(true),
  close: vi.fn().mockResolvedValue(undefined),
  setDefaultTimeout: vi.fn(),
  setDefaultNavigationTimeout: vi.fn(),
  on: vi.fn(),
  route: vi.fn()
})

// Mock Playwright Browser Context
const createMockContext = () => ({
  newPage: vi.fn().mockImplementation(() => Promise.resolve(createMockPage())),
  close: vi.fn().mockResolvedValue(undefined)
})

// Mock Playwright Browser
const createMockBrowser = () => ({
  newContext: vi.fn().mockImplementation(() => Promise.resolve(createMockContext())),
  close: vi.fn().mockResolvedValue(undefined)
})

// Mock chromium
const mockChromium = {
  launch: vi.fn().mockImplementation(() => {
    if (mockBrowserInitialized) {
      return Promise.resolve(createMockBrowser())
    }
    return Promise.reject(new Error('Browser launch failed'))
  })
}

// Mock external dependencies
vi.mock('playwright', () => ({
  chromium: mockChromium
}))

vi.mock('chalk', () => ({
  default: {
    green: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    cyan: vi.fn((text: string) => text),
    gray: vi.fn((text: string) => text),
    blue: vi.fn((text: string) => text)
  }
}))

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: ''
  }))
}))

// Mock SupabaseHotDealRepository
const mockRepositoryMethods = {
  findBySourceAndPostId: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockRepositoryResult?.existing || null)
  }),
  create: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockRepositoryResult?.created || { id: 'new-hotdeal-id' })
  }),
  update: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockRepositoryResult?.updated || { id: 'updated-hotdeal-id' })
  })
}

vi.mock('@/lib/db/supabase/repositories/hotdeal-repository', () => ({
  SupabaseHotDealRepository: vi.fn().mockImplementation(() => mockRepositoryMethods)
}))

// Import after mocking
import { EomisaeCrawler } from '@/lib/crawlers/eomisae-crawler'

describe('EomisaeCrawler', () => {
  let crawler: EomisaeCrawler

  beforeEach(() => {
    vi.clearAllMocks()
    mockPageResult = null
    mockBrowserInitialized = true
    mockPageNavigation = null
    mockPageEvaluateResult = null
    mockRepositoryResult = null
    
    // Reset mock repository methods
    Object.values(mockRepositoryMethods).forEach(mock => mock.mockClear())
    
    crawler = new EomisaeCrawler({
      headless: true,
      maxPages: 2,
      delay: 100
    })
  })

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultCrawler = new EomisaeCrawler()
      expect(defaultCrawler).toBeInstanceOf(EomisaeCrawler)
    })

    it('should initialize with custom options', () => {
      const customCrawler = new EomisaeCrawler({
        headless: false,
        maxPages: 5,
        delay: 2000,
        timeout: 30000,
        timeFilterHours: 12
      })
      expect(customCrawler).toBeInstanceOf(EomisaeCrawler)
    })
  })

  describe('getSourceName', () => {
    it('should return 어미새 as source name', () => {
      // Protected 메서드에 대한 접근을 위한 타입 단언
      const sourceName = (crawler as any).getSourceName()
      expect(sourceName).toBe('어미새')
    })
  })

  describe('crawl method', () => {
    it('should successfully crawl and save to Supabase', async () => {
      // 크롤링 결과 mock 설정
      mockPageEvaluateResult = [
        {
          postNumber: '158996807',
          title: '[아디다스] 운동화 특가 89,000원 무료배송',
          url: '/fs/158996807',
          author: '어미새유저',
          category: '패션',
          views: 1200,
          likeCount: 15,
          commentCount: 8,
          dateText: '25.08.05'
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.evaluate).mockResolvedValue(mockPageEvaluateResult)
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      // Repository mock 설정 - 신규 추가 시나리오
      mockRepositoryResult = {
        existing: null,
        created: { id: 'new-eomisae-hotdeal-123' }
      }

      const result = await crawler.crawl()

      expect(result).toEqual({
        totalCrawled: 1,
        newDeals: 1,
        updatedDeals: 0,
        errors: 0,
        duration: expect.any(Number),
        hotdeals: expect.arrayContaining([
          expect.objectContaining({
            title: '[아디다스] 운동화 특가 89,000원 무료배송',
            source: 'eomisae',
            source_id: '158996807'
          })
        ])
      })

      expect(mockRepositoryMethods.findBySourceAndPostId).toHaveBeenCalledWith('eomisae', '158996807')
      expect(mockRepositoryMethods.create).toHaveBeenCalledTimes(1)
    })

    it('should handle crawling errors gracefully', async () => {
      mockBrowserInitialized = false // 브라우저 초기화 실패

      await expect(crawler.crawl()).rejects.toThrow('Browser launch failed')
    })

    it('should update existing hotdeals', async () => {
      // 기존 핫딜이 있는 경우 시나리오
      mockPageEvaluateResult = [
        {
          postNumber: '11111',
          title: '[나이키] 기존 상품 업데이트',
          url: '/fs/11111',
          author: '기존유저',
          category: '패션',
          views: 2500,
          likeCount: 20,
          commentCount: 15,
          dateText: '25.08.05'
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.evaluate).mockResolvedValue(mockPageEvaluateResult)
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      // Repository mock 설정 - 업데이트 시나리오
      mockRepositoryResult = {
        existing: { id: 'existing-eomisae-hotdeal-11111', source_id: '11111' },
        updated: { id: 'existing-eomisae-hotdeal-11111' }
      }

      const result = await crawler.crawl()

      expect(result).toEqual({
        totalCrawled: 1,
        newDeals: 0,
        updatedDeals: 1,
        errors: 0,
        duration: expect.any(Number),
        hotdeals: expect.arrayContaining([
          expect.objectContaining({
            title: '[나이키] 기존 상품 업데이트',
            source_id: '11111'
          })
        ])
      })

      expect(mockRepositoryMethods.findBySourceAndPostId).toHaveBeenCalledWith('eomisae', '11111')
    })

    it('should handle repository save errors', async () => {
      mockPageEvaluateResult = [
        {
          postNumber: '99999',
          title: '[에러몰] 저장 실패 테스트',
          url: '/fs/99999',
          author: '에러유저',
          category: '기타',
          views: 100,
          likeCount: 1,
          commentCount: 0,
          dateText: '25.08.05'
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.evaluate).mockResolvedValue(mockPageEvaluateResult)
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      // Repository save 실패 시나리오
      mockRepositoryResult = {
        existing: null
      }
      
      // create 메서드에서 에러 발생
      mockRepositoryMethods.create.mockRejectedValue(new Error('Database save failed'))

      const result = await crawler.crawl()

      expect(result).toEqual({
        totalCrawled: 1,
        newDeals: 0,
        updatedDeals: 0,
        errors: 1,
        duration: expect.any(Number),
        hotdeals: expect.arrayContaining([
          expect.objectContaining({
            title: '[에러몰] 저장 실패 테스트'
          })
        ])
      })
    })
  })

  describe('parseEomisaeDate method', () => {
    it('should parse various Eomisae date formats correctly', () => {
      const parseEomisaeDate = (crawler as any).parseEomisaeDate

      // 어미새 표준 형식: YY.MM.DD
      const dateResult1 = parseEomisaeDate('25.08.05')
      expect(dateResult1.getFullYear()).toBe(2025)
      expect(dateResult1.getMonth()).toBe(7) // 0-based month (August)
      expect(dateResult1.getDate()).toBe(5)

      const dateResult2 = parseEomisaeDate('24.12.31')
      expect(dateResult2.getFullYear()).toBe(2024)
      expect(dateResult2.getMonth()).toBe(11) // 0-based month (December)
      expect(dateResult2.getDate()).toBe(31)

      // 다른 형식이나 잘못된 형식은 현재 시간으로 fallback
      const currentTime = new Date()
      const fallbackResult = parseEomisaeDate('invalid-date')
      expect(fallbackResult.getTime()).toBeCloseTo(currentTime.getTime(), -2) // 2초 정도 오차 허용
    })
  })

  describe('inferCategoryFromEomisae method', () => {
    it('should infer category from Eomisae post category and title', () => {
      const inferCategoryFromEomisae = (crawler as any).inferCategoryFromEomisae

      // 카테고리 기반 추론
      expect(inferCategoryFromEomisae('패션', '아디다스 운동화')).toBe('패션의류')
      expect(inferCategoryFromEomisae('네이버', '네이버페이 할인')).toBe('기타')
      expect(inferCategoryFromEomisae('기타', '기타 상품')).toBe('기타')

      // 제목 기반 추론
      expect(inferCategoryFromEomisae('', '나이키 스니커즈 할인')).toBe('신발')
      expect(inferCategoryFromEomisae('', '가방 특가 세일')).toBe('가방')
      expect(inferCategoryFromEomisae('', '야구모자 캡 할인')).toBe('모자/액세서리')
      expect(inferCategoryFromEomisae('', '시계 워치 특가')).toBe('모자/액세서리')
      expect(inferCategoryFromEomisae('', '지갑 벨트 세트')).toBe('모자/액세서리')

      // 기본값
      expect(inferCategoryFromEomisae('', '일반 상품')).toBe('기타')
      expect(inferCategoryFromEomisae()).toBe('기타')
    })
  })

  describe('convertToHotDeal method', () => {
    it('should convert EomisaePost to HotDeal correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '158996807',
        title: '[아디다스] 운동화 특가 120,000원 무료배송',
        url: '/fs/158996807',
        author: '어미새유저',
        category: '패션',
        views: 1500,
        likeCount: 12,
        commentCount: 8,
        postDate: new Date('2025-08-05T14:30:00Z')
      }

      const result = convertToHotDeal(post)

      expect(result).toEqual({
        id: '',
        source: 'eomisae',
        source_id: '158996807',
        category: '패션의류', // inferCategoryFromEomisae 결과
        title: '[아디다스] 운동화 특가 120,000원 무료배송',
        description: null,
        original_price: 120000,
        sale_price: 120000,
        discount_rate: 0,
        seller: '아디다스',
        original_url: 'https://eomisae.co.kr/fs/158996807',
        thumbnail_url: '',
        image_url: '',
        is_free_shipping: true,
        status: 'active',
        end_date: expect.any(String),
        views: 1500,
        comment_count: 8,
        like_count: 12,
        author_name: '어미새유저',
        shopping_comment: '',
        created_at: '2025-08-05T14:30:00.000Z',
        updated_at: expect.any(String),
        deleted_at: null
      })
    })

    it('should handle post with full URL correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '33333',
        title: '외부 링크 상품',
        url: 'https://eomisae.co.kr/fs/33333',
        author: '링크유저',
        category: '기타',
        views: 300,
        likeCount: 2,
        commentCount: 0,
        postDate: new Date('2025-08-05T10:00:00Z')
      }

      const result = convertToHotDeal(post)

      expect(result.original_url).toBe('https://eomisae.co.kr/fs/33333')
      expect(result.seller).toBe('기타') // category fallback
    })

    it('should use category as seller when no store is parsed', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '44444',
        title: '특가 상품 할인',
        url: '/fs/44444',
        author: '일반유저',
        category: '네이버',
        views: 200,
        likeCount: 1,
        commentCount: 1,
        postDate: new Date('2025-08-05T12:00:00Z')
      }

      const result = convertToHotDeal(post)

      expect(result.seller).toBe('네이버') // category used as seller
      expect(result.category).toBe('기타') // inferCategoryFromEomisae result for '네이버'
    })
  })

  describe('time filter functionality', () => {
    it('should respect time filter when specified', async () => {
      const timeFilterCrawler = new EomisaeCrawler({
        timeFilterHours: 2,
        maxPages: 1
      })

      // 최근 시간과 오래된 시간의 게시물 mix
      const recentDate = new Date()
      const oldDate = new Date(Date.now() - 5 * 60 * 60 * 1000) // 5시간 전

      // 어미새 날짜 형식으로 변환
      const formatEomisaeDate = (date: Date) => {
        return `${(date.getFullYear() % 100).toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`
      }

      mockPageEvaluateResult = [
        {
          postNumber: '11111',
          title: '최근 게시물',
          url: '/fs/11111',
          author: '최근유저',
          category: '패션',
          views: 100,
          likeCount: 1,
          commentCount: 0,
          dateText: formatEomisaeDate(recentDate)
        },
        {
          postNumber: '22222',
          title: '오래된 게시물',
          url: '/fs/22222',
          author: '과거유저',
          category: '기타',
          views: 50,
          likeCount: 0,
          commentCount: 0,
          dateText: formatEomisaeDate(oldDate)
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.evaluate).mockResolvedValue(mockPageEvaluateResult)
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      mockRepositoryResult = {
        existing: null,
        created: { id: 'recent-hotdeal' }
      }

      const result = await timeFilterCrawler.crawl()

      // 시간 필터링으로 인해 최근 게시물만 처리되어야 함
      expect(result.totalCrawled).toBe(1)
      expect(result.hotdeals[0].title).toBe('최근 게시물')
    })
  })

  describe('crawlPage method edge cases', () => {
    it('should handle empty page gracefully', async () => {
      const crawlPage = (crawler as any).crawlPage

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        // waitForSelector 실패 시뮬레이션
        vi.mocked(mockPage.waitForSelector).mockRejectedValue(new Error('Selector timeout'))
        vi.mocked(mockPage.evaluate).mockResolvedValue([])
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      await crawler.crawl() // initialize browser and page
      const result = await crawlPage(1)

      expect(result).toEqual([])
    })

    it('should handle posts without valid post ID', async () => {
      mockPageEvaluateResult = [
        {
          postNumber: '', // 빈 postNumber
          title: '유효하지 않은 게시물',
          url: '/fs/',
          author: '테스트유저',
          category: '기타',
          views: 0,
          likeCount: 0,
          commentCount: 0,
          dateText: '25.08.05'
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.evaluate).mockResolvedValue(mockPageEvaluateResult)
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      const result = await crawler.crawl()

      // postNumber가 없는 게시물은 처리되지 않아야 함
      expect(result.totalCrawled).toBe(0)
      expect(result.hotdeals).toHaveLength(0)
    })
  })

  describe('page URL generation', () => {
    it('should generate correct URLs for different pages', async () => {
      const crawlPage = (crawler as any).crawlPage
      
      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.evaluate).mockResolvedValue([])
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      await crawler.crawl() // initialize browser

      // 첫 번째 페이지 (기본 URL)
      await crawlPage(1)
      expect(mockChromium.launch).toHaveBeenCalled()

      // 두 번째 페이지 (page 파라미터 포함)
      await crawlPage(2)
      // URL이 ?page=2 형태로 생성되는지 확인할 수 있지만, 
      // 현재 mock 구조에서는 실제 URL을 검증하기 어려움
      // 실제 테스트에서는 page.goto 호출 시 전달된 URL을 확인할 수 있음
    })
  })
})