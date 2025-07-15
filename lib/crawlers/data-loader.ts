import { CrawledHotDeal } from './types'
import { HotDeal, HotDealSource } from '@/types/hotdeal'
import { DataExporter } from './data-exporter'
import path from 'path'
import fs from 'fs'

export class DataLoader {
  // JSON 파일에서 핫딜 데이터 로드하여 HotDeal 형식으로 변환
  static async loadHotDealsFromJson(
    source?: HotDealSource,
    customPath?: string
  ): Promise<HotDeal[]> {
    try {
      let filePath: string | null = customPath || null
      
      if (!filePath) {
        // 최신 파일 찾기
        filePath = await DataExporter.findLatestExport(undefined, source)
      }
      
      if (!filePath) {
        console.log('JSON 파일을 찾을 수 없습니다')
        return []
      }
      
      // JSON 파일 로드
      const crawledDeals = await DataExporter.loadFromJson(filePath)
      
      // CrawledHotDeal을 HotDeal로 변환
      return crawledDeals.map(this.convertToHotDeal)
    } catch (error) {
      console.error('핫딜 데이터 로드 실패:', error)
      return []
    }
  }
  
  // 특정 날짜의 데이터 로드
  static async loadHotDealsByDate(
    date: Date,
    source?: HotDealSource
  ): Promise<HotDeal[]> {
    try {
      const dateStr = date.toISOString().split('T')[0]
      const outputDir = path.join(process.cwd(), 'data', 'crawled')
      
      const pattern = source 
        ? `hotdeals-${source}-${dateStr}.json`
        : `hotdeals-all-${dateStr}.json`
      
      const filePath = path.join(outputDir, pattern)
      
      // 파일 존재 확인
      try {
        await fs.promises.access(filePath)
      } catch {
        console.log(`${dateStr} 날짜의 데이터 파일이 없습니다`)
        return []
      }
      
      const crawledDeals = await DataExporter.loadFromJson(filePath)
      return crawledDeals.map(this.convertToHotDeal)
    } catch (error) {
      console.error('날짜별 데이터 로드 실패:', error)
      return []
    }
  }
  
  // 여러 소스의 데이터를 병합하여 로드
  static async loadMergedHotDeals(
    sources: HotDealSource[]
  ): Promise<HotDeal[]> {
    try {
      const allDeals: HotDeal[] = []
      
      for (const source of sources) {
        const deals = await this.loadHotDealsFromJson(source)
        allDeals.push(...deals)
      }
      
      // 중복 제거 (originalUrl 기준)
      const uniqueDeals = new Map<string, HotDeal>()
      allDeals.forEach(deal => {
        uniqueDeals.set(deal.originalUrl, deal)
      })
      
      // 날짜순 정렬
      return Array.from(uniqueDeals.values())
        .sort((a, b) => b.crawledAt.getTime() - a.crawledAt.getTime())
    } catch (error) {
      console.error('병합 데이터 로드 실패:', error)
      return []
    }
  }
  
  // CrawledHotDeal을 HotDeal로 변환
  private static convertToHotDeal(crawled: CrawledHotDeal): HotDeal {
    // 고유 ID 생성
    const id = `${crawled.source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 이미지 URL 처리 - 고해상도 원본 이미지 우선
    const imageUrl = crawled.originalImageUrl || crawled.imageUrl || crawled.thumbnailImageUrl || ''
    
    return {
      id,
      title: crawled.title,
      price: crawled.price,
      seller: crawled.seller,
      source: crawled.source as any, // Type conversion needed for HotDealSource
      sourcePostId: `${crawled.source}-${crawled.crawledAt.getTime()}`, // Generate sourcePostId
      originalUrl: crawled.originalUrl,
      imageUrl,
      thumbnailImageUrl: crawled.thumbnailImageUrl,
      originalImageUrl: crawled.originalImageUrl,
      category: crawled.category,
      productComment: crawled.productComment,
      status: 'active' as const,
      shipping: crawled.shipping,
      userId: crawled.userId,
      viewCount: crawled.viewCount,
      communityCommentCount: crawled.communityCommentCount,
      communityRecommendCount: crawled.communityRecommendCount,
      crawledAt: crawled.crawledAt,
    }
  }
  
  // 캐시된 데이터 존재 확인
  static async hasCachedData(source?: HotDealSource): Promise<boolean> {
    const filePath = await DataExporter.findLatestExport(undefined, source)
    return !!filePath
  }
  
  // 캐시된 데이터의 나이 확인 (시간 단위)
  static async getCacheAge(source?: HotDealSource): Promise<number | null> {
    try {
      const filePath = await DataExporter.findLatestExport(undefined, source)
      if (!filePath) return null
      
      const stats = await fs.promises.stat(filePath)
      const ageMs = Date.now() - stats.mtime.getTime()
      return Math.floor(ageMs / (1000 * 60 * 60)) // 시간 단위
    } catch (error) {
      console.error('캐시 나이 확인 실패:', error)
      return null
    }
  }
  
  // 오래된 캐시 파일 정리
  static async cleanOldCache(maxAgeDays: number = 7): Promise<number> {
    try {
      const outputDir = path.join(process.cwd(), 'data', 'crawled')
      const files = await fs.promises.readdir(outputDir)
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
      let deletedCount = 0
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue
        
        const filePath = path.join(outputDir, file)
        const stats = await fs.promises.stat(filePath)
        const ageMs = Date.now() - stats.mtime.getTime()
        
        if (ageMs > maxAgeMs) {
          await fs.promises.unlink(filePath)
          deletedCount++
          console.log(`오래된 캐시 파일 삭제: ${file}`)
        }
      }
      
      return deletedCount
    } catch (error) {
      console.error('캐시 정리 실패:', error)
      return 0
    }
  }
}