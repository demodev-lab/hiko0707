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
import { RuliwebCrawler } from '@/lib/crawlers/ruliweb-crawler'

describe('RuliwebCrawler', () => {
  let crawler: RuliwebCrawler

  beforeEach(() => {
    vi.clearAllMocks()
    mockPageResult = null
    mockBrowserInitialized = true
    mockPageNavigation = null
    mockPageEvaluateResult = null
    mockRepositoryResult = null
    
    // Reset mock repository methods
    Object.values(mockRepositoryMethods).forEach(mock => mock.mockClear())
    
    crawler = new RuliwebCrawler({
      headless: true,
      maxPages: 2,
      delay: 100
    })
  })

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultCrawler = new RuliwebCrawler()
      expect(defaultCrawler).toBeInstanceOf(RuliwebCrawler)
    })

    it('should initialize with custom options', () => {
      const customCrawler = new RuliwebCrawler({
        headless: false,
        maxPages: 5,
        delay: 2000,
        timeout: 30000,
        timeFilterHours: 12,
        onProgress: vi.fn()
      })
      expect(customCrawler).toBeInstanceOf(RuliwebCrawler)
    })
  })

  describe('getSourceName', () => {
    it('should return ruliweb as source name', () => {
      // Protected 메서드에 대한 접근을 위한 타입 단언
      const sourceName = (crawler as any).getSourceName()
      expect(sourceName).toBe('ruliweb')
    })
  })

  describe('crawl method', () => {
    it('should successfully crawl and save to Supabase with detail page content', async () => {
      // 기본 게시물 목록 mock 설정
      mockPageEvaluateResult = [
        {
          postNumber: '987654',
          title: '[삼성] 갤럭시 S24 Ultra 특가',
          url: 'https://bbs.ruliweb.com/market/board/1020/read/987654',
          author: '루리웹유저',
          category: '스마트폰',
          recommendCount: 15,
          views: 2500,
          commentCount: 8,
          dateStr: '2025.07.30'
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        // 페이지별로 다른 결과 반환 (목록 페이지 vs 상세 페이지)
        let callCount = 0
        vi.mocked(mockPage.evaluate).mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            // 첫 번째 호출: 게시물 목록
            return Promise.resolve(mockPageEvaluateResult)
          } else {
            // 두 번째 호출: 상세 페이지 내용
            return Promise.resolve({
              content: '삼성 갤럭시 S24 Ultra 특가 판매합니다. 새 제품이고 할인가로 제공됩니다.',
              images: ['https://example.com/galaxy-s24-ultra.jpg']
            })
          }
        })
        
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      // Repository mock 설정 - 신규 추가 시나리오
      mockRepositoryResult = {
        existing: null,
        created: { id: 'new-ruliweb-hotdeal-987654' }
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
            title: '[삼성] 갤럭시 S24 Ultra 특가',
            source: 'ruliweb',
            source_id: '987654',
            description: '삼성 갤럭시 S24 Ultra 특가 판매합니다. 새 제품이고 할인가로 제공됩니다.',
            image_url: 'https://example.com/galaxy-s24-ultra.jpg'
          })
        ])
      })

      expect(mockRepositoryMethods.findBySourceAndPostId).toHaveBeenCalledWith('ruliweb', '987654')
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
          title: '[LG] 모니터 업데이트',
          url: 'https://bbs.ruliweb.com/market/board/1020/read/11111',
          author: '기존유저',
          category: '모니터',
          recommendCount: 20,
          views: 3500,
          commentCount: 15,
          dateStr: '14:30'
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        let callCount = 0
        vi.mocked(mockPage.evaluate).mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve(mockPageEvaluateResult)
          } else {
            return Promise.resolve({
              content: 'LG 모니터 특가 정보입니다.',
              images: []
            })
          }
        })
        
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      // Repository mock 설정 - 업데이트 시나리오
      mockRepositoryResult = {
        existing: { id: 'existing-ruliweb-hotdeal-11111', source_id: '11111' },
        updated: { id: 'existing-ruliweb-hotdeal-11111' }
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
            title: '[LG] 모니터 업데이트',
            source_id: '11111'
          })
        ])
      })

      expect(mockRepositoryMethods.findBySourceAndPostId).toHaveBeenCalledWith('ruliweb', '11111')
    })

    it('should handle detail page fetch errors gracefully', async () => {
      mockPageEvaluateResult = [
        {
          postNumber: '99999',
          title: '[에러몰] 상세페이지 오류 테스트',
          url: 'https://bbs.ruliweb.com/market/board/1020/read/99999',
          author: '에러유저',
          category: '기타',
          recommendCount: 1,
          views: 100,
          commentCount: 0,
          dateStr: '07-30'
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        let callCount = 0
        vi.mocked(mockPage.evaluate).mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve(mockPageEvaluateResult)
          } else {
            // 상세 페이지에서 에러 발생
            return Promise.reject(new Error('Detail page fetch failed'))
          }
        })
        
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      mockRepositoryResult = {
        existing: null,
        created: { id: 'error-hotdeal-99999' }
      }

      const result = await crawler.crawl()

      // 상세 페이지 오류가 있어도 기본 정보로 핫딜은 생성되어야 함
      expect(result.totalCrawled).toBe(1)
      expect(result.hotdeals[0]).toMatchObject({
        title: '[에러몰] 상세페이지 오류 테스트',
        description: '' // 상세 정보 없음
      })
    })

    it('should handle short content warning', async () => {
      mockPageEvaluateResult = [
        {
          postNumber: '55555',
          title: '[짧은몰] 짧은 내용',
          url: 'https://bbs.ruliweb.com/market/board/1020/read/55555',
          author: '짧은유저',
          category: '기타',
          recommendCount: 2,
          views: 200,
          commentCount: 1,
          dateStr: '12:00'
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        let callCount = 0
        vi.mocked(mockPage.evaluate).mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve(mockPageEvaluateResult)
          } else {
            // 매우 짧은 콘텐츠
            return Promise.resolve({
              content: '짧음',
              images: []
            })
          }
        })
        
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      mockRepositoryResult = {
        existing: null,
        created: { id: 'short-content-hotdeal-55555' }
      }

      const result = await crawler.crawl()

      expect(result.hotdeals[0]).toMatchObject({
        title: '[짧은몰] 짧은 내용',
        description: '짧음' // 짧은 콘텐츠도 저장됨
      })
    })
  })

  describe('parseRuliwebDate method', () => {
    it('should parse various date formats correctly', () => {
      const parseRuliwebDate = (crawler as any).parseRuliwebDate

      // 전체 날짜 형식: "2025.07.30"
      const fullDateResult = parseRuliwebDate('2025.07.30')
      expect(fullDateResult.getFullYear()).toBe(2025)
      expect(fullDateResult.getMonth()).toBe(6) // 0-based month (July)
      expect(fullDateResult.getDate()).toBe(30)

      // 시간만 형식: "14:30" (오늘 날짜)
      const timeOnlyResult = parseRuliwebDate('14:30')
      expect(timeOnlyResult.getHours()).toBe(14)
      expect(timeOnlyResult.getMinutes()).toBe(30)

      // 월-일 형식: "07-30" (올해)
      const monthDayResult = parseRuliwebDate('07-30')
      const currentYear = new Date().getFullYear()
      expect(monthDayResult.getFullYear()).toBe(currentYear)
      expect(monthDayResult.getMonth()).toBe(6) // 0-based month (July)
      expect(monthDayResult.getDate()).toBe(30)

      // 슬래시 형식: "07/30"
      const slashDateResult = parseRuliwebDate('07/30')
      expect(slashDateResult.getFullYear()).toBe(currentYear)
      expect(slashDateResult.getMonth()).toBe(6)
      expect(slashDateResult.getDate()).toBe(30)

      // 점 형식: "07.30"
      const dotDateResult = parseRuliwebDate('07.30')
      expect(dotDateResult.getFullYear()).toBe(currentYear)
      expect(dotDateResult.getMonth()).toBe(6)
      expect(dotDateResult.getDate()).toBe(30)

      // 잘못된 형식은 현재 시간으로 fallback
      const currentTime = new Date()
      const fallbackResult = parseRuliwebDate('invalid-date')
      expect(fallbackResult.getTime()).toBeCloseTo(currentTime.getTime(), -2) // 2초 정도 오차 허용
    })
  })

  describe('parseRuliwebStore method', () => {
    it('should extract store name from title correctly', () => {
      const parseRuliwebStore = (crawler as any).parseRuliwebStore

      // [상점명] 형식
      expect(parseRuliwebStore('[삼성] 갤럭시 S24 특가')).toBe('삼성')
      expect(parseRuliwebStore('[애플] 아이폰 15 할인')).toBe('애플')
      expect(parseRuliwebStore('[LG전자] 모니터 세일')).toBe('LG전자')

      // 상점명이 없는 경우
      expect(parseRuliwebStore('갤럭시 S24 특가')).toBeNull()
      expect(parseRuliwebStore('일반 제목')).toBeNull()

      // 빈 대괄호
      expect(parseRuliwebStore('[] 빈 상점명')).toBe('')
      
      // 여러 대괄호가 있는 경우 첫 번째 것만 추출
      expect(parseRuliwebStore('[삼성] [할인] 갤럭시 특가')).toBe('삼성')
    })
  })

  describe('convertToHotDeal method', () => {
    it('should convert RuliwebPost to HotDeal correctly', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '123456',
        title: '[애플] MacBook Pro M3 특가 2,500,000원 무료배송',
        url: 'https://bbs.ruliweb.com/market/board/1020/read/123456',
        author: '루리웹유저',
        category: '노트북',
        views: 3000,
        recommendCount: 25,
        commentCount: 15,
        postDate: new Date('2025-08-05T14:30:00Z')
      }

      const detail = {
        content: 'MacBook Pro M3 특가 판매합니다. 새 제품이고 정품입니다.',
        images: ['https://example.com/macbook-pro-m3.jpg', 'https://example.com/macbook-box.jpg']
      }

      const result = convertToHotDeal(post, detail)

      expect(result).toEqual({
        id: expect.any(String), // generateId로 생성된 ID
        title: '[애플] MacBook Pro M3 특가 2,500,000원 무료배송',
        sale_price: 2500000,
        seller: '애플',
        category: expect.any(String), // inferCategory 결과
        original_url: 'https://bbs.ruliweb.com/market/board/1020/read/123456',
        image_url: 'https://example.com/macbook-pro-m3.jpg', // 첫 번째 이미지
        thumbnail_url: 'https://example.com/macbook-pro-m3.jpg', // 루리웹은 썸네일과 원본이 동일
        source: 'ruliweb',
        source_id: '123456',
        created_at: '2025-08-05T14:30:00.000Z',
        author_name: '루리웹유저',
        comment_count: 15,
        like_count: 25,
        description: 'MacBook Pro M3 특가 판매합니다. 새 제품이고 정품입니다.',
        status: 'active',
        views: 3000,
        original_price: 2500000,
        discount_rate: 0,
        end_date: expect.any(String),
        shopping_comment: '',
        is_free_shipping: true,
        updated_at: expect.any(String),
        deleted_at: null
      })
    })

    it('should handle post without detail content', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '654321',
        title: '상세정보 없는 상품',
        url: 'https://bbs.ruliweb.com/market/board/1020/read/654321',
        author: '일반유저',
        category: '기타',
        views: 500,
        recommendCount: 5,
        commentCount: 3,
        postDate: new Date('2025-08-05T10:00:00Z')
      }

      const result = convertToHotDeal(post) // detail 정보 없음

      expect(result).toMatchObject({
        source: 'ruliweb',
        source_id: '654321',
        title: '상세정보 없는 상품',
        description: '',
        image_url: '',
        thumbnail_url: '',
        seller: '알 수 없음' // parseRuliwebStore fallback
      })
    })

    it('should handle post with store extraction and no images', () => {
      const convertToHotDeal = (crawler as any).convertToHotDeal

      const post = {
        postNumber: '111111',
        title: '[쿠팡] 생활용품 세트 29,900원',
        url: 'https://bbs.ruliweb.com/market/board/1020/read/111111',
        author: '쿠팡유저',
        category: '생활용품',
        views: 1200,
        recommendCount: 12,
        commentCount: 8,
        postDate: new Date('2025-08-05T16:00:00Z')
      }

      const detail = {
        content: '쿠팡에서 생활용품 세트를 특가로 판매합니다.',
        images: [] // 이미지 없음
      }

      const result = convertToHotDeal(post, detail)

      expect(result).toMatchObject({
        seller: '쿠팡', // [쿠팡]에서 추출
        sale_price: 29900,
        image_url: '', // 이미지 없으므로 빈 문자열
        thumbnail_url: '',
        description: '쿠팡에서 생활용품 세트를 특가로 판매합니다.'
      })
    })
  })

  describe('time filter functionality', () => {
    it('should respect time filter when specified', async () => {
      const timeFilterCrawler = new RuliwebCrawler({
        timeFilterHours: 2,
        maxPages: 1
      })

      // 최근 시간과 오래된 시간의 게시물 mix
      mockPageEvaluateResult = [
        {
          postNumber: '11111',
          title: '최근 게시물',
          url: 'https://bbs.ruliweb.com/market/board/1020/read/11111',
          author: '최근유저',
          category: '기타',
          recommendCount: 1,
          views: 100,
          commentCount: 0,
          dateStr: '14:30' // 오늘 오후 (최근)
        },
        {
          postNumber: '22222',
          title: '오래된 게시물',
          url: 'https://bbs.ruliweb.com/market/board/1020/read/22222',
          author: '과거유저',
          category: '기타',
          recommendCount: 0,
          views: 50,
          commentCount: 0,
          dateStr: '2025.07.28' // 며칠 전 (오래됨)
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        let callCount = 0
        vi.mocked(mockPage.evaluate).mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve(mockPageEvaluateResult)
          } else {
            // 첫 번째 게시물의 상세 내용만 (시간 필터링으로 두 번째는 처리 안됨)
            return Promise.resolve({
              content: '최근 게시물 내용입니다.',
              images: []
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

    it('should stop crawling after consecutive old posts', async () => {
      const timeFilterCrawler = new RuliwebCrawler({
        timeFilterHours: 1,
        maxPages: 1
      })

      // 연속으로 오래된 게시물들
      const oldDate = '2025.07.28'
      mockPageEvaluateResult = Array.from({ length: 6 }, (_, i) => ({
        postNumber: `old-${i + 1}`,
        title: `오래된 게시물 ${i + 1}`,
        url: `https://bbs.ruliweb.com/market/board/1020/read/old-${i + 1}`,
        author: '과거유저',
        category: '기타',
        recommendCount: 0,
        views: 50,
        commentCount: 0,
        dateStr: oldDate
      }))

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.evaluate).mockResolvedValue(mockPageEvaluateResult)
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      const result = await timeFilterCrawler.crawl()

      // 연속 5개 오래된 게시물 발견 시 크롤링 중단되므로 아무것도 수집되지 않아야 함
      expect(result.totalCrawled).toBe(0)
      expect(result.hotdeals).toHaveLength(0)
    })
  })

  describe('progress callback functionality', () => {
    it('should call progress callback with correct parameters', async () => {
      const onProgressMock = vi.fn()
      const progressCrawler = new RuliwebCrawler({
        maxPages: 1,
        onProgress: onProgressMock
      })

      mockPageEvaluateResult = [
        {
          postNumber: '123',
          title: '진행도 테스트',
          url: 'https://bbs.ruliweb.com/market/board/1020/read/123',
          author: '테스트유저',
          category: '기타',
          recommendCount: 1,
          views: 100,
          commentCount: 0,
          dateStr: '14:30'
        }
      ]

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        let callCount = 0
        vi.mocked(mockPage.evaluate).mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve(mockPageEvaluateResult)
          } else {
            return Promise.resolve({
              content: '진행도 테스트 내용',
              images: []
            })
          }
        })
        
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      mockRepositoryResult = {
        existing: null,
        created: { id: 'progress-test-hotdeal' }
      }

      await progressCrawler.crawl()

      // onProgress가 호출되었는지 확인
      expect(onProgressMock).toHaveBeenCalled()
      
      // 마지막 호출이 완료 메시지와 함께 이루어졌는지 확인
      const lastCall = onProgressMock.mock.calls[onProgressMock.mock.calls.length - 1]
      expect(lastCall[2]).toContain('루리웹 크롤링 완료')
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

    it('should handle page navigation retry', async () => {
      mockPageEvaluateResult = []

      // 첫 번째 시도는 실패, 두 번째 시도는 성공
      let navigationAttempts = 0
      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        vi.mocked(mockPage.goto).mockImplementation(() => {
          navigationAttempts++
          if (navigationAttempts === 1) {
            return Promise.reject(new Error('First navigation failed'))
          }
          return Promise.resolve()
        })
        
        vi.mocked(mockPage.evaluate).mockResolvedValue([])
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      const result = await crawler.crawl()

      // 재시도 후 성공적으로 완료되어야 함
      expect(result.totalCrawled).toBe(0)
      expect(navigationAttempts).toBe(2) // 첫 시도 실패 + 재시도 성공
    })
  })

  describe('getPostDetail method edge cases', () => {
    it('should handle detail page navigation failure', async () => {
      const getPostDetail = (crawler as any).getPostDetail

      const post = {
        postNumber: '999',
        title: '상세페이지 실패 테스트',
        url: 'https://bbs.ruliweb.com/market/board/1020/read/999',
        author: '실패유저',
        category: '기타',
        recommendCount: 0,
        views: 10,
        commentCount: 0,
        postDate: new Date()
      }

      vi.mocked(mockChromium.launch).mockImplementation(() => {
        const mockBrowser = createMockBrowser()
        const mockContext = createMockContext()
        const mockPage = createMockPage()
        
        // 상세 페이지 navigation 실패
        vi.mocked(mockPage.goto).mockRejectedValue(new Error('Detail page navigation failed'))
        vi.mocked(mockContext.newPage).mockResolvedValue(mockPage)
        vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext)
        
        return Promise.resolve(mockBrowser)
      })

      await crawler.crawl() // initialize

      const result = await getPostDetail(post)

      // 실패 시 빈 content와 images 반환
      expect(result).toEqual({
        content: '',
        images: []
      })
    })
  })
})