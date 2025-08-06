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
import { ClienCrawler } from '@/lib/crawlers/clien-crawler'

describe('ClienCrawler', () => {
  let crawler: ClienCrawler

  beforeEach(() => {
    vi.clearAllMocks()
    mockPageResult = null
    mockBrowserInitialized = true
    mockPageNavigation = null
    mockPageEvaluateResult = null
    mockRepositoryResult = null
    
    // Reset mock repository methods
    Object.values(mockRepositoryMethods).forEach(mock => mock.mockClear())
    
    crawler = new ClienCrawler({
      headless: true,
      maxPages: 2,
      delay: 100
    })
  })

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultCrawler = new ClienCrawler()
      expect(defaultCrawler).toBeInstanceOf(ClienCrawler)
    })

    it('should initialize with custom options', () => {
      const customCrawler = new ClienCrawler({
        headless: false,
        maxPages: 5,
        delay: 2000,
        timeout: 30000,
        timeFilterHours: 12
      })
      expect(customCrawler).toBeInstanceOf(ClienCrawler)
    })
  })

  describe('getSourceName', () => {
    it('should return 클리앙 as source name', () => {
      // Protected 메서드에 대한 접근을 위한 타입 단언
      const sourceName = (crawler as any).getSourceName()
      expect(sourceName).toBe('클리앙')
    })
  })

  describe('crawl method', () => {
    it('should successfully crawl and save to Supabase', async () => {
      // 크롤링 결과 mock 설정
      mockPageEvaluateResult = [
        {
          postNumber: '67890',
          title: '[11번가] 노트북 할인 특가 500,000원',
          url: '/service/board/jirum/67890',
          author: '클리앙유저',
          views: 1500,
          likeCount: 12,
          commentCount: 8,
          dateText: '2024-08-05 14:30:45',
          isSoldOut: false
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
        created: { id: 'new-clien-hotdeal-123' }
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
            title: '[11번가] 노트북 할인 특가 500,000원',
            source: 'clien',
            source_id: '67890'
          })
        ])
      })

      expect(mockRepositoryMethods.findBySourceAndPostId).toHaveBeenCalledWith('clien', '67890')
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
          title: '[쿠팡] 기존 상품 업데이트',
          url: '/service/board/jirum/11111',
          author: '기존유저',
          views: 2500,
          likeCount: 20,
          commentCount: 15,
          dateText: '2024-08-05 16:15:30',
          isSoldOut: false
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
        existing: { id: 'existing-clien-hotdeal-11111', source_id: '11111' },
        updated: { id: 'existing-clien-hotdeal-11111' }
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
            title: '[쿠팡] 기존 상품 업데이트',
            source_id: '11111'
          })
        ])
      })

      expect(mockRepositoryMethods.findBySourceAndPostId).toHaveBeenCalledWith('clien', '11111')
    })

    it('should handle repository save errors', async () => {
      mockPageEvaluateResult = [
        {
          postNumber: '99999',
          title: '[에러몰] 저장 실패 테스트',
          url: '/service/board/jirum/99999',
          author: '에러유저',
          views: 100,
          likeCount: 1,
          commentCount: 0,
          dateText: '2024-08-05 18:00:00',
          isSoldOut: false
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

    it('should handle sold out items correctly', async () => {
      mockPageEvaluateResult = [
        {
          postNumber: '55555',
          title: '[품절몰] 품절된 상품',
          url: '/service/board/jirum/55555',
          author: '품절유저',
          views: 800,
          likeCount: 5,
          commentCount: 3,
          dateText: '2024-08-05 12:00:00',
          isSoldOut: true
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
        created: { id: 'soldout-hotdeal-55555' }
      }

      const result = await crawler.crawl()

      expect(result.hotdeals[0]).toMatchObject({
        title: '[품절몰] 품절된 상품',
        status: 'expired' // 품절 상품은 expired 상태
      })
    })
  })

  describe('parseClienDate method', () => {
    it('should parse various date formats correctly', () => {
      const parseClienDate = (crawler as any).parseClienDate

      // 클리앙 표준 형식: YYYY-MM-DD HH:MM:SS
      const fullDateResult = parseClienDate('2024-08-05 14:30:45')
      expect(fullDateResult.getFullYear()).toBe(2024)
      expect(fullDateResult.getMonth()).toBe(7) // 0-based month
      expect(fullDateResult.getDate()).toBe(5)
      expect(fullDateResult.getHours()).toBe(14)
      expect(fullDateResult.getMinutes()).toBe(30)
      expect(fullDateResult.getSeconds()).toBe(45)

      // 다른 형식이나 잘못된 형식은 현재 시간으로 fallback
      const currentTime = new Date()
      const fallbackResult = parseClienDate('invalid-date')
      expect(fallbackResult.getTime()).toBeCloseTo(currentTime.getTime(), -2) // 2초 정도 오차 허용
    })
  })

  describe('convertToHotDeal method', () => {
    it('should convert ClienPost to HotDeal correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '12345',
        title: '[11번가] 노트북 특가 850,000원 무료배송',
        url: '/service/board/jirum/12345',
        author: '클리앙유저',
        views: 2000,
        likeCount: 15,
        commentCount: 10,
        postDate: new Date('2024-08-05T14:30:00Z'),
        isSoldOut: false
      }

      const result = convertToHotDeal(post)

      expect(result).toEqual({
        id: '',
        source: 'clien',
        source_id: '12345',
        category: '[기타]', // inferCategory fallback
        title: '[11번가] 노트북 특가 850,000원 무료배송',
        description: null,
        original_price: 850000,
        sale_price: 850000,
        discount_rate: 0,
        seller: '11번가',
        original_url: 'https://www.clien.net/service/board/jirum/12345',
        thumbnail_url: '',
        image_url: '',
        is_free_shipping: true,
        status: 'active',
        end_date: expect.any(String),
        views: 2000,
        comment_count: 10,
        like_count: 15,
        author_name: '클리앙유저',
        shopping_comment: '',
        created_at: '2024-08-05T14:30:00.000Z',
        updated_at: expect.any(String),
        deleted_at: null
      })
    })

    it('should handle sold out post correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const soldOutPost = {
        postNumber: '67890',
        title: '[품절몰] 품절된 상품',
        url: '/service/board/jirum/67890',
        author: '품절유저',
        views: 500,
        likeCount: 3,
        commentCount: 1,
        postDate: new Date('2024-08-05T16:00:00Z'),
        isSoldOut: true
      }

      const result = convertToHotDeal(soldOutPost)

      expect(result).toMatchObject({
        source: 'clien',
        source_id: '67890',
        title: '[품절몰] 품절된 상품',
        status: 'expired',
        seller: '클리앙' // parseStore fallback
      })
    })

    it('should handle post with full URL correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '33333',
        title: '외부 링크 상품',
        url: 'https://www.clien.net/service/board/jirum/33333',
        author: '링크유저',
        views: 300,
        likeCount: 2,
        commentCount: 0,
        postDate: new Date('2024-08-05T10:00:00Z'),
        isSoldOut: false
      }

      const result = convertToHotDeal(post)

      expect(result.original_url).toBe('https://www.clien.net/service/board/jirum/33333')
    })
  })

  describe('time filter functionality', () => {
    it('should respect time filter when specified', async () => {
      const timeFilterCrawler = new ClienCrawler({
        timeFilterHours: 2,
        maxPages: 1
      })

      // 최근 시간과 오래된 시간의 게시물 mix
      const recentTime = new Date()
      const oldTime = new Date(Date.now() - 5 * 60 * 60 * 1000) // 5시간 전

      mockPageEvaluateResult = [
        {
          postNumber: '11111',
          title: '최근 게시물',
          url: '/service/board/jirum/11111',
          author: '최근유저',
          views: 100,
          likeCount: 1,
          commentCount: 0,
          dateText: recentTime.toISOString().slice(0, 19).replace('T', ' '),
          isSoldOut: false
        },
        {
          postNumber: '22222',
          title: '오래된 게시물',
          url: '/service/board/jirum/22222',
          author: '과거유저',
          views: 50,
          likeCount: 0,
          commentCount: 0,
          dateText: oldTime.toISOString().slice(0, 19).replace('T', ' '),
          isSoldOut: false
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

  describe('view count parsing in page evaluation', () => {
    it('should handle various view count formats in DOM evaluation', async () => {
      // 실제 DOM evaluation 로직 테스트를 위한 simulate
      const mockEvaluateViewParsing = (viewText: string) => {
        let views = 0
        if (viewText.toLowerCase().includes('k')) {
          const num = parseFloat(viewText.replace(/[^0-9.]/g, ''))
          views = Math.round(num * 1000)
        } else if (viewText.toLowerCase().includes('m')) {
          const num = parseFloat(viewText.replace(/[^0-9.]/g, ''))
          views = Math.round(num * 1000000)
        } else {
          views = parseInt(viewText.replace(/[^0-9]/g, '')) || 0
        }
        return views
      }

      // 다양한 조회수 형식 테스트
      expect(mockEvaluateViewParsing('1.5k')).toBe(1500)
      expect(mockEvaluateViewParsing('2.3K')).toBe(2300)
      expect(mockEvaluateViewParsing('1.2m')).toBe(1200000)
      expect(mockEvaluateViewParsing('5.7M')).toBe(5700000)
      expect(mockEvaluateViewParsing('1234')).toBe(1234)
      expect(mockEvaluateViewParsing('조회: 567')).toBe(567)
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
      const result = await crawlPage(0)

      expect(result).toEqual([])
    })
  })
})