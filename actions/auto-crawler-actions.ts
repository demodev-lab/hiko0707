'use server'

import { getTestPpomppuData } from './crawler-test-actions'
import { crawlPpomppuWithPlaywright } from './ppomppu-crawler-actions'
import { saveMultipleHotDeals } from './hotdeal-upload-actions'
import { CrawledHotDeal } from '@/lib/crawlers/types'

export interface CrawlAndUploadResult {
  success: boolean
  message: string
  stats: {
    crawled: number
    saved: number
    skipped: number
    errors: number
  }
  savedDeals?: any[]
}

// 크롤링 + 자동 업로드
export async function crawlAndUploadPpomppu(options: {
  useTestData?: boolean
  pageNumber?: number
  maxPages?: number
}): Promise<CrawlAndUploadResult> {
  console.log('🚀 뽐뿌 크롤링 및 업로드 시작...')
  
  try {
    let allCrawledDeals: CrawledHotDeal[] = []
    
    if (options.useTestData) {
      // 테스트 데이터 사용
      console.log('🧪 테스트 모드: 샘플 데이터 사용')
      const maxPages = options.maxPages || 1
      
      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 ${page}페이지 테스트 데이터 가져오는 중...`)
        const pageDeals = await getTestPpomppuData(page)
        allCrawledDeals.push(...pageDeals)
        
        // 페이지 간 딜레이
        if (page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } else {
      // 실제 크롤링 모드
      console.log('🌐 실제 크롤링 모드: 뽐뿌 사이트 데이터 수집')
      const maxPages = options.maxPages || 1
      
      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 ${page}페이지 실제 크롤링 중...`)
        const pageDeals = await crawlPpomppuWithPlaywright(page)
        allCrawledDeals.push(...pageDeals)
        
        // 페이지 간 딜레이
        if (page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }
    
    if (allCrawledDeals.length === 0) {
      return {
        success: false,
        message: '크롤링된 데이터가 없습니다',
        stats: {
          crawled: 0,
          saved: 0,
          skipped: 0,
          errors: 0
        }
      }
    }
    
    // 서버에서는 크롤링만 하고 저장은 클라이언트에서 처리
    console.log(`💾 ${allCrawledDeals.length}개 핫딜 준비 완료`)
    
    return {
      success: true,
      message: `크롤링 완료`,
      stats: {
        crawled: allCrawledDeals.length,
        saved: allCrawledDeals.length,
        skipped: 0,
        errors: 0
      },
      savedDeals: allCrawledDeals
    }
  } catch (error) {
    console.error('크롤링 및 업로드 오류:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stats: {
        crawled: 0,
        saved: 0,
        skipped: 0,
        errors: 1
      }
    }
  }
}

// 자동 크롤링 실행 (스케줄러용)
export async function runAutoCrawler(): Promise<void> {
  console.log('⏰ 자동 크롤러 실행...')
  
  try {
    // 뽐뿌 크롤링 (1-3페이지)
    const result = await crawlAndUploadPpomppu({
      useTestData: false,
      maxPages: 3
    })
    
    if (result.success) {
      console.log(`✅ 자동 크롤링 성공: ${result.stats.saved}개 새 핫딜 추가`)
    } else {
      console.error(`❌ 자동 크롤링 실패: ${result.message}`)
    }
  } catch (error) {
    console.error('자동 크롤러 오류:', error)
  }
}