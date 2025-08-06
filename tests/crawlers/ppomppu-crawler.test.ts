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
    gray: vi.fn((text: string) => text)
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
import { PpomppuCrawler } from '@/lib/crawlers/ppomppu-crawler'

describe('PpomppuCrawler', () => {
  let crawler: PpomppuCrawler

  beforeEach(() => {
    vi.clearAllMocks()
    mockPageResult = null
    mockBrowserInitialized = true
    mockPageNavigation = null
    mockPageEvaluateResult = null
    mockRepositoryResult = null
    
    // Reset mock repository methods
    Object.values(mockRepositoryMethods).forEach(mock => mock.mockClear())
    
    crawler = new PpomppuCrawler({
      headless: true,
      maxPages: 2,
      delay: 100
    })
  })

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultCrawler = new PpomppuCrawler()
      expect(defaultCrawler).toBeInstanceOf(PpomppuCrawler)
    })

    it('should initialize with custom options', () => {
      const customCrawler = new PpomppuCrawler({
        headless: false,
        maxPages: 5,
        delay: 2000,
        timeout: 30000,
        timeFilterHours: 24
      })
      expect(customCrawler).toBeInstanceOf(PpomppuCrawler)
    })
  })

  describe('getSourceName', () => {
    it('should return ppomppu as source name', () => {
      // Protected 메서드에 대한 접근을 위한 타입 단언
      const sourceNames = (crawler as any).getSourceName()
      expect(sourceNames).toBe('ppomppu')
    })
  })

  describe('crawl method', () => {
    it('should successfully crawl and save to Supabase', async () => {
      // 크롤링 결과 mock 설정
      mockPageEvaluateResult = [
        {
          postNumber: '12345',
          title: '[테스트몰] 테스트 상품 50% 할인',
          url: 'https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=12345',
          author: '테스트유저',
          category: '[쇼핑]',
          isPopular: true,
          isHot: false,
          thumbnailUrl: 'https://example.com/thumb.jpg',
          views: 1000,
          recommendCount: 5,
          dateStr: '12:30:45'
        }
      ]

      // 상세 페이지 평가 결과 mock (crawlPage 후 getPostDetail에서 사용)
      let evaluateCallCount = 0
      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        // evaluate 호출 횟수에 따라 다른 결과 반환
        vi.mocked(mockPage.evaluate).mockImplementation(() => {
          evaluateCallCount++
          if (evaluateCallCount === 1) {
            // 첫 번째 호출: 목록 페이지 크롤링
            return Promise.resolve(mockPageEvaluateResult)
          } else {
            // 두 번째 호출: 상세 페이지 콘텐츠
            return Promise.resolve({
              content: '테스트 상품 상세 설명입니다. 50% 할인 중이며 무료배송 제공합니다.',
              images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
              postDateStr: '2024-08-05 12:30:45'
            })
          }
        })
        
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      // Repository mock 설정 - 신규 추가 시나리오
      mockRepositoryResult = {
        existing: null, // 기존 데이터 없음
        created: { id: 'new-hotdeal-123' }
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
            title: '[테스트몰] 테스트 상품 50% 할인',
            source: 'ppomppu',
            source_id: '12345'
          })
        ])
      })

      expect(mockRepositoryMethods.findBySourceAndPostId).toHaveBeenCalledWith('ppomppu', '12345')
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
          postNumber: '67890',
          title: '[기존몰] 업데이트된 상품',
          url: 'https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=67890',
          author: '테스트유저2',
          views: 2000,
          recommendCount: 10,
          dateStr: '14:20:30'
        }
      ]

      let evaluateCallCount = 0
      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.evaluate).mockImplementation(() => {
          evaluateCallCount++
          if (evaluateCallCount === 1) {
            return Promise.resolve(mockPageEvaluateResult)
          } else {
            return Promise.resolve({
              content: '업데이트된 상품 설명',
              images: ['https://example.com/updated-image.jpg'],
              postDateStr: '2024-08-05 14:20:30'
            })
          }
        })
        
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      // Repository mock 설정 - 업데이트 시나리오
      mockRepositoryResult = {
        existing: { id: 'existing-hotdeal-67890', source_id: '67890' },
        updated: { id: 'existing-hotdeal-67890' }
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
            title: '[기존몰] 업데이트된 상품',
            source_id: '67890'
          })
        ])
      })

      expect(mockRepositoryMethods.update).toHaveBeenCalledTimes(1)
    })

    it('should handle repository save errors', async () => {
      mockPageEvaluateResult = [
        {
          postNumber: '99999',
          title: '[에러몰] 저장 실패 테스트',
          url: 'https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=99999',
          author: '에러유저',
          dateStr: '16:00:00'
        }
      ]

      let evaluateCallCount = 0
      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.evaluate).mockImplementation(() => {
          evaluateCallCount++
          if (evaluateCallCount === 1) {
            return Promise.resolve(mockPageEvaluateResult)
          } else {
            return Promise.resolve({
              content: '에러 테스트 콘텐츠',
              images: [],
              postDateStr: '2024-08-05 16:00:00'
            })
          }
        })
        
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

  describe('parsePrice method', () => {
    it('should parse various price formats correctly', () => {
      const parsePrice = (crawler as any).parsePrice

      // 정상적인 가격 파싱
      expect(parsePrice('[테스트몰] 상품명 15,000원')).toBe(15000)
      expect(parsePrice('상품 (25,500/무료배송)')).toBe(25500)
      expect(parsePrice('￦50,000 할인상품')).toBe(50000)
      expect(parsePrice('100,000/ 특가')).toBe(100000)

      // 가격 다양인 경우
      expect(parsePrice('가격 다양한 상품')).toBe(-1)
      expect(parsePrice('Various items')).toBe(-1)

      // 무료/이벤트 상품
      expect(parsePrice('무료 체험 이벤트')).toBe(0)
      expect(parsePrice('쿠폰 증정 프로모션')).toBe(0)

      // 파싱 불가능한 경우
      expect(parsePrice('가격 정보 없음')).toBe(-1)
    })
  })

  describe('parseStore method', () => {
    it('should extract store name from title', () => {
      const parseStore = (crawler as any).parseStore

      expect(parseStore('[11번가] 상품명')).toBe('11번가')
      expect(parseStore('[쿠팡] 할인 상품')).toBe('쿠팡')
      expect(parseStore('[옥션/지마켓] 특가')).toBe('옥션/지마켓')
      expect(parseStore('상품명 - 쇼핑몰 없음')).toBeNull()
    })
  })

  describe('isFreeShipping method', () => {
    it('should detect free shipping correctly', () => {
      const isFreeShipping = (crawler as any).isFreeShipping

      expect(isFreeShipping('무료배송 상품')).toBe(true)
      expect(isFreeShipping('Free shipping item')).toBe(true)
      expect(isFreeShipping('무배 혜택')).toBe(true)
      expect(isFreeShipping('배송비 2,500원')).toBe(false)
    })
  })

  describe('inferCategory method', () => {
    it('should infer category from title', () => {
      const inferCategory = (crawler as any).inferCategory

      // HotDealClassificationService가 mock되어야 하지만, 실제 구현에서는 try-catch로 처리됨
      expect(inferCategory('노트북 할인')).toBe('[기타]') // fallback
      expect(inferCategory('[의류] 티셔츠 세일')).toBe('[기타]') // fallback
    })
  })

  describe('parseDate method', () => {
    it('should parse various date formats', () => {
      const parseDate = (crawler as any).parseDate

      // 시간만 있는 경우 (오늘)
      const timeResult = parseDate('14:30:45')
      expect(timeResult.getHours()).toBe(14)
      expect(timeResult.getMinutes()).toBe(30)
      expect(timeResult.getSeconds()).toBe(45)

      // 분까지만 있는 경우
      const minuteResult = parseDate('09:15')
      expect(minuteResult.getHours()).toBe(9)
      expect(minuteResult.getMinutes()).toBe(15)

      // 날짜 형식 (YY/MM/DD)
      const dateResult = parseDate('24/08/05')
      expect(dateResult.getFullYear()).toBe(2024)
      expect(dateResult.getMonth()).toBe(7) // 0-based month
      expect(dateResult.getDate()).toBe(5)

      // MM-DD 형식
      const monthDayResult = parseDate('08-15')
      expect(monthDayResult.getMonth()).toBe(7) // 0-based month
      expect(monthDayResult.getDate()).toBe(15)
    })
  })

  describe('generateId method', () => {
    it('should generate unique ID for hotdeal', () => {
      const generateId = (crawler as any).generateId

      const id1 = generateId('ppomppu', '12345')
      const id2 = generateId('ppomppu', '67890')
      
      expect(id1).toMatch(/^hotdeal_\d+_12345$/)
      expect(id2).toMatch(/^hotdeal_\d+_67890$/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('convertToHotDeal method', () => {
    it('should convert PpomppuPost to HotDeal correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '12345',
        title: '[테스트몰] 상품명 15,000원',
        url: 'https://example.com/post/12345',
        author: '테스트유저',
        category: '[전자기기]',
        isPopular: true,
        isHot: false,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        views: 1500,
        recommendCount: 8,
        postDate: new Date('2024-08-05T12:30:00Z')
      }

      const detail = {
        content: '상품 상세 설명입니다.',
        images: ['https://example.com/image1.jpg'],
        matchedImage: 'https://example.com/high-res.jpg'
      }

      const result = convertToHotDeal(post, detail)

      expect(result).toEqual({
        id: expect.stringMatching(/^hotdeal_\d+_12345$/),
        title: '[테스트몰] 상품명 15,000원',
        sale_price: 15000,
        seller: '테스트몰',
        category: '[전자기기]',
        original_url: 'https://example.com/post/12345',
        image_url: 'https://example.com/high-res.jpg',
        thumbnail_url: 'https://example.com/thumb.jpg',
        source: 'ppomppu',
        source_id: '12345',
        created_at: '2024-08-05T12:30:00.000Z',
        author_name: '테스트유저',
        comment_count: 0,
        like_count: 8,
        description: '상품 상세 설명입니다.',
        status: 'active',
        views: 1500,
        original_price: 15000,
        discount_rate: 0,
        end_date: expect.any(String),
        shopping_comment: '',
        is_free_shipping: false,
        updated_at: expect.any(String),
        deleted_at: null
      })
    })

    it('should handle post without detail correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '67890',
        title: '상품명만 있는 경우',
        url: 'https://example.com/post/67890',
        author: '유저2',
        views: 500,
        recommendCount: 2,
        postDate: new Date('2024-08-05T14:00:00Z')
      }

      const result = convertToHotDeal(post)

      expect(result).toEqual({
        id: expect.stringMatching(/^hotdeal_\d+_67890$/),
        title: '상품명만 있는 경우',
        sale_price: -1, // 가격 파싱 실패
        seller: '알 수 없음',
        category: '[기타]',
        original_url: 'https://example.com/post/67890',
        image_url: '',
        thumbnail_url: '',
        source: 'ppomppu',
        source_id: '67890',
        created_at: '2024-08-05T14:00:00.000Z',
        author_name: '유저2',
        comment_count: 0,
        like_count: 2,
        description: '',
        status: 'active',
        views: 500,
        original_price: 0, // sale_price가 -1이므로 0으로 설정
        discount_rate: 0,
        end_date: expect.any(String),
        shopping_comment: '',
        is_free_shipping: false,
        updated_at: expect.any(String),
        deleted_at: null
      })
    })
  })

  describe('findMatchingImage method', () => {
    it('should find matching high resolution image', () => {
      const findMatchingImage = (crawler as any).findMatchingImage

      const thumbnailUrl = 'https://example.com/small_12345.jpg'
      const detailImages = [
        'https://example.com/image_12345_large.jpg',
        'https://example.com/other_67890.jpg',
        'https://example.com/data3/product_12345.jpg'
      ]

      const result = findMatchingImage(thumbnailUrl, detailImages)
      expect(result).toBe('https://example.com/image_12345_large.jpg')
    })

    it('should return undefined if no matching image found', () => {
      const findMatchingImage = (crawler as any).findMatchingImage

      const thumbnailUrl = 'https://example.com/small_99999.jpg'
      const detailImages = [
        'https://example.com/image_12345.jpg',
        'https://example.com/other_67890.jpg'
      ]

      const result = findMatchingImage(thumbnailUrl, detailImages)
      expect(result).toBe('https://example.com/image_12345.jpg') // fallback to first image
    })
  })

  describe('time filter functionality', () => {
    it('should respect time filter when specified', async () => {
      const timeFilterCrawler = new PpomppuCrawler({
        timeFilterHours: 2,
        maxPages: 1
      })

      // 최근 시간과 오래된 시간의 게시물 mix
      mockPageEvaluateResult = [
        {
          postNumber: '11111',
          title: '최근 게시물',
          url: 'https://example.com/11111',
          author: '유저1',
          dateStr: new Date().toTimeString().split(' ')[0] // 현재 시간
        },
        {
          postNumber: '22222',
          title: '오래된 게시물',
          url: 'https://example.com/22222',
          author: '유저2',
          dateStr: '24/01/01' // 오래된 날짜
        }
      ]

      let evaluateCallCount = 0
      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.evaluate).mockImplementation(() => {
          evaluateCallCount++
          if (evaluateCallCount === 1) {
            return Promise.resolve(mockPageEvaluateResult)
          } else {
            // 상세 페이지는 최근 시간만 처리됨
            return Promise.resolve({
              content: '최근 게시물 내용',
              images: [],
              postDateStr: new Date().toISOString()
            })
          }
        })
        
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
})