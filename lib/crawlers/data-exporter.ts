import { CrawledHotDeal } from './types'
import { HotDealSource } from '@/types/hotdeal'
import fs from 'fs'
import path from 'path'

export interface ExportOptions {
  outputDir?: string
  format?: 'json' | 'csv'
  groupBySource?: boolean
  includeMetadata?: boolean
}

export interface ExportResult {
  success: boolean
  filePath?: string
  error?: string
  stats?: {
    totalExported: number
    bySource: Record<HotDealSource, number>
  }
}

export class DataExporter {
  private static DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'data', 'crawled')
  
  // 크롤링 데이터를 JSON 파일로 저장
  static async exportToJson(
    deals: CrawledHotDeal[],
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const {
      outputDir = this.DEFAULT_OUTPUT_DIR,
      groupBySource = true,
      includeMetadata = true
    } = options
    
    try {
      // 출력 디렉토리 생성
      await this.ensureDirectoryExists(outputDir)
      
      if (groupBySource) {
        // 소스별로 그룹화하여 저장
        return await this.exportGroupedBySource(deals, outputDir, includeMetadata)
      } else {
        // 모든 데이터를 하나의 파일로 저장
        return await this.exportSingleFile(deals, outputDir, includeMetadata)
      }
    } catch (error) {
      console.error('데이터 내보내기 실패:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }
    }
  }
  
  // 소스별로 그룹화하여 저장
  private static async exportGroupedBySource(
    deals: CrawledHotDeal[],
    outputDir: string,
    includeMetadata: boolean
  ): Promise<ExportResult> {
    const grouped = this.groupBySource(deals)
    const timestamp = new Date().toISOString().split('T')[0]
    const stats: Record<HotDealSource, number> = {} as Record<HotDealSource, number>
    const filePaths: string[] = []
    
    for (const [source, sourceDeals] of Object.entries(grouped)) {
      const fileName = `hotdeals-${source}-${timestamp}.json`
      const filePath = path.join(outputDir, fileName)
      
      const exportData = includeMetadata ? {
        metadata: {
          source,
          exportDate: new Date().toISOString(),
          totalItems: sourceDeals.length,
          crawlerVersion: '1.0.0'
        },
        data: sourceDeals
      } : sourceDeals
      
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(exportData, null, 2),
        'utf-8'
      )
      
      stats[source as HotDealSource] = sourceDeals.length
      filePaths.push(filePath)
    }
    
    // 인덱스 파일 생성
    const indexPath = path.join(outputDir, `index-${timestamp}.json`)
    await fs.promises.writeFile(
      indexPath,
      JSON.stringify({
        exportDate: new Date().toISOString(),
        files: filePaths.map(f => path.basename(f)),
        stats,
        totalDeals: deals.length
      }, null, 2),
      'utf-8'
    )
    
    return {
      success: true,
      filePath: indexPath,
      stats: {
        totalExported: deals.length,
        bySource: stats
      }
    }
  }
  
  // 하나의 파일로 저장
  private static async exportSingleFile(
    deals: CrawledHotDeal[],
    outputDir: string,
    includeMetadata: boolean
  ): Promise<ExportResult> {
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `hotdeals-all-${timestamp}.json`
    const filePath = path.join(outputDir, fileName)
    
    const exportData = includeMetadata ? {
      metadata: {
        exportDate: new Date().toISOString(),
        totalItems: deals.length,
        sources: [...new Set(deals.map(d => d.source))],
        crawlerVersion: '1.0.0'
      },
      data: deals
    } : deals
    
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(exportData, null, 2),
      'utf-8'
    )
    
    const stats = this.calculateStats(deals)
    
    return {
      success: true,
      filePath,
      stats: {
        totalExported: deals.length,
        bySource: stats
      }
    }
  }
  
  // 기존 JSON 파일에서 데이터 로드
  static async loadFromJson(filePath: string): Promise<CrawledHotDeal[]> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      
      // 메타데이터가 있는 경우와 없는 경우 처리
      const data = parsed.data || parsed
      
      // 날짜 문자열을 Date 객체로 변환
      return data.map((deal: any) => ({
        ...deal,
        crawledAt: new Date(deal.crawledAt),
        createdAt: new Date(deal.createdAt),
        updatedAt: new Date(deal.updatedAt)
      }))
    } catch (error) {
      console.error('JSON 파일 로드 실패:', error)
      return []
    }
  }
  
  // 최신 크롤링 데이터 파일 찾기
  static async findLatestExport(
    outputDir: string = this.DEFAULT_OUTPUT_DIR,
    source?: HotDealSource
  ): Promise<string | null> {
    try {
      const files = await fs.promises.readdir(outputDir)
      
      const pattern = source 
        ? `hotdeals-${source}-\\d{4}-\\d{2}-\\d{2}\\.json`
        : `hotdeals-all-\\d{4}-\\d{2}-\\d{2}\\.json`
      
      const regex = new RegExp(pattern)
      const matchingFiles = files
        .filter(f => regex.test(f))
        .sort()
        .reverse()
      
      return matchingFiles.length > 0 
        ? path.join(outputDir, matchingFiles[0])
        : null
    } catch (error) {
      console.error('최신 파일 찾기 실패:', error)
      return null
    }
  }
  
  // 디렉토리 생성 확인
  private static async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.promises.access(dir)
    } catch {
      await fs.promises.mkdir(dir, { recursive: true })
    }
  }
  
  // 소스별 그룹화
  private static groupBySource(deals: CrawledHotDeal[]): Record<string, CrawledHotDeal[]> {
    return deals.reduce((acc, deal) => {
      if (!acc[deal.source]) {
        acc[deal.source] = []
      }
      acc[deal.source].push(deal)
      return acc
    }, {} as Record<string, CrawledHotDeal[]>)
  }
  
  // 통계 계산
  private static calculateStats(deals: CrawledHotDeal[]): Record<HotDealSource, number> {
    const stats = {} as Record<HotDealSource, number>
    
    deals.forEach(deal => {
      stats[deal.source] = (stats[deal.source] || 0) + 1
    })
    
    return stats
  }
  
  // CSV로 내보내기 (선택적)
  static async exportToCsv(
    deals: CrawledHotDeal[],
    outputDir: string = this.DEFAULT_OUTPUT_DIR
  ): Promise<ExportResult> {
    try {
      await this.ensureDirectoryExists(outputDir)
      
      const timestamp = new Date().toISOString().split('T')[0]
      const fileName = `hotdeals-${timestamp}.csv`
      const filePath = path.join(outputDir, fileName)
      
      // CSV 헤더
      const headers = [
        'id', 'title', 'price', 'originalUrl', 'seller', 'source',
        'category', 'status', 'imageUrl', 'userId', 'viewCount',
        'communityCommentCount', 'communityRecommendCount',
        'shipping.isFree', 'crawledAt', 'createdAt'
      ]
      
      // CSV 내용 생성
      const rows = deals.map(deal => [
        deal.id,
        `"${deal.title.replace(/"/g, '""')}"`,
        deal.price,
        deal.originalUrl,
        deal.seller,
        deal.source,
        deal.category,
        deal.status,
        deal.imageUrl || '',
        deal.userId || '',
        deal.viewCount || 0,
        deal.communityCommentCount || 0,
        deal.communityRecommendCount || 0,
        deal.shipping?.isFree ? 'Y' : 'N',
        deal.crawledAt.toISOString(),
        deal.createdAt.toISOString()
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      await fs.promises.writeFile(filePath, csvContent, 'utf-8')
      
      return {
        success: true,
        filePath,
        stats: {
          totalExported: deals.length,
          bySource: this.calculateStats(deals)
        }
      }
    } catch (error) {
      console.error('CSV 내보내기 실패:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }
    }
  }
}