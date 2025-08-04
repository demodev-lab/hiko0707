'use server'

import { CrawlerManager, CrawlJobOptions } from '@/lib/crawlers/crawler-manager'
import { HotDealSource } from '@/types/hotdeal'

export interface RunCrawlInput {
  sources: HotDealSource[]
  options?: {
    maxPages?: number
    pageDelay?: number
    detailDelay?: number
    skipDetail?: boolean
    concurrent?: boolean
    retryAttempts?: number
    retryDelay?: number
  }
}

export async function runCrawl(input: RunCrawlInput) {
  // 개발 환경에서는 인증 체크 스킵
  // 실제 프로덕션에서는 세션/쿠키 기반 인증 구현 필요
  
  const { sources, options = {} } = input

  if (!sources || sources.length === 0) {
    throw new Error('크롤링할 소스를 선택해주세요')
  }

  console.log('🚀 크롤링 시작:', sources)

  try {
    // 크롤링 작업 실행
    const result = await CrawlerManager.executeCrawlJob({
      sources,
      ...options
    } as CrawlJobOptions)

    console.log('✅ 크롤링 완료:', result.stats)

    return {
      success: result.success,
      stats: result.stats,
      errors: result.errors ? Object.fromEntries(result.errors) : {},
      message: result.success 
        ? `크롤링 완료: ${result.stats.totalCrawled}개 수집, ${result.stats.totalSaved}개 저장`
        : '크롤링 중 일부 오류가 발생했습니다'
    }
  } catch (error) {
    console.error('❌ 크롤링 실패:', error)
    throw new Error(
      error instanceof Error ? error.message : '크롤링 중 오류가 발생했습니다'
    )
  }
}

// 크롤러 상태 조회
export async function getCrawlerStatus() {
  // 개발 환경에서는 인증 체크 스킵
  try {
    return await CrawlerManager.getCrawlerStatus()
  } catch (error) {
    console.error('크롤러 상태 조회 실패:', error)
    throw error
  }
}

// 사용 가능한 크롤러 목록 조회
export async function getAvailableCrawlers() {
  // 개발 환경에서는 인증 체크 스킵
  const status = await CrawlerManager.getCrawlerStatus()
  
  return {
    crawlers: [
      { id: 'ppomppu', name: '뽐뿌', status: 'available' },
      { id: 'ruliweb', name: '루리웹', status: 'coming_soon' },
      { id: 'clien', name: '클리앙', status: 'coming_soon' },
      { id: 'quasarzone', name: '퀘이사존', status: 'coming_soon' },
      { id: 'coolenjoy', name: '쿨엔조이', status: 'coming_soon' },
      { id: 'itcm', name: '잇츠엠', status: 'coming_soon' }
    ],
    available: status.availableCrawlers
  }
}