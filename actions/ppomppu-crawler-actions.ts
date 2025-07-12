'use server'

import { CrawledHotDeal } from '@/lib/crawlers/types'
import { 
  parsePrice, 
  parseDate, 
  extractSeller, 
  cleanTitle, 
  checkFreeShipping,
  ppomppuCrawlScript,
  ppomppuDetailScript
} from '@/lib/crawlers/playwright-ppomppu'

// 실제 Playwright MCP를 사용한 크롤링
export async function crawlPpomppuWithPlaywright(pageNumber: number = 1): Promise<CrawledHotDeal[]> {
  // ppomppu-playwright-crawler.ts의 실제 크롤링 함수 호출
  const { crawlPpomppuWithPlaywright: crawlReal } = await import('./ppomppu-playwright-crawler');
  return crawlReal(pageNumber);
}