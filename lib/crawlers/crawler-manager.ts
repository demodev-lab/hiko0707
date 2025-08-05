import { PpomppuCrawler } from './ppomppu-crawler'
import { RuliwebCrawler } from './ruliweb-crawler'
import { QuasarzoneCrawler } from './quasarzone-crawler'
import { ClienCrawler } from './clien-crawler'
import { EomisaeCrawler } from './eomisae-crawler'
import { CoolenjoyCrawler } from './coolenjoy-crawler'
import { CrawlerOptions } from './base-hotdeal-crawler'
import type { CrawlResult } from './types'
import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

export type CrawlerSource = 'ppomppu' | 'ruliweb' | 'clien' | 'quasarzone' | 'eomisae' | 'coolenjoy' | 'itcm'

export interface CrawlJobOptions {
  sources: CrawlerSource[]
  maxPages?: number
  pageDelay?: number
  detailDelay?: number
  skipDetail?: boolean
  concurrent?: boolean
  retryAttempts?: number
  retryDelay?: number
}

export interface CrawlJobResult {
  success: boolean
  stats: {
    totalCrawled: number
    totalSaved: number
    totalErrors: number
    duration: number
  }
  errors?: Map<string, string[]>
}

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
      case 'ruliweb':
        return new RuliwebCrawler(this.options)
      case 'quasarzone':
        return new QuasarzoneCrawler(this.options)
      case 'clien':
        return new ClienCrawler(this.options)
      case 'eomisae':
        return new EomisaeCrawler(this.options)
      case 'coolenjoy':
        return new CoolenjoyCrawler(this.options)
      default:
        throw new Error(`알 수 없는 크롤러 소스: ${source}`)
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 크롤링 결과를 데이터베이스에 저장
   */
  async saveToDatabase(results: CrawlResult[]): Promise<void> {
    console.log(chalk.cyan('\n💾 데이터베이스 저장 중...'))
    
    for (const result of results) {
      if (result.hotdeals.length > 0) {
        try {
          const importResult = await SupabaseHotDealService.importFromCrawler(
            result.hotdeals[0]?.source || 'unknown',
            result.hotdeals
          )
          
          console.log(chalk.green(`✅ ${result.hotdeals[0]?.source} 저장 완료:`))
          console.log(chalk.gray(`   - 신규: ${importResult.added}개`))
          console.log(chalk.gray(`   - 업데이트: ${importResult.updated}개`))
          console.log(chalk.gray(`   - 오류: ${importResult.errors.length}개`))
        } catch (error) {
          console.error(chalk.red(`❌ 데이터베이스 저장 실패:`), error)
        }
      }
    }
  }

  /**
   * 크롤링 결과를 JSON 파일로 내보내기
   */
  async exportToJson(
    results: CrawlResult[], 
    outputDir: string, 
    groupBySource: boolean = false
  ): Promise<string[]> {
    console.log(chalk.cyan('\n📁 JSON 파일 내보내기...'))
    
    // 출력 디렉토리 생성
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true })
    }

    const files: string[] = []
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    if (groupBySource) {
      // 소스별로 별개 파일 생성
      for (const result of results) {
        if (result.hotdeals.length > 0) {
          const source = result.hotdeals[0]?.source || 'unknown'
          const filename = `hotdeal-${source}-${timestamp}.json`
          const filepath = join(outputDir, filename)
          
          await writeFile(filepath, JSON.stringify({
            source,
            timestamp: new Date().toISOString(),
            count: result.hotdeals.length,
            hotdeals: result.hotdeals
          }, null, 2))
          
          files.push(filepath)
          console.log(chalk.green(`✅ ${filename} 생성 완료 (${result.hotdeals.length}개 딜)`))
        }
      }
    } else {
      // 모든 소스를 하나의 파일로 합치기
      const allHotdeals = results.flatMap(r => r.hotdeals)
      const filename = `hotdeal-all-${timestamp}.json`
      const filepath = join(outputDir, filename)
      
      await writeFile(filepath, JSON.stringify({
        timestamp: new Date().toISOString(),
        sources: results.length,
        count: allHotdeals.length,
        hotdeals: allHotdeals
      }, null, 2))
      
      files.push(filepath)
      console.log(chalk.green(`✅ ${filename} 생성 완료 (${allHotdeals.length}개 딜)`))
    }

    return files
  }

  /**
   * JSON 파일에서 데이터 가져오기
   */
  async importFromJson(filepath: string): Promise<any[]> {
    console.log(chalk.cyan(`📂 JSON 파일 가져오기: ${filepath}`))
    
    try {
      const content = await readFile(filepath, 'utf-8')
      const data = JSON.parse(content)
      
      const hotdeals = data.hotdeals || []
      console.log(chalk.green(`✅ ${hotdeals.length}개 딜 가져오기 완료`))
      
      return hotdeals
    } catch (error) {
      console.error(chalk.red(`❌ JSON 파일 읽기 실패:`), error)
      return []
    }
  }

  // ===== 정적 메서드들 =====

  /**
   * 크롤 작업 실행 (정적 메서드)
   */
  static async executeCrawlJob(options: CrawlJobOptions): Promise<CrawlJobResult> {
    const startTime = Date.now()
    let totalCrawled = 0
    let totalSaved = 0
    let totalErrors = 0
    const errors = new Map<string, string[]>()

    try {
      const manager = new CrawlerManager({
        maxPages: options.maxPages || 2,
        delay: options.pageDelay || 3000
      })

      const results = await manager.crawl(options.sources)
      
      // 통계 집계
      for (const result of results) {
        totalCrawled += result.totalCrawled
        totalSaved += result.newDeals + result.updatedDeals
        totalErrors += result.errors
      }

      // 데이터베이스 저장
      if (totalCrawled > 0) {
        await manager.saveToDatabase(results)
      }

      const duration = Date.now() - startTime

      return {
        success: totalErrors === 0,
        stats: {
          totalCrawled,
          totalSaved,
          totalErrors,
          duration
        },
        errors: errors.size > 0 ? errors : undefined
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      return {
        success: false,
        stats: {
          totalCrawled,
          totalSaved,
          totalErrors: totalErrors + 1,
          duration
        },
        errors: new Map([['general', [String(error)]]])
      }
    }
  }

  /**
   * 크롤러 상태 조회 (정적 메서드)
   */
  static async getCrawlerStatus(): Promise<{
    isRunning: boolean
    lastRun?: Date
    availableCrawlers: string[]
    runningJobs: string[]
  }> {
    return {
      isRunning: false, // 실제 구현 시 상태 체크 로직 추가
      availableCrawlers: ['ppomppu', 'ruliweb', 'quasarzone', 'clien', 'eomisae', 'coolenjoy'],
      runningJobs: []
    }
  }
}