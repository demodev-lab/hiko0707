// Server-side Playwright wrapper for Server Actions
// 실제 크롤링은 브라우저 환경에서 실행되어야 함

import { CrawledHotDeal, CrawlerResult } from './types'

export interface ServerCrawlOptions {
  source: string
  maxPages?: number
  pageDelay?: number
  detailDelay?: number
  skipDetail?: boolean
}

export class ServerPlaywrightWrapper {
  // 서버에서는 실제 크롤링을 수행할 수 없으므로
  // 클라이언트에 크롤링 작업을 위임하거나
  // 별도의 크롤링 서비스를 호출해야 함
  
  static async crawl(options: ServerCrawlOptions): Promise<CrawlerResult> {
    // 임시로 에러 반환
    return {
      success: false,
      error: '서버에서 직접 크롤링을 실행할 수 없습니다. 클라이언트 크롤러를 사용하세요.',
      stats: {
        totalCrawled: 0,
        totalPages: 0,
        duration: 0
      }
    }
  }
  
  // 크롤링 작업을 클라이언트에 위임하기 위한 메타데이터 생성
  static generateCrawlTask(options: ServerCrawlOptions) {
    return {
      id: `crawl-${Date.now()}`,
      source: options.source,
      maxPages: options.maxPages || 1,
      pageDelay: options.pageDelay || 2000,
      detailDelay: options.detailDelay || 1000,
      skipDetail: options.skipDetail || false,
      createdAt: new Date()
    }
  }
}