import { NextRequest, NextResponse } from 'next/server'
import { HotdealCrawlerManager, CrawlerSource } from '@/lib/crawlers/new-crawler-manager'
import { db } from '@/lib/db/database-service'

export async function POST(request: NextRequest) {
  try {
    const options = await request.json()
    
    // Create crawler manager
    const manager = new HotdealCrawlerManager({
      headless: options.headless,
      maxPages: options.pages,
      delay: 4000,
      timeout: 60000,
      timeFilterHours: options.timeFilterHours
    })

    // Run crawler
    const crawlResults = await manager.crawl(options.source as CrawlerSource)
    
    const results: any[] = []
    let totalDeals = 0
    
    // Process results
    for (const result of crawlResults) {
      let newDeals = 0
      let updatedDeals = 0
      
      // Save to database if requested
      if (options.saveToDb) {
        for (const hotdeal of result.hotdeals) {
          try {
            // Check if hotdeal already exists
            const existing = await db.hotdeals.findOne(hd => 
              hd.source === hotdeal.source && 
              hd.sourcePostId === hotdeal.sourcePostId
            )
            
            if (existing) {
              // Update existing hotdeal
              await db.hotdeals.update(existing.id, {
                ...hotdeal,
                id: existing.id
              })
              updatedDeals++
            } else {
              // Create new hotdeal
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
    
    // Export to JSON if requested
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