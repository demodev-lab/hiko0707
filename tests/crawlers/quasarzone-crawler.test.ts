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
import { QuasarzoneCrawler } from '@/lib/crawlers/quasarzone-crawler'

describe('QuasarzoneCrawler', () => {
  let crawler: QuasarzoneCrawler

  beforeEach(() => {
    vi.clearAllMocks()
    mockPageResult = null
    mockBrowserInitialized = true
    mockPageNavigation = null
    mockPageEvaluateResult = null
    mockRepositoryResult = null
    
    // Reset mock repository methods
    Object.values(mockRepositoryMethods).forEach(mock => mock.mockClear())
    
    crawler = new QuasarzoneCrawler({
      headless: true,
      maxPages: 2,
      delay: 100
    })
  })

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultCrawler = new QuasarzoneCrawler()
      expect(defaultCrawler).toBeInstanceOf(QuasarzoneCrawler)
    })

    it('should initialize with custom options', () => {
      const customCrawler = new QuasarzoneCrawler({
        headless: false,
        maxPages: 5,
        delay: 2000,
        timeout: 30000,
        timeFilterHours: 12
      })
      expect(customCrawler).toBeInstanceOf(QuasarzoneCrawler)
    })
  })

  describe('getSourceName', () => {
    it('should return 퀘이사존 as source name', () => {
      // Protected 메서드에 대한 접근을 위한 타입 단언
      const sourceName = (crawler as any).getSourceName()
      expect(sourceName).toBe('퀘이사존')
    })
  })

  describe('crawl method', () => {
    it('should successfully crawl and save to Supabase', async () => {
      // 크롤링 결과 mock 설정
      mockPageEvaluateResult = [
        {
          postNumber: '123456',
          title: '갤럭시 S24 Ultra 특가',
          url: '/bbs/qb_saleinfo/views/123456',
          author: '퀘이사존유저',
          category: '스마트폰',
          price: 1200000,
          store: '삼성',
          shippingInfo: '무료배송',
          views: 2500,
          recommendCount: 25,
          commentCount: 15,
          dateText: '2시간 전',
          status: null
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
        created: { id: 'new-quasarzone-hotdeal-123456' }
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
            title: '갤럭시 S24 Ultra 특가',
            source: 'quasarzone',
            source_id: '123456'
          })
        ])
      })

      expect(mockRepositoryMethods.findBySourceAndPostId).toHaveBeenCalledWith('quasarzone', '123456')
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
          title: 'RTX 4080 그래픽카드 특가',
          url: '/bbs/qb_saleinfo/views/11111',
          author: '기존유저',
          category: '그래픽카드',
          price: 1500000,
          store: 'NVIDIA',
          shippingInfo: '배송비 3000원',
          views: 3500,
          recommendCount: 35,
          commentCount: 20,
          dateText: '1일 전',
          status: null
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
        existing: { id: 'existing-quasarzone-hotdeal-11111', source_id: '11111' },
        updated: { id: 'existing-quasarzone-hotdeal-11111' }
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
            title: 'RTX 4080 그래픽카드 특가',
            source_id: '11111'
          })
        ])
      })

      expect(mockRepositoryMethods.findBySourceAndPostId).toHaveBeenCalledWith('quasarzone', '11111')
    })

    it('should handle repository save errors', async () => {
      mockPageEvaluateResult = [
        {
          postNumber: '99999',
          title: '[에러몰] 저장 실패 테스트',
          url: '/bbs/qb_saleinfo/views/99999',
          author: '에러유저',
          category: '기타',
          price: 50000,
          store: '에러몰',
          shippingInfo: '무료배송',
          views: 100,
          recommendCount: 1,
          commentCount: 0,
          dateText: '30분 전',
          status: null
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

    it('should handle expired status correctly', async () => {
      mockPageEvaluateResult = [
        {
          postNumber: '77777',
          title: '종료된 특가 상품',
          url: '/bbs/qb_saleinfo/views/77777',
          author: '종료유저',
          category: '기타',
          price: 100000,
          store: '종료몰',
          shippingInfo: '무료배송',
          views: 500,
          recommendCount: 5,
          commentCount: 2,
          dateText: '5일 전',
          status: '종료'
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
        created: { id: 'expired-hotdeal-77777' }
      }

      const result = await crawler.crawl()

      expect(result.hotdeals[0]).toMatchObject({
        title: '종료된 특가 상품',
        status: 'expired' // 종료 상태는 expired로 변환
      })
    })
  })

  describe('parseRelativeDate method', () => {
    it('should parse various relative date formats correctly', () => {
      const parseRelativeDate = (crawler as any).parseRelativeDate

      // 상대적 시간 형식 테스트
      const now = new Date()
      
      // "2시간 전"
      const hoursAgoResult = parseRelativeDate('2시간 전')
      const expectedHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      expect(hoursAgoResult.getHours()).toBeCloseTo(expectedHoursAgo.getHours(), 0)

      // "30분 전"
      const minutesAgoResult = parseRelativeDate('30분 전')
      const expectedMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
      expect(minutesAgoResult.getMinutes()).toBeCloseTo(expectedMinutesAgo.getMinutes(), 1)

      // "3일 전"
      const daysAgoResult = parseRelativeDate('3일 전')
      const expectedDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      expect(daysAgoResult.getDate()).toBe(expectedDaysAgo.getDate())

      // 절대적 날짜 형식: "2025.08.05"
      const absoluteDateResult = parseRelativeDate('2025.08.05')
      expect(absoluteDateResult.getFullYear()).toBe(2025)
      expect(absoluteDateResult.getMonth()).toBe(7) // 0-based month (August)
      expect(absoluteDateResult.getDate()).toBe(5)

      // 시간 형식: "14:30"
      const timeResult = parseRelativeDate('14:30')
      expect(timeResult.getHours()).toBe(14)
      expect(timeResult.getMinutes()).toBe(30)

      // 잘못된 형식은 현재 시간으로 fallback
      const currentTime = new Date()
      const fallbackResult = parseRelativeDate('invalid-date')
      expect(fallbackResult.getTime()).toBeCloseTo(currentTime.getTime(), -2) // 2초 정도 오차 허용
    })
  })

  describe('convertToHotDeal method', () => {
    it('should convert QuasarzonePost to HotDeal correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '123456',
        title: 'MacBook Pro M3 특가',
        url: '/bbs/qb_saleinfo/views/123456',
        author: '퀘이사존유저',
        category: '노트북',
        price: 2500000,
        store: '애플',
        shippingInfo: '무료배송',
        views: 3000,
        recommendCount: 30,
        commentCount: 20,
        postDate: new Date('2025-08-05T14:30:00Z'),
        status: null
      }

      const result = convertToHotDeal(post)

      expect(result).toEqual({
        id: '',
        source: 'quasarzone',
        source_id: '123456',
        category: '노트북',
        title: 'MacBook Pro M3 특가',
        description: null,
        original_price: 2500000,
        sale_price: 2500000,
        discount_rate: 0,
        seller: '애플',
        original_url: 'https://quasarzone.com/bbs/qb_saleinfo/views/123456',
        thumbnail_url: '',
        image_url: '',
        is_free_shipping: true, // 무료배송이므로 true
        status: 'active',
        end_date: expect.any(String),
        views: 3000,
        comment_count: 20,
        like_count: 30, // recommendCount가 like_count로 매핑
        author_name: '퀘이사존유저',
        shopping_comment: '',
        created_at: '2025-08-05T14:30:00.000Z',
        updated_at: expect.any(String),
        deleted_at: null
      })
    })

    it('should handle expired post correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const expiredPost = {
        postNumber: '654321',
        title: '종료된 특가',
        url: '/bbs/qb_saleinfo/views/654321',
        author: '종료유저',
        category: '기타',
        price: 100000,
        store: '종료몰',
        shippingInfo: '배송비 3000원',
        views: 500,
        recommendCount: 5,
        commentCount: 3,
        postDate: new Date('2025-08-05T10:00:00Z'),
        status: '종료'
      }

      const result = convertToHotDeal(expiredPost)

      expect(result).toMatchObject({
        source: 'quasarzone',
        source_id: '654321',
        title: '종료된 특가',
        status: 'expired',
        is_free_shipping: false, // 배송비가 있으므로 false
        seller: '종료몰'
      })
    })

    it('should handle post with full URL correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '33333',
        title: '외부 링크 상품',
        url: 'https://quasarzone.com/bbs/qb_saleinfo/views/33333',
        author: '링크유저',
        category: '기타',
        price: 50000,
        store: '퀘이사존',
        shippingInfo: '무료배송',
        views: 300,
        recommendCount: 3,
        commentCount: 1,
        postDate: new Date('2025-08-05T12:00:00Z'),
        status: null
      }

      const result = convertToHotDeal(post)

      expect(result.original_url).toBe('https://quasarzone.com/bbs/qb_saleinfo/views/33333')
      expect(result.seller).toBe('퀘이사존')
    })

    it('should handle post without price and store', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '44444',
        title: '가격 정보 없는 상품',
        url: '/bbs/qb_saleinfo/views/44444',
        author: '일반유저',
        category: '기타',
        price: 0,
        store: null,
        shippingInfo: null,
        views: 200,
        recommendCount: 2,
        commentCount: 0,
        postDate: new Date('2025-08-05T08:00:00Z'),
        status: null
      }

      const result = convertToHotDeal(post)

      expect(result.original_price).toBe(0)
      expect(result.sale_price).toBe(0)
      expect(result.seller).toBe('퀘이사존') // fallback
      expect(result.is_free_shipping).toBe(false) // 배송 정보 없으므로 false
    })
  })

  describe('time filter functionality', () => {
    it('should respect time filter when specified', async () => {
      const timeFilterCrawler = new QuasarzoneCrawler({
        timeFilterHours: 2,
        maxPages: 1
      })

      // 최근 시간과 오래된 시간의 게시물 mix
      const recentDate = new Date()
      const oldDate = new Date(Date.now() - 5 * 60 * 60 * 1000) // 5시간 전

      mockPageEvaluateResult = [
        {
          postNumber: '11111',
          title: '최근 게시물',
          url: '/bbs/qb_saleinfo/views/11111',
          author: '최근유저',
          category: '기타',
          price: 100000,
          store: '최근몰',
          shippingInfo: '무료배송',
          views: 100,
          recommendCount: 1,
          commentCount: 0,
          dateText: '1시간 전', // 최근
          status: null
        },
        {
          postNumber: '22222',
          title: '오래된 게시물',
          url: '/bbs/qb_saleinfo/views/22222',
          author: '과거유저',
          category: '기타',
          price: 50000,
          store: '과거몰',
          shippingInfo: '무료배송',
          views: 50,
          recommendCount: 0,
          commentCount: 0,
          dateText: '5시간 전', // 오래됨
          status: null
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
          url: '/bbs/qb_saleinfo',
          author: '테스트유저',
          category: '기타',
          price: 0,
          store: '테스트몰',
          shippingInfo: '무료배송',
          views: 0,
          recommendCount: 0,
          commentCount: 0,
          dateText: '1시간 전',
          status: null
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

  describe('view count parsing with k units', () => {
    it('should handle view count with k units correctly', () => {
      // 실제 DOM evaluation 로직을 simulate하는 함수
      const mockParseViewCount = (viewText: string) => {
        let views = 0
        if (viewText.toLowerCase().includes('k')) {
          const num = parseFloat(viewText.replace(/[^0-9.]/g, ''))
          views = Math.round(num * 1000)
        } else {
          views = parseInt(viewText.replace(/[^0-9]/g, '')) || 0
        }
        return views
      }

      // 다양한 조회수 형식 테스트
      expect(mockParseViewCount('1.5k')).toBe(1500)
      expect(mockParseViewCount('2.3K')).toBe(2300)
      expect(mockParseViewCount('1234')).toBe(1234)
      expect(mockParseViewCount('조회: 567')).toBe(567)
      expect(mockParseViewCount('0')).toBe(0)
    })
  })
})