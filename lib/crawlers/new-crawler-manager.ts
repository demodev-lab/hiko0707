import { BaseHotdealCrawler, CrawlerOptions } from './base-hotdeal-crawler'
import { PpomppuCrawler } from './new-ppomppu-crawler'
import type { HotDeal } from '@/types/hotdeal'
import { db } from '@/lib/db/database-service'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'

export type CrawlerSource = 'ppomppu' | 'ruliweb' | 'clien' | 'quasarzone' | 'coolenjoy' | 'itcm' | 'all'

interface CrawlerResult {
  source: string
  hotdeals: HotDeal[]
  statistics: any
  crawledAt: string
}

interface ExportMetadata {
  exportDate: string
  totalDeals: number
  source: string
  version: string
  exportedBy: string
  crawledPages: number
}

export class HotdealCrawlerManager {
  private crawlers: Map<string, BaseHotdealCrawler>
  private options: CrawlerOptions

  constructor(options: CrawlerOptions = {}) {
    this.options = options
    this.crawlers = new Map()
    this.initializeCrawlers()
  }

  private initializeCrawlers(): void {
    // Initialize available crawlers
    this.crawlers.set('ppomppu', new PpomppuCrawler(this.options))
    
    // TODO: Add other crawlers as they are implemented
    // this.crawlers.set('ruliweb', new RuliwebCrawler(this.options))
    // this.crawlers.set('clien', new ClienCrawler(this.options))
    // etc.
  }

  setProgressCallback(callback: (current: number, total: number, step: string) => void): void {
    this.options.onProgress = callback
    // 기존 크롤러들에 새로운 옵션 적용을 위해 재초기화
    this.crawlers.clear()
    this.initializeCrawlers()
  }

  async crawl(source: CrawlerSource = 'ppomppu'): Promise<CrawlerResult[]> {
    const results: CrawlerResult[] = []
    
    if (source === 'all') {
      // Crawl all available sources
      for (const [sourceName, crawler] of this.crawlers) {
        try {
          console.log(chalk.blue(`\n🚀 크롤링 시작: ${sourceName}`))
          const hotdeals = await crawler.crawl()
          const statistics = (crawler as any).generateStatistics()
          
          results.push({
            source: sourceName,
            hotdeals,
            statistics,
            crawledAt: new Date().toISOString()
          })
        } catch (error) {
          console.error(chalk.red(`❌ ${sourceName} 크롤링 실패:`, error))
        }
      }
    } else {
      // Crawl specific source
      const crawler = this.crawlers.get(source)
      if (!crawler) {
        throw new Error(`Crawler for source '${source}' not found`)
      }
      
      const hotdeals = await crawler.crawl()
      const statistics = (crawler as any).generateStatistics()
      
      results.push({
        source,
        hotdeals,
        statistics,
        crawledAt: new Date().toISOString()
      })
    }
    
    return results
  }

  async saveToDatabase(results: CrawlerResult[]): Promise<void> {
    console.log(chalk.cyan('\n💾 데이터베이스에 저장 중...'))
    
    // 서버 환경에서는 직접 저장이 어려우므로 로그만 출력
    for (const result of results) {
      console.log(chalk.yellow(`⚠️  ${result.source}: ${result.hotdeals.length}개 핫딜 (브라우저에서 저장 필요)`))
    }
    
    console.log(chalk.yellow('\n💡 웹 인터페이스에서 "DB 저장" 옵션을 사용하세요.'))
  }

  async exportToJson(
    results: CrawlerResult[], 
    outputDir: string = './exports',
    groupBySource: boolean = false
  ): Promise<string[]> {
    console.log(chalk.cyan('\n📁 JSON 파일로 내보내기...'))
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true })
    
    const exportedFiles: string[] = []
    
    if (groupBySource) {
      // Export separate file for each source
      for (const result of results) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `hotdeal-${result.source}-${timestamp}.json`
        const filepath = path.join(outputDir, filename)
        
        const exportData = {
          metadata: this.createMetadata(result),
          hotdeals: result.hotdeals,
          statistics: result.statistics
        }
        
        await fs.writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf-8')
        exportedFiles.push(filepath)
        
        const stats = await fs.stat(filepath)
        const sizeKB = Math.round(stats.size / 1024)
        
        console.log(chalk.green(`✅ ${result.source} 내보내기 완료`))
        console.log(chalk.gray(`   파일: ${filepath}`))
        console.log(chalk.gray(`   크기: ${sizeKB}KB`))
        console.log(chalk.gray(`   딜 수: ${result.hotdeals.length}개`))
      }
    } else {
      // Export all results to single file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `hotdeal-all-${timestamp}.json`
      const filepath = path.join(outputDir, filename)
      
      const allHotdeals = results.flatMap(r => r.hotdeals)
      const combinedStats = this.combineStatistics(results)
      
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalDeals: allHotdeals.length,
          source: results.map(r => r.source).join(', '),
          version: '1.0.0',
          exportedBy: 'HotdealCrawlerManager',
          crawledPages: this.options.maxPages || 2
        },
        hotdeals: allHotdeals,
        statistics: combinedStats
      }
      
      await fs.writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf-8')
      exportedFiles.push(filepath)
      
      const stats = await fs.stat(filepath)
      const sizeKB = Math.round(stats.size / 1024)
      
      console.log(chalk.green(`✅ 통합 내보내기 완료`))
      console.log(chalk.gray(`   파일: ${filepath}`))
      console.log(chalk.gray(`   크기: ${sizeKB}KB`))
      console.log(chalk.gray(`   총 딜 수: ${allHotdeals.length}개`))
    }
    
    return exportedFiles
  }

  async importFromJson(filepath: string): Promise<HotDeal[]> {
    console.log(chalk.cyan(`\n📥 JSON 파일 가져오기: ${filepath}`))
    
    try {
      const content = await fs.readFile(filepath, 'utf-8')
      const data = JSON.parse(content)
      
      if (!data.hotdeals || !Array.isArray(data.hotdeals)) {
        throw new Error('Invalid JSON format: hotdeals array not found')
      }
      
      console.log(chalk.green(`✅ ${data.hotdeals.length}개 딜 가져오기 완료`))
      
      if (data.metadata) {
        console.log(chalk.gray(`   소스: ${data.metadata.source}`))
        console.log(chalk.gray(`   내보낸 날짜: ${data.metadata.exportDate}`))
      }
      
      return data.hotdeals
    } catch (error) {
      console.error(chalk.red('❌ JSON 가져오기 실패:'), error)
      throw error
    }
  }

  private createMetadata(result: CrawlerResult): ExportMetadata {
    return {
      exportDate: new Date().toISOString(),
      totalDeals: result.hotdeals.length,
      source: result.source,
      version: '1.0.0',
      exportedBy: 'HotdealCrawlerManager',
      crawledPages: this.options.maxPages || 2
    }
  }

  private combineStatistics(results: CrawlerResult[]): any {
    const combined = {
      totalDeals: 0,
      activeDeals: 0,
      endedDeals: 0,
      categoryCounts: {} as Record<string, number>,
      storeCounts: {} as Record<string, number>,
      sourceCounts: {} as Record<string, number>,
      freeShippingCount: 0,
      popularCount: 0,
      imagesCount: 0,
      contentCount: 0
    }
    
    for (const result of results) {
      const stats = result.statistics
      
      combined.totalDeals += stats.totalDeals
      combined.activeDeals += stats.activeDeals
      combined.endedDeals += stats.endedDeals
      combined.freeShippingCount += stats.freeShippingCount
      combined.popularCount += stats.popularCount
      combined.imagesCount += stats.imagesCount
      combined.contentCount += stats.contentCount
      
      // Merge category counts
      for (const [category, count] of Object.entries(stats.categoryCounts)) {
        combined.categoryCounts[category] = (combined.categoryCounts[category] || 0) + (count as number)
      }
      
      // Merge store counts
      for (const [store, count] of Object.entries(stats.storeCounts)) {
        combined.storeCounts[store] = (combined.storeCounts[store] || 0) + (count as number)
      }
      
      // Add source count
      combined.sourceCounts[result.source] = result.hotdeals.length
    }
    
    return combined
  }

  getSupportedSources(): string[] {
    return Array.from(this.crawlers.keys())
  }
}