import { PpomppuCrawler } from './ppomppu-crawler'
import { CrawlerOptions } from './base-hotdeal-crawler'
import type { CrawlResult } from './types'
import chalk from 'chalk'

export type CrawlerSource = 'ppomppu' | 'ruliweb' | 'clien' | 'quasarzone' | 'coolenjoy' | 'itcm'

export class CrawlerManager {
  private options: CrawlerOptions
  
  constructor(options: CrawlerOptions = {}) {
    this.options = {
      headless: options.headless ?? true,
      maxPages: options.maxPages ?? 2,
      delay: options.delay ?? 3000,
      timeout: options.timeout ?? 60000,
      viewport: options.viewport ?? { width: 1920, height: 1080 },
      userAgent: options.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timeFilterHours: options.timeFilterHours,
      onProgress: options.onProgress
    }
  }

  async crawl(source: CrawlerSource | CrawlerSource[]): Promise<CrawlResult[]> {
    const sources = Array.isArray(source) ? source : [source]
    const results: CrawlResult[] = []
    
    console.log(chalk.cyan(`🕷️  크롤링 시작: ${sources.join(', ')}`))
    const startTime = Date.now()
    
    for (const src of sources) {
      try {
        console.log(chalk.yellow(`\n📌 ${src} 크롤링 시작...`))
        
        const crawler = this.createCrawler(src)
        const result = await crawler.crawl()
        
        results.push(result)
        
        console.log(chalk.green(`✅ ${src} 크롤링 완료`))
        console.log(chalk.gray(`   - 총 수집: ${result.totalCrawled}개`))
        console.log(chalk.gray(`   - 신규: ${result.newDeals}개`))
        console.log(chalk.gray(`   - 업데이트: ${result.updatedDeals}개`))
        console.log(chalk.gray(`   - 오류: ${result.errors}개`))
        
        // 다음 사이트 크롤링 전 딜레이
        if (src !== sources[sources.length - 1]) {
          await this.delay(5000)
        }
      } catch (error) {
        console.error(chalk.red(`❌ ${src} 크롤링 실패:`), error)
        
        // 실패한 경우에도 결과 추가 (에러 정보 포함)
        results.push({
          totalCrawled: 0,
          newDeals: 0,
          updatedDeals: 0,
          errors: 1,
          duration: 0,
          hotdeals: []
        })
      }
    }
    
    const totalDuration = Date.now() - startTime
    
    // 전체 통계 출력
    console.log(chalk.cyan('\n📊 전체 크롤링 통계:'))
    console.log(chalk.gray(`- 크롤링 사이트: ${sources.length}개`))
    console.log(chalk.gray(`- 총 수집: ${results.reduce((sum, r) => sum + r.totalCrawled, 0)}개`))
    console.log(chalk.gray(`- 총 신규: ${results.reduce((sum, r) => sum + r.newDeals, 0)}개`))
    console.log(chalk.gray(`- 총 업데이트: ${results.reduce((sum, r) => sum + r.updatedDeals, 0)}개`))
    console.log(chalk.gray(`- 총 오류: ${results.reduce((sum, r) => sum + r.errors, 0)}개`))
    console.log(chalk.gray(`- 총 소요시간: ${totalDuration}ms`))
    
    return results
  }

  private createCrawler(source: CrawlerSource) {
    switch (source) {
      case 'ppomppu':
        return new PpomppuCrawler(this.options)
      // 다른 크롤러들은 나중에 추가
      case 'ruliweb':
      case 'clien':
      case 'quasarzone':
      case 'coolenjoy':
      case 'itcm':
        throw new Error(`${source} 크롤러는 아직 구현되지 않았습니다.`)
      default:
        throw new Error(`알 수 없는 크롤러 소스: ${source}`)
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}