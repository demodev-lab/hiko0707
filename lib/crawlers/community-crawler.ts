import { CrawledHotDeal, BaseCrawler, CrawlerResult } from './types'
import { PlaywrightWrapper } from './playwright-wrapper'

// 커뮤니티별 크롤러가 구현해야 할 인터페이스
export interface CommunitySelectors {
  // 목록 페이지 셀렉터
  listRows: string        // 게시물 목록 행
  nextPageButton?: string // 다음 페이지 버튼
  pageNumber?: string     // 현재 페이지 번호
  
  // 목록 내 항목 셀렉터
  titleLink: string       // 제목 링크
  titleText: string       // 제목 텍스트
  imageThumb?: string     // 썸네일 이미지
  category?: string       // 카테고리
  author?: string         // 작성자
  date?: string          // 작성일
  views?: string         // 조회수
  recommend?: string     // 추천수
  commentCount?: string  // 댓글수
  endedMark?: string     // 종료 표시
  
  // 상세 페이지 셀렉터
  detailImage?: string[]  // 상세 이미지 (여러 셀렉터 시도)
  detailContent?: string[] // 상세 내용 (여러 셀렉터 시도)
}

// 크롤링 옵션
export interface CrawlOptions {
  maxPages?: number       // 최대 페이지 수
  pageDelay?: number      // 페이지 간 딜레이 (ms)
  detailDelay?: number    // 상세 페이지 딜레이 (ms)
  skipDetail?: boolean    // 상세 페이지 스킵
  startPage?: number      // 시작 페이지
}

// 추상 커뮤니티 크롤러 클래스
export abstract class CommunityCrawler extends BaseCrawler {
  protected playwright: PlaywrightWrapper
  protected selectors: CommunitySelectors
  
  constructor(config: any, selectors: CommunitySelectors) {
    super(config)
    this.playwright = new PlaywrightWrapper()
    this.selectors = selectors
  }
  
  // 각 커뮤니티가 구현해야 할 메서드들
  abstract getListUrl(page: number): string
  abstract extractListData(script: string): string
  abstract extractDetailData(script: string): string
  abstract transformRawData(rawData: any): CrawledHotDeal
  
  // 공통 크롤링 로직
  async crawl(options: CrawlOptions = {}): Promise<CrawlerResult> {
    const startTime = Date.now()
    const crawledDeals: CrawledHotDeal[] = []
    const errors: string[] = []
    
    const {
      maxPages = 1,
      pageDelay = 2000,
      detailDelay = 1000,
      skipDetail = false,
      startPage = 1
    } = options
    
    try {
      // 브라우저 초기화
      await this.playwright.initialize()
      
      // 각 페이지 크롤링
      for (let page = startPage; page < startPage + maxPages; page++) {
        console.log(`🔍 ${this.config.name} ${page}페이지 크롤링 중...`)
        
        try {
          const pageDeals = await this.crawlPage(page, { skipDetail, detailDelay })
          crawledDeals.push(...pageDeals)
          
          console.log(`✅ ${page}페이지에서 ${pageDeals.length}개 발견`)
          
          // 다음 페이지 전 딜레이
          if (page < startPage + maxPages - 1) {
            await this.delay(pageDelay)
          }
        } catch (error) {
          const errorMsg = `페이지 ${page} 크롤링 실패: ${error}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }
      
    } catch (error) {
      const errorMsg = `크롤링 초기화 실패: ${error}`
      console.error(errorMsg)
      errors.push(errorMsg)
    } finally {
      // 브라우저 종료
      await this.playwright.close()
    }
    
    return {
      success: errors.length === 0,
      data: crawledDeals,
      error: errors.length > 0 ? errors.join(', ') : undefined,
      stats: {
        totalCrawled: crawledDeals.length,
        totalPages: maxPages,
        duration: Date.now() - startTime
      }
    }
  }
  
  // 페이지 크롤링
  protected async crawlPage(
    pageNumber: number, 
    options: { skipDetail?: boolean, detailDelay?: number }
  ): Promise<CrawledHotDeal[]> {
    const url = this.getListUrl(pageNumber)
    
    // 페이지 이동
    const navigated = await this.playwright.navigate({ url, waitUntil: 'domcontentloaded' })
    if (!navigated) {
      throw new Error('페이지 이동 실패')
    }
    
    // 리스트 로드 대기
    await this.playwright.waitForSelector(this.selectors.listRows, 5000)
    
    // 리스트 데이터 추출
    const listScript = this.extractListData(this.getListExtractionScript())
    const listResult = await this.playwright.evaluate<any[]>(listScript)
    
    if (!listResult.success || !listResult.data) {
      throw new Error('리스트 데이터 추출 실패')
    }
    
    const rawDataList = listResult.data
    const crawledDeals: CrawledHotDeal[] = []
    
    // 각 아이템 처리
    for (const rawData of rawDataList) {
      try {
        // 상세 페이지에서 추가 정보 가져오기
        if (!options.skipDetail && rawData.link) {
          await this.fetchDetailData(rawData)
          if (options.detailDelay) {
            await this.delay(options.detailDelay)
          }
        }
        
        // 데이터 변환
        const deal = this.transformRawData(rawData)
        crawledDeals.push(deal)
        
      } catch (error) {
        console.error('아이템 처리 실패:', error, rawData.title)
      }
    }
    
    return crawledDeals
  }
  
  // 상세 페이지 데이터 가져오기
  protected async fetchDetailData(rawData: any): Promise<void> {
    if (!rawData.link) return
    
    try {
      const navigated = await this.playwright.navigate({ 
        url: rawData.link, 
        waitUntil: 'domcontentloaded' 
      })
      
      if (!navigated) {
        console.error('상세 페이지 이동 실패:', rawData.link)
        return
      }
      
      // 상세 데이터 추출
      const detailScript = this.extractDetailData(this.getDetailExtractionScript())
      const detailResult = await this.playwright.evaluate(detailScript)
      
      if (detailResult.success && detailResult.data) {
        Object.assign(rawData, detailResult.data)
      }
      
    } catch (error) {
      console.error('상세 데이터 가져오기 실패:', error)
    }
  }
  
  // 리스트 추출 스크립트 생성
  protected getListExtractionScript(): string {
    return `
(function() {
  const rows = document.querySelectorAll('${this.selectors.listRows}');
  const data = [];
  
  rows.forEach((row) => {
    try {
      const item = {};
      
      // 제목과 링크
      const titleLink = row.querySelector('${this.selectors.titleLink}');
      const titleText = row.querySelector('${this.selectors.titleText}');
      
      if (!titleLink || !titleText) return;
      
      item.title = titleText.textContent.trim();
      item.link = titleLink.href;
      
      // 선택적 필드들
      ${this.selectors.imageThumb ? `
      const img = row.querySelector('${this.selectors.imageThumb}');
      if (img) item.imageUrl = img.src;
      ` : ''}
      
      ${this.selectors.category ? `
      const category = row.querySelector('${this.selectors.category}');
      if (category) item.category = category.textContent.trim();
      ` : ''}
      
      ${this.selectors.author ? `
      const author = row.querySelector('${this.selectors.author}');
      if (author) item.author = author.textContent.trim();
      ` : ''}
      
      ${this.selectors.date ? `
      const date = row.querySelector('${this.selectors.date}');
      if (date) item.date = date.textContent.trim();
      ` : ''}
      
      ${this.selectors.views ? `
      const views = row.querySelector('${this.selectors.views}');
      if (views) item.views = views.textContent.trim();
      ` : ''}
      
      ${this.selectors.recommend ? `
      const recommend = row.querySelector('${this.selectors.recommend}');
      if (recommend) item.recommend = recommend.textContent.trim();
      ` : ''}
      
      ${this.selectors.commentCount ? `
      const commentCount = row.querySelector('${this.selectors.commentCount}');
      if (commentCount) item.commentCount = commentCount.textContent.trim();
      ` : ''}
      
      ${this.selectors.endedMark ? `
      const ended = row.querySelector('${this.selectors.endedMark}');
      item.isEnded = !!ended;
      ` : ''}
      
      data.push(item);
    } catch (e) {
      console.error('Row parsing error:', e);
    }
  });
  
  return data;
})();
    `.trim()
  }
  
  // 상세 추출 스크립트 생성
  protected getDetailExtractionScript(): string {
    const imageSelectors = this.selectors.detailImage || []
    const contentSelectors = this.selectors.detailContent || []
    
    return `
(function() {
  const data = {};
  
  // 고해상도 이미지 찾기
  const imageSelectors = ${JSON.stringify(imageSelectors)};
  let maxImageSize = 0;
  let bestImageUrl = '';
  
  // 선택자로 이미지 찾기
  for (const selector of imageSelectors) {
    const images = document.querySelectorAll(selector);
    images.forEach(img => {
      if (img.src && !img.src.includes('thumb') && !img.src.includes('small')) {
        // 이미지 크기 확인
        const size = (img.naturalWidth || img.width) * (img.naturalHeight || img.height);
        if (size > maxImageSize) {
          maxImageSize = size;
          bestImageUrl = img.src;
        }
      }
    });
  }
  
  if (bestImageUrl) {
    data.originalImageUrl = bestImageUrl;
  }
  
  // 모든 이미지에서 가장 큰 이미지 찾기
  if (!data.originalImageUrl) {
    const allImages = document.querySelectorAll('img');
    let maxSize = 0;
    
    allImages.forEach(img => {
      // 작은 이미지나 아이콘 제외
      if (img.src && 
          !img.src.includes('thumb') && 
          !img.src.includes('icon') && 
          !img.src.includes('small') &&
          !img.src.includes('logo') &&
          img.width > 200) {
        
        const size = (img.naturalWidth || img.width) * (img.naturalHeight || img.height);
        if (size > maxSize) {
          maxSize = size;
          data.originalImageUrl = img.src;
        }
      }
    });
  }
  
  // 내용 찾기
  const contentSelectors = ${JSON.stringify(contentSelectors)};
  for (const selector of contentSelectors) {
    const content = document.querySelector(selector);
    if (content && content.textContent && content.textContent.trim().length > 50) {
      // HTML 태그 제거하고 텍스트만 추출
      data.productComment = content.textContent.trim().substring(0, 2000); // 2000자로 확대
      break;
    }
  }
  
  // 추가 이미지 URL 찾기 (백업)
  if (!data.originalImageUrl) {
    // Open Graph 이미지
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) {
      data.originalImageUrl = ogImage.content;
    }
  }
  
  return data;
})();
    `.trim()
  }
  
  // 딜레이
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}