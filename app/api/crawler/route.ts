import { NextRequest, NextResponse } from 'next/server'
import { CrawlerManager, CrawlerSource } from '@/lib/crawlers/crawler-manager'
// import { db } from '@/lib/db/database-service' // DEPRECATED: 레거시 LocalStorage 시스템
import { crawlerScheduler } from '@/lib/services/crawler-scheduler'

export async function POST(request: NextRequest) {
  try {
    const options = await request.json()
    
    // 수동 실행인 경우 스케줄러를 통해 실행
    if (options.manual) {
      const result = await crawlerScheduler.runCrawlManually(
        options.source as CrawlerSource,
        {
          maxPages: options.pages,
          timeFilterHours: options.timeFilterHours
        }
      )
      
      return NextResponse.json({
        success: true,
        data: {
          results: [{
            source: options.source,
            totalDeals: result.totalCrawled,
            newDeals: result.newDeals,
            updatedDeals: result.updatedDeals,
            crawledAt: new Date()
          }],
          totalDeals: result.totalCrawled,
          exportedFiles: []
        }
      })
    }
    
    // 기존 로직 유지 (하위 호환성)
    const manager = new CrawlerManager({
      headless: options.headless,
      maxPages: options.pages,
      delay: 4000,
      timeout: 60000,
      timeFilterHours: options.timeFilterHours
    })

    const crawlResults = await manager.crawl(options.source as CrawlerSource)
    
    const results: any[] = []
    let totalDeals = 0
    
    for (const result of crawlResults) {
      let newDeals = 0
      let updatedDeals = 0
      
      if (options.saveToDb) {
        // DEPRECATED: LocalStorage 시스템 제거됨
        // 수동 크롤링은 crawlerScheduler.runCrawlManually()를 사용하세요
        console.warn('saveToDb 옵션은 더 이상 지원되지 않습니다. manual 옵션을 사용하세요.')
        newDeals = result.hotdeals.length // 모든 항목을 새 항목으로 표시
      }
      
      totalDeals += result.hotdeals.length
      
      results.push({
        source: options.source,
        totalDeals: result.hotdeals.length,
        newDeals,
        updatedDeals,
        duration: result.duration,
        crawledAt: new Date().toISOString()
      })
    }
    
    let exportedFiles: string[] = []
    if (options.saveToJson) {
      exportedFiles = await manager.exportToJson(
        crawlResults,
        './exports',
        options.groupBySource
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        results,
        totalDeals,
        exportedFiles
      }
    })
    
  } catch (error) {
    console.error('Crawler error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '크롤링 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}