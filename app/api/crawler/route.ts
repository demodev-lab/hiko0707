import { NextRequest, NextResponse } from 'next/server'
import { HotdealCrawlerManager, CrawlerSource } from '@/lib/crawlers/new-crawler-manager'
import { db } from '@/lib/db/database-service'
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
    const manager = new HotdealCrawlerManager({
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
        for (const hotdeal of result.hotdeals) {
          try {
            const existing = await db.hotdeals.findOne(hd => 
              hd.source === hotdeal.source && 
              hd.sourcePostId === hotdeal.sourcePostId
            )
            
            if (existing) {
              await db.hotdeals.update(existing.id, {
                ...hotdeal,
                id: existing.id
              })
              updatedDeals++
            } else {
              await db.hotdeals.create(hotdeal)
              newDeals++
            }
          } catch (error) {
            console.error('Failed to save hotdeal:', error)
          }
        }
      }
      
      totalDeals += result.hotdeals.length
      
      results.push({
        source: result.source,
        totalDeals: result.hotdeals.length,
        newDeals,
        updatedDeals,
        statistics: result.statistics,
        crawledAt: result.crawledAt
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