#!/usr/bin/env tsx
/**
 * LocalStorage의 HotDeal 데이터를 Supabase로 마이그레이션하는 스크립트
 * 
 * 사용법:
 * 1. pnpm tsx scripts/migrate-hotdeals-to-supabase.ts
 * 
 * 주의사항:
 * - 중복 방지를 위해 (source, source_id) unique constraint 활용
 * - 배치 처리로 성능 최적화
 * - 오류 발생 시 상세 로그 출력
 */

import { db } from '@/lib/db/database-service'
import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'
import { transformLocalToSupabase } from '@/lib/utils/hotdeal-transformers'
import type { HotDeal } from '@/types/hotdeal'

// 색상 코드 정의
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
}

// 로그 헬퍼 함수
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bold}${colors.cyan}=== ${msg} ===${colors.reset}\n`),
  progress: (current: number, total: number, msg: string) => {
    const percentage = Math.round((current / total) * 100)
    console.log(`${colors.gray}[${current}/${total}] ${percentage}%${colors.reset} - ${msg}`)
  }
}

async function migrateHotDeals() {
  log.section('LocalStorage → Supabase 핫딜 데이터 마이그레이션 시작')

  try {
    // 1. LocalStorage에서 모든 핫딜 데이터 가져오기
    log.info('LocalStorage에서 핫딜 데이터를 가져오는 중...')
    const localHotDeals = await db.hotdeals.findAll()
    log.success(`총 ${localHotDeals.length}개의 핫딜을 찾았습니다`)

    if (localHotDeals.length === 0) {
      log.warning('마이그레이션할 핫딜이 없습니다')
      return
    }

    // 2. 데이터 유효성 검사
    log.info('데이터 유효성 검사 중...')
    const validHotDeals: HotDeal[] = []
    const invalidHotDeals: HotDeal[] = []

    for (const hotdeal of localHotDeals) {
      // 필수 필드 검사
      if (!hotdeal.source || !hotdeal.sourcePostId) {
        log.warning(`유효하지 않은 핫딜 (ID: ${hotdeal.id}) - source 또는 sourcePostId 없음`)
        invalidHotDeals.push(hotdeal)
        continue
      }

      // 날짜 형식 검증
      try {
        new Date(hotdeal.crawledAt)
        // endDate는 HotDeal 타입에 없음
        validHotDeals.push(hotdeal)
      } catch (error) {
        log.warning(`유효하지 않은 날짜 형식 (ID: ${hotdeal.id})`)
        invalidHotDeals.push(hotdeal)
      }
    }

    log.info(`유효한 핫딜: ${validHotDeals.length}개, 무효한 핫딜: ${invalidHotDeals.length}개`)

    // 3. 배치 처리로 마이그레이션
    log.section('Supabase로 데이터 마이그레이션 중...')
    
    const BATCH_SIZE = 50
    const batches = Math.ceil(validHotDeals.length / BATCH_SIZE)
    
    let totalAdded = 0
    let totalUpdated = 0
    let totalErrors = 0
    const errorDetails: string[] = []

    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, validHotDeals.length)
      const batch = validHotDeals.slice(start, end)
      
      log.info(`배치 ${i + 1}/${batches} 처리 중 (${batch.length}개)...`)

      for (const hotdeal of batch) {
        try {
          // 중복 체크
          const exists = await SupabaseHotDealService.checkDuplicate(
            hotdeal.source,
            hotdeal.sourcePostId
          )

          if (exists) {
            log.progress(
              start + batch.indexOf(hotdeal) + 1,
              validHotDeals.length,
              `업데이트: ${hotdeal.title.substring(0, 50)}...`
            )
            
            // 기존 데이터 업데이트
            const supabaseData = transformLocalToSupabase(hotdeal)
            delete (supabaseData as any).id // ID는 업데이트하지 않음
            
            const updated = await SupabaseHotDealService.updateHotDeal(
              hotdeal.id,
              supabaseData
            )
            
            if (updated) {
              totalUpdated++
            } else {
              totalErrors++
              errorDetails.push(`업데이트 실패: ${hotdeal.title} (${hotdeal.id})`)
            }
          } else {
            log.progress(
              start + batch.indexOf(hotdeal) + 1,
              validHotDeals.length,
              `추가: ${hotdeal.title.substring(0, 50)}...`
            )
            
            // 새 데이터 추가
            const supabaseData = transformLocalToSupabase(hotdeal)
            const created = await SupabaseHotDealService.createHotDeal(supabaseData)
            
            if (created) {
              totalAdded++
              
              // 조회수 동기화
              if (hotdeal.viewCount && hotdeal.viewCount > 0) {
                // 조회수는 직접 업데이트 불가능하므로 로그만 남김
                log.info(`조회수 ${hotdeal.viewCount}은 마이그레이션 후 재설정됩니다`)
              }
            } else {
              totalErrors++
              errorDetails.push(`추가 실패: ${hotdeal.title} (${hotdeal.id})`)
            }
          }
        } catch (error) {
          totalErrors++
          errorDetails.push(
            `오류 발생 - ${hotdeal.title} (${hotdeal.id}): ${error instanceof Error ? error.message : '알 수 없는 오류'}`
          )
          log.error(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
      }

      // 배치 간 대기 시간
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // 4. 결과 요약
    log.section('마이그레이션 완료')
    
    console.log(`
${colors.bold}마이그레이션 결과:${colors.reset}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colors.green}✓ 추가된 핫딜:${colors.reset} ${totalAdded}개
${colors.yellow}↻ 업데이트된 핫딜:${colors.reset} ${totalUpdated}개
${colors.red}✗ 오류 발생:${colors.reset} ${totalErrors}개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colors.gray}총 처리:${colors.reset} ${totalAdded + totalUpdated + totalErrors}개
    `)

    // 5. 오류 상세 정보
    if (errorDetails.length > 0) {
      log.section('오류 상세 정보')
      errorDetails.forEach((error, index) => {
        console.log(`${colors.red}${index + 1}.${colors.reset} ${error}`)
      })
    }

    // 6. 통계 정보
    log.section('통계 정보')
    const stats = await SupabaseHotDealService.getHotDealStats('all')
    console.log(`
${colors.bold}Supabase 핫딜 통계:${colors.reset}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 핫딜 수: ${stats.totalDeals}개
활성 핫딜: ${stats.activeDeals}개
만료 핫딜: ${stats.endedDeals}개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${colors.bold}소스별 분포:${colors.reset}
${Object.entries(stats.bySource)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .map(([source, count]) => `  • ${source}: ${count}개`)
  .join('\n')}

${colors.bold}카테고리별 분포:${colors.reset}
${Object.entries(stats.byCategory)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .map(([category, count]) => `  • ${category}: ${count}개`)
  .join('\n')}
    `)

    log.success('마이그레이션이 성공적으로 완료되었습니다!')

  } catch (error) {
    log.error(`마이그레이션 중 치명적 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    console.error(error)
    process.exit(1)
  }
}

// 스크립트 실행
migrateHotDeals()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })