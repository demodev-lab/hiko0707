// 크롤러 관련 타입 정의

export interface CrawledHotDeal {
  // 필수 정보
  title: string; // 제목
  price: number; // 가격
  originalUrl: string; // 원본 게시물 링크
  seller: string; // 쇼핑몰 이름
  source: string; // 커뮤니티 이름 (ppomppu, ruliweb 등)
  crawledAt: Date; // 크롤링 시점
  
  // 선택 정보
  thumbnailImageUrl?: string; // 썸네일 이미지 (저해상도)
  originalImageUrl?: string; // 원본 이미지 (고해상도)
  imageUrl?: string; // 기본 이미지 (originalImageUrl 우선, 없으면 thumbnailImageUrl)
  userId?: string; // 작성자 ID
  communityCommentCount?: number; // 댓글수
  communityRecommendCount?: number; // 추천수
  viewCount?: number; // 조회수
  productComment?: string; // 게시물 본문 내용
  category?: string; // 카테고리
  shipping?: {
    isFree: boolean;
  };
  
  // 크롤러 메타데이터
  crawlerId: string; // 어떤 크롤러로 수집했는지
  crawlerVersion: string; // 크롤러 버전
}

export interface CrawlerConfig {
  name: string;
  baseUrl: string;
  maxPages?: number; // 최대 크롤링 페이지 수
  targetDate?: Date; // 이 날짜까지만 크롤링
  delay?: number; // 페이지 간 딜레이 (ms)
}

export interface CrawlerResult {
  success: boolean;
  data?: CrawledHotDeal[];
  error?: string;
  stats: {
    totalCrawled: number;
    totalPages: number;
    duration: number; // ms
  };
}

// 크롤링 결과 (Supabase 저장 포함)
export interface CrawlResult {
  totalCrawled: number;  // 크롤링된 총 개수
  newDeals: number;      // 새로 추가된 개수
  updatedDeals: number;  // 업데이트된 개수
  errors: number;        // 오류 발생 개수
  duration: number;      // 소요 시간 (ms)
  hotdeals: any[];       // 크롤링된 핫딜 데이터
}

export abstract class BaseCrawler {
  protected config: CrawlerConfig;
  
  constructor(config: CrawlerConfig) {
    this.config = config;
  }
  
  abstract crawl(): Promise<CrawlerResult>;
}