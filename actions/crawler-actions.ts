'use server'

import { cookies } from 'next/headers'
import { HotdealCrawlerManager, CrawlerSource } from '@/lib/crawlers/new-crawler-manager'
import type { HotDeal } from '@/types/hotdeal'
import { db } from '@/lib/db/database-service'
import { crawlerState } from '@/lib/crawler-state'

interface CrawlerOptions {
  source: string
  pages: number
  headless: boolean
  saveToDb: boolean
  saveToJson: boolean
  groupBySource: boolean
  timeFilterHours?: number // 시간 기준 필터링 (시간 단위)
}

interface CrawlerResult {
  source: string
  totalDeals: number
  newDeals: number
  updatedDeals: number
  statistics: any
  crawledAt: string
}

// 기존 핫딜에 sourcePostId 추가하는 마이그레이션 함수
async function migrateExistingHotdeals() {
  try {
    const allHotdeals = await db.hotdeals.findAll()
    console.log(`🔄 마이그레이션 시작: 총 ${allHotdeals.length}개 핫딜 확인`)
    let migrated = 0
    
    for (const hotdeal of allHotdeals) {
      if (!hotdeal.sourcePostId && hotdeal.originalUrl) {
        console.log(`🔍 sourcePostId 없는 핫딜 발견: ${hotdeal.title} (URL: ${hotdeal.originalUrl})`)
        // URL에서 게시글 번호 추출 시도
        let extractedPostId = ''
        
        if (hotdeal.source === 'ppomppu') {
          const match = hotdeal.originalUrl.match(/no=(\d+)/)
          if (match) {
            extractedPostId = match[1]
            console.log(`✅ 게시글 번호 추출 성공: ${extractedPostId}`)
          } else {
            console.log(`❌ 게시글 번호 추출 실패: ${hotdeal.originalUrl}`)
          }
        }
        
        if (extractedPostId) {
          await db.hotdeals.update(hotdeal.id, {
            sourcePostId: extractedPostId
          })
          migrated++
          console.log(`✅ sourcePostId 추가 완료: ${hotdeal.title} -> ${extractedPostId}`)
        }
      } else if (hotdeal.sourcePostId) {
        console.log(`✅ 이미 sourcePostId 있음: ${hotdeal.title} (${hotdeal.sourcePostId})`)
      }
    }
    
    console.log(`🎯 마이그레이션 완료: ${migrated}개 핫딜에 sourcePostId 추가`)
  } catch (error) {
    console.warn('기존 데이터 마이그레이션 실패:', error)
  }
}

export async function runCrawler(options: CrawlerOptions) {
  try {
    // TODO: 프로덕션에서는 인증 확인 필수
    // Check authentication and admin role
    /*
    const { requireAdmin } = await import('@/lib/server-auth')
    try {
      await requireAdmin()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '권한이 없습니다.'
      }
    }
    */

    // 기존 데이터 마이그레이션 (처음 한 번만 실행)
    await migrateExistingHotdeals()

    // 크롤링 상태 시작
    crawlerState.startCrawling(options.source, options.timeFilterHours)

    // Create crawler manager
    const manager = new HotdealCrawlerManager({
      headless: options.headless,
      maxPages: options.pages,
      delay: 4000, // 4초로 증가
      timeout: 60000, // 60초 타임아웃
      timeFilterHours: options.timeFilterHours
    })

    // 진행도 콜백 설정
    manager.setProgressCallback((current: number, total: number, step: string) => {
      crawlerState.updateStep(step)
      // 총 개수는 0이거나 현재보다 클 때만 업데이트 (안정성 확보)
      const currentTotal = crawlerState.getProgress().totalPosts
      if (currentTotal === 0 || total > currentTotal) {
        crawlerState.setTotalPosts(total)
      }
      crawlerState.updateProgress(current, step)
    })

    // Run crawler
    const crawlResults = await manager.crawl(options.source as CrawlerSource)
    
    const results: CrawlerResult[] = []
    let totalDeals = 0
    
    // Process results
    for (const result of crawlResults) {
      let newDeals = 0
      let updatedDeals = 0
      
      // Save to database if requested
      if (options.saveToDb) {
        console.log(`💾 DB 저장 시작: ${result.hotdeals.length}개 핫딜 처리`)
        for (const hotdeal of result.hotdeals) {
          try {
            console.log(`🔍 핫딜 처리 중: ${hotdeal.title} (${hotdeal.source} ${hotdeal.sourcePostId})`)
            // Check if hotdeal already exists (기존 데이터 호환성 포함)
            const existing = await db.hotdeals.findBySourceAndPostId(
              hotdeal.source as any, 
              hotdeal.sourcePostId
            )
            
            if (existing) {
              console.log(`🔄 기존 핫딜 업데이트: ${existing.title}`)
              // Update existing hotdeal (sourcePostId가 없는 경우 추가)
              await db.hotdeals.update(existing.id, {
                ...hotdeal,
                id: existing.id,
                sourcePostId: hotdeal.sourcePostId, // 기존 데이터에 sourcePostId 추가
              })
              updatedDeals++
            } else {
              console.log(`✨ 새로운 핫딜 추가: ${hotdeal.title}`)
              // Create new hotdeal
              await db.hotdeals.create(hotdeal)
              newDeals++
            }
          } catch (error) {
            console.error('Failed to save hotdeal:', error)
          }
        }
        console.log(`💾 DB 저장 완료: 신규 ${newDeals}개, 업데이트 ${updatedDeals}개`)
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
    
    // 크롤링 완료 상태 업데이트
    crawlerState.finishCrawling()

    return {
      success: true,
      data: {
        results,
        totalDeals,
        exportedFiles
      }
    }
    
  } catch (error) {
    console.error('Crawler error:', error)
    // 오류 시 상태 리셋
    crawlerState.reset()
    return {
      success: false,
      error: error instanceof Error ? error.message : '크롤링 중 오류가 발생했습니다.'
    }
  }
}

// 크롤링 진행도 조회 액션
export async function getCrawlerProgress() {
  return crawlerState.getProgress()
}

export async function importCrawlData(data: any) {
  try {
    // TODO: 프로덕션에서는 인증 확인 필수
    // Check authentication and admin role
    /*
    const { requireAdmin } = await import('@/lib/server-auth')
    try {
      await requireAdmin()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '권한이 없습니다.'
      }
    }
    */

    // Validate data format
    if (!data.hotdeals || !Array.isArray(data.hotdeals)) {
      return {
        success: false,
        error: '잘못된 JSON 형식입니다. hotdeals 배열이 필요합니다.'
      }
    }

    let savedCount = 0
    let updatedCount = 0

    // Import hotdeals
    for (const hotdeal of data.hotdeals) {
      try {
        // Check if hotdeal already exists (기존 데이터 호환성 포함)
        const existing = hotdeal.sourcePostId 
          ? await db.hotdeals.findBySourceAndPostId(hotdeal.source, hotdeal.sourcePostId)
          : await db.hotdeals.findOne(hd => hd.originalUrl === hotdeal.originalUrl)
        
        if (existing) {
          // Update existing hotdeal (sourcePostId 누락 시 추가)
          await db.hotdeals.update(existing.id, {
            ...hotdeal,
            id: existing.id,
            sourcePostId: hotdeal.sourcePostId || existing.sourcePostId, // sourcePostId 보존
          })
          updatedCount++
        } else {
          // Create new hotdeal
          await db.hotdeals.create({
            ...hotdeal,
            sourcePostId: hotdeal.sourcePostId || `import_${Date.now()}`, // sourcePostId 누락 시 임시 ID 생성
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          savedCount++
        }
      } catch (error) {
        console.error('Failed to import hotdeal:', error)
      }
    }

    return {
      success: true,
      savedCount,
      updatedCount,
      totalCount: data.hotdeals.length
    }
    
  } catch (error) {
    console.error('Import error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '가져오기 중 오류가 발생했습니다.'
    }
  }
}