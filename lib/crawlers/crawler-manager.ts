import { CrawledHotDeal, CrawlerResult } from './types'
import { CrawlerFactory, CrawlerType } from './crawler-factory'
import { HotDealSource } from '@/types/hotdeal'
import { db } from '@/lib/db/database-service'
import { DataExporter } from './data-exporter'

// 크롤링 작업 옵션
export interface CrawlJobOptions {
  sources: HotDealSource[]     // 크롤링할 커뮤니티들
  maxPages?: number            // 각 커뮤니티별 최대 페이지
  pageDelay?: number           // 페이지 간 딜레이
  detailDelay?: number         // 상세 페이지 딜레이
  skipDetail?: boolean         // 상세 페이지 스킵
  concurrent?: boolean         // 동시 실행 여부
  retryAttempts?: number       // 재시도 횟수
  retryDelay?: number          // 재시도 딜레이
  exportToJson?: boolean       // JSON 파일로 내보내기
  saveToDb?: boolean           // DB에 저장 (기본값: true)
}

// 크롤링 작업 결과
export interface CrawlJobResult {
  success: boolean
  results: Map<HotDealSource, CrawlerResult>
  stats: {
    totalCrawled: number
    totalSaved: number
    totalUpdated: number
    totalSkipped: number
    totalErrors: number
    duration: number
  }
  errors: Map<HotDealSource, string>
}

// 저장 통계
interface SaveStats {
  saved: number
  updated: number
  skipped: number
}

export class CrawlerManager {
  // 크롤링 작업 실행
  static async executeCrawlJob(options: CrawlJobOptions): Promise<CrawlJobResult> {
    const startTime = Date.now()
    const results = new Map<HotDealSource, CrawlerResult>()
    const errors = new Map<HotDealSource, string>()
    const stats = {
      totalCrawled: 0,
      totalSaved: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      duration: 0
    }
    
    const {
      sources,
      maxPages = 1,
      pageDelay = 2000,
      detailDelay = 1000,
      skipDetail = false,
      concurrent = false,
      retryAttempts = 1,
      retryDelay = 5000
    } = options
    
    console.log(`🚀 크롤링 작업 시작: ${sources.join(', ')}`)
    
    if (concurrent) {
      // 동시 실행
      const promises = sources.map(source => 
        this.crawlWithRetry(source, {
          maxPages,
          pageDelay,
          detailDelay,
          skipDetail,
          retryAttempts,
          retryDelay
        })
      )
      
      const crawlResults = await Promise.allSettled(promises)
      
      crawlResults.forEach((result, index) => {
        const source = sources[index]
        
        if (result.status === 'fulfilled') {
          results.set(source, result.value)
          stats.totalCrawled += result.value.stats.totalCrawled
        } else {
          errors.set(source, result.reason.message || '알 수 없는 오류')
          stats.totalErrors++
        }
      })
      
    } else {
      // 순차 실행
      for (const source of sources) {
        try {
          const result = await this.crawlWithRetry(source, {
            maxPages,
            pageDelay,
            detailDelay,
            skipDetail,
            retryAttempts,
            retryDelay
          })
          
          results.set(source, result)
          stats.totalCrawled += result.stats.totalCrawled
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류'
          errors.set(source, errorMsg)
          stats.totalErrors++
          console.error(`❌ ${source} 크롤링 실패:`, errorMsg)
        }
      }
    }
    
    // 크롤링된 데이터 수집
    const allCrawledDeals: CrawledHotDeal[] = []
    for (const [source, result] of results) {
      if (result.success && result.data) {
        allCrawledDeals.push(...result.data)
      }
    }
    
    // JSON으로 내보내기
    if (options.exportToJson && allCrawledDeals.length > 0) {
      console.log('📄 JSON 파일로 내보내는 중...')
      const exportResult = await DataExporter.exportToJson(allCrawledDeals, {
        groupBySource: true,
        includeMetadata: true
      })
      
      if (exportResult.success) {
        console.log(`✅ JSON 파일 저장 완료: ${exportResult.filePath}`)
      } else {
        console.error('❌ JSON 내보내기 실패:', exportResult.error)
      }
    }
    
    // DB에 저장 (기본값: true)
    if (options.saveToDb !== false && stats.totalCrawled > 0) {
      console.log('💾 크롤링 데이터 DB 저장 중...')
      
      for (const [source, result] of results) {
        if (result.success && result.data) {
          const saveStats = await this.saveCrawledData(result.data)
          stats.totalSaved += saveStats.saved
          stats.totalUpdated += saveStats.updated
          stats.totalSkipped += saveStats.skipped
        }
      }
    }
    
    stats.duration = Date.now() - startTime
    
    const success = stats.totalErrors === 0 && stats.totalCrawled > 0
    
    console.log(`✅ 크롤링 작업 완료:`)
    console.log(`   - 크롤링: ${stats.totalCrawled}개`)
    console.log(`   - 저장: ${stats.totalSaved}개`)
    console.log(`   - 업데이트: ${stats.totalUpdated}개`)
    console.log(`   - 스킵: ${stats.totalSkipped}개`)
    console.log(`   - 오류: ${stats.totalErrors}개`)
    console.log(`   - 소요시간: ${(stats.duration / 1000).toFixed(1)}초`)
    
    return {
      success,
      results,
      stats,
      errors
    }
  }
  
  // 재시도 로직이 포함된 크롤링
  private static async crawlWithRetry(
    source: HotDealSource,
    options: any
  ): Promise<CrawlerResult> {
    const { retryAttempts, retryDelay, ...crawlOptions } = options
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(`🔍 ${source} 크롤링 시도 ${attempt}/${retryAttempts}...`)
        
        const crawler = CrawlerFactory.createCrawler(source)
        const result = await crawler.crawl(crawlOptions)
        
        if (result.success) {
          return result
        }
        
        // 실패했지만 재시도 가능한 경우
        if (attempt < retryAttempts) {
          console.log(`⏳ ${retryDelay}ms 후 재시도...`)
          await this.delay(retryDelay)
        }
        
      } catch (error) {
        console.error(`❌ ${source} 크롤링 ${attempt}차 시도 실패:`, error)
        
        if (attempt < retryAttempts) {
          console.log(`⏳ ${retryDelay}ms 후 재시도...`)
          await this.delay(retryDelay)
        } else {
          throw error
        }
      }
    }
    
    throw new Error(`${source} 크롤링 ${retryAttempts}회 시도 후 실패`)
  }
  
  // 크롤링 데이터 저장
  private static async saveCrawledData(deals: CrawledHotDeal[]): Promise<SaveStats> {
    const stats = { saved: 0, updated: 0, skipped: 0 }
    
    try {
      // 기존 핫딜 가져오기
      const existingDeals = await db.hotdeals.findAll()
      const existingUrlMap = new Map(
        existingDeals.map(deal => [deal.originalUrl, deal])
      )
      
      for (const deal of deals) {
        const existing = existingUrlMap.get(deal.originalUrl)
        
        if (existing) {
          // 종료 상태만 업데이트
          if (deal.status === 'ended' && existing.status !== 'ended') {
            await db.hotdeals.update(existing.id, {
              status: 'ended',
              updatedAt: new Date()
            })
            stats.updated++
          } else {
            stats.skipped++
          }
        } else {
          // 새로운 핫딜 저장
          await db.hotdeals.create(deal)
          stats.saved++
        }
      }
      
    } catch (error) {
      console.error('핫딜 저장 중 오류:', error)
    }
    
    return stats
  }
  
  // 크롤러 상태 가져오기
  static async getCrawlerStatus(): Promise<{
    totalHotDeals: number
    todayHotDeals: number
    sources: Record<HotDealSource, number>
    lastCrawled?: Date
  }> {
    try {
      const hotdeals = await db.hotdeals.findAll()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayHotDeals = hotdeals.filter(deal => 
        new Date(deal.crawledAt) >= today
      )
      
      const sources: Record<string, number> = {}
      hotdeals.forEach(deal => {
        sources[deal.source] = (sources[deal.source] || 0) + 1
      })
      
      return {
        totalHotDeals: hotdeals.length,
        todayHotDeals: todayHotDeals.length,
        sources: sources as Record<HotDealSource, number>,
        lastCrawled: hotdeals.length > 0 
          ? new Date(Math.max(...hotdeals.map(d => new Date(d.crawledAt).getTime())))
          : undefined
      }
    } catch (error) {
      console.error('크롤러 상태 조회 실패:', error)
      return {
        totalHotDeals: 0,
        todayHotDeals: 0,
        sources: {} as Record<HotDealSource, number>
      }
    }
  }
  
  // 딜레이
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}