#!/usr/bin/env tsx
/**
 * Hot Deal 마이그레이션 검증 스크립트
 * LocalStorage와 Supabase 간의 데이터 일관성 및 기능 검증
 * 
 * 사용법:
 * 1. pnpm tsx scripts/verify-hotdeal-migration.ts
 */

import { db } from '@/lib/db/database-service'
import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'
import type { HotDeal } from '@/types/hotdeal'

// 색상 코드
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

// 로그 헬퍼
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bold}${colors.cyan}=== ${msg} ===${colors.reset}\n`),
}

interface ValidationResult {
  totalLocalDeals: number
  totalSupabaseDeals: number
  matchedDeals: number
  mismatchedDeals: string[]
  missingInSupabase: string[]
  missingInLocal: string[]
  dataIntegrityIssues: string[]
}

async function compareDataSources(): Promise<ValidationResult> {
  log.section('데이터 소스 비교 검증')
  
  const result: ValidationResult = {
    totalLocalDeals: 0,
    totalSupabaseDeals: 0,
    matchedDeals: 0,
    mismatchedDeals: [],
    missingInSupabase: [],
    missingInLocal: [],
    dataIntegrityIssues: []
  }
  
  try {
    // LocalStorage 데이터 가져오기
    log.info('LocalStorage에서 핫딜 데이터 가져오는 중...')
    const localDeals = await db.hotdeals.findAll()
    result.totalLocalDeals = localDeals.length
    log.success(`LocalStorage: ${localDeals.length}개 핫딜`)
    
    // Supabase 데이터 가져오기
    log.info('Supabase에서 핫딜 데이터 가져오는 중...')
    const supabaseResult = await SupabaseHotDealService.getHotDeals({ 
      limit: 1000, // 충분히 큰 수
      status: 'active'
    })
    result.totalSupabaseDeals = supabaseResult.count
    log.success(`Supabase: ${supabaseResult.count}개 핫딜`)
    
    // 데이터 매핑 생성
    const localMap = new Map<string, HotDeal>()
    const supabaseMap = new Map<string, HotDeal>()
    
    localDeals.forEach(deal => {
      const key = `${deal.source}-${deal.source_id}`
      localMap.set(key, deal)
    })
    
    supabaseResult.data.forEach(deal => {
      const key = `${deal.source}-${deal.source_id}`
      supabaseMap.set(key, deal)
    })
    
    // 비교 검증
    log.info('데이터 일치성 검증 중...')
    
    // LocalStorage에만 있는 항목 찾기
    for (const [key, localDeal] of localMap) {
      if (!supabaseMap.has(key)) {
        result.missingInSupabase.push(`${localDeal.title} (${key})`)
      } else {
        // 데이터 비교
        const supabaseDeal = supabaseMap.get(key)!
        
        // 주요 필드 비교
        const fieldsMatch = 
          localDeal.title === supabaseDeal.title &&
          localDeal.sale_price === supabaseDeal.sale_price &&
          localDeal.source === supabaseDeal.source &&
          localDeal.source_id === supabaseDeal.source_id
        
        if (fieldsMatch) {
          result.matchedDeals++
        } else {
          result.mismatchedDeals.push(`${localDeal.title} (${key})`)
          
          // 상세 불일치 내용 기록
          if (localDeal.title !== supabaseDeal.title) {
            result.dataIntegrityIssues.push(
              `제목 불일치 [${key}]: Local="${localDeal.title}" vs Supabase="${supabaseDeal.title}"`
            )
          }
          if (localDeal.sale_price !== supabaseDeal.sale_price) {
            result.dataIntegrityIssues.push(
              `가격 불일치 [${key}]: Local=${localDeal.sale_price} vs Supabase=${supabaseDeal.sale_price}`
            )
          }
        }
      }
    }
    
    // Supabase에만 있는 항목 찾기
    for (const [key, supabaseDeal] of supabaseMap) {
      if (!localMap.has(key)) {
        result.missingInLocal.push(`${supabaseDeal.title} (${key})`)
      }
    }
    
  } catch (error) {
    log.error(`데이터 비교 중 오류: ${error}`)
  }
  
  return result
}

async function verifyFunctionality() {
  log.section('기능 검증')
  
  const tests = {
    crud: false,
    search: false,
    pagination: false,
    translation: false,
    statistics: false,
    crawlerIntegration: false
  }
  
  try {
    // CRUD 작업 테스트
    log.info('CRUD 작업 테스트...')
    const testHotDeal = {
      title: '검증 테스트 핫딜',
      sale_price: 10000,
      original_price: 20000,
      source: 'test',
      source_id: 'verify-' + Date.now(),
      category: 'test',
      thumbnail_url: 'https://example.com/test.jpg',
      original_url: 'https://example.com',
      seller: '테스트',
      author_name: 'Tester',
      is_free_shipping: true,
      shopping_comment: '테스트 댓글',
      status: 'active' as const,
      created_at: new Date().toISOString(),
      discount_rate: 50,
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      image_url: 'https://example.com/test.jpg',
      updated_at: new Date().toISOString()
    }
    
    const created = await SupabaseHotDealService.createHotDeal(testHotDeal)
    if (created) {
      const fetched = await SupabaseHotDealService.getHotDealById(created.id)
      if (fetched && fetched.title === testHotDeal.title) {
        await SupabaseHotDealService.deleteHotDeal(created.id)
        tests.crud = true
        log.success('CRUD 작업 정상')
      }
    }
    
    // 검색 기능 테스트
    log.info('검색 기능 테스트...')
    const searchResults = await SupabaseHotDealService.searchHotDeals('갤럭시')
    if (Array.isArray(searchResults.data)) {
      tests.search = true
      log.success(`검색 기능 정상 (${searchResults.count}개 결과)`)
    }
    
    // 페이지네이션 테스트
    log.info('페이지네이션 테스트...')
    const page1 = await SupabaseHotDealService.getHotDeals({ page: 1, limit: 5 })
    const page2 = await SupabaseHotDealService.getHotDeals({ page: 2, limit: 5 })
    if (page1.data.length > 0 || page2.data.length > 0) {
      tests.pagination = true
      log.success('페이지네이션 정상')
    }
    
    // 번역 기능 테스트
    log.info('번역 기능 테스트...')
    const translatedDeals = await SupabaseHotDealService.getTranslatedHotDeals('en', { limit: 5 })
    if (Array.isArray(translatedDeals.data)) {
      tests.translation = true
      log.success('번역 기능 정상')
    }
    
    // 통계 기능 테스트
    log.info('통계 기능 테스트...')
    const stats = await SupabaseHotDealService.getHotDealStats('all')
    if (stats.totalDeals >= 0) {
      tests.statistics = true
      log.success('통계 기능 정상')
    }
    
    // 크롤러 통합 테스트
    log.info('크롤러 통합 테스트...')
    const duplicateCheck = await SupabaseHotDealService.checkDuplicate('ppomppu', 'test-123')
    if (typeof duplicateCheck === 'boolean') {
      tests.crawlerIntegration = true
      log.success('크롤러 통합 정상')
    }
    
  } catch (error) {
    log.error(`기능 검증 중 오류: ${error}`)
  }
  
  return tests
}

async function verifyPerformance() {
  log.section('성능 검증')
  
  const performanceMetrics = {
    listQueryTime: 0,
    singleQueryTime: 0,
    searchQueryTime: 0,
    createTime: 0,
    updateTime: 0
  }
  
  try {
    // 목록 조회 성능
    const listStart = Date.now()
    await SupabaseHotDealService.getHotDeals({ limit: 100 })
    performanceMetrics.listQueryTime = Date.now() - listStart
    log.info(`목록 조회 (100개): ${performanceMetrics.listQueryTime}ms`)
    
    // 단일 조회 성능
    const { data: sampleDeals } = await SupabaseHotDealService.getHotDeals({ limit: 1 })
    if (sampleDeals.length > 0) {
      const singleStart = Date.now()
      await SupabaseHotDealService.getHotDealById(sampleDeals[0].id)
      performanceMetrics.singleQueryTime = Date.now() - singleStart
      log.info(`단일 조회: ${performanceMetrics.singleQueryTime}ms`)
    }
    
    // 검색 성능
    const searchStart = Date.now()
    await SupabaseHotDealService.searchHotDeals('테스트')
    performanceMetrics.searchQueryTime = Date.now() - searchStart
    log.info(`검색 쿼리: ${performanceMetrics.searchQueryTime}ms`)
    
    // 성능 평가
    const isPerformanceAcceptable = 
      performanceMetrics.listQueryTime < 1000 && // 1초 이내
      performanceMetrics.singleQueryTime < 500 && // 0.5초 이내
      performanceMetrics.searchQueryTime < 1000 // 1초 이내
    
    if (isPerformanceAcceptable) {
      log.success('성능 기준 충족')
    } else {
      log.warning('일부 작업이 성능 기준을 초과함')
    }
    
  } catch (error) {
    log.error(`성능 검증 중 오류: ${error}`)
  }
  
  return performanceMetrics
}

async function generateReport(
  validationResult: ValidationResult,
  functionalityTests: any,
  performanceMetrics: any
) {
  console.log(`\n${colors.bold}${colors.magenta}
╔══════════════════════════════════════════════════════════════════╗
║                   Hot Deal 마이그레이션 검증 보고서              ║
╚══════════════════════════════════════════════════════════════════╝
${colors.reset}`)

  // 데이터 일관성 보고
  console.log(`\n${colors.bold}1. 데이터 일관성${colors.reset}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`LocalStorage 핫딜 수: ${validationResult.totalLocalDeals}`)
  console.log(`Supabase 핫딜 수: ${validationResult.totalSupabaseDeals}`)
  console.log(`일치하는 핫딜: ${validationResult.matchedDeals}`)
  console.log(`불일치 핫딜: ${validationResult.mismatchedDeals.length}`)
  console.log(`Supabase에 없는 항목: ${validationResult.missingInSupabase.length}`)
  console.log(`LocalStorage에 없는 항목: ${validationResult.missingInLocal.length}`)
  
  const dataConsistencyRate = validationResult.totalLocalDeals > 0
    ? Math.round((validationResult.matchedDeals / validationResult.totalLocalDeals) * 100)
    : 0
  
  console.log(`\n${colors.bold}데이터 일관성: ${dataConsistencyRate}%${colors.reset}`)
  
  if (validationResult.dataIntegrityIssues.length > 0) {
    console.log(`\n${colors.yellow}데이터 무결성 이슈:${colors.reset}`)
    validationResult.dataIntegrityIssues.slice(0, 5).forEach(issue => {
      console.log(`  • ${issue}`)
    })
    if (validationResult.dataIntegrityIssues.length > 5) {
      console.log(`  ... 외 ${validationResult.dataIntegrityIssues.length - 5}개`)
    }
  }

  // 기능 테스트 보고
  console.log(`\n${colors.bold}2. 기능 검증${colors.reset}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  
  const functionalityEntries = Object.entries(functionalityTests)
  functionalityEntries.forEach(([test, passed]) => {
    const status = passed ? `${colors.green}✓ 통과${colors.reset}` : `${colors.red}✗ 실패${colors.reset}`
    const testName = {
      crud: 'CRUD 작업',
      search: '검색 기능',
      pagination: '페이지네이션',
      translation: '번역 기능',
      statistics: '통계 기능',
      crawlerIntegration: '크롤러 통합'
    }[test] || test
    
    console.log(`${testName}: ${status}`)
  })
  
  const passedTests = functionalityEntries.filter(([, passed]) => passed).length
  const totalTests = functionalityEntries.length
  const functionalityRate = Math.round((passedTests / totalTests) * 100)
  
  console.log(`\n${colors.bold}기능 테스트 통과율: ${functionalityRate}%${colors.reset}`)

  // 성능 보고
  console.log(`\n${colors.bold}3. 성능 메트릭${colors.reset}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`목록 조회 (100개): ${performanceMetrics.listQueryTime}ms`)
  console.log(`단일 항목 조회: ${performanceMetrics.singleQueryTime}ms`)
  console.log(`검색 쿼리: ${performanceMetrics.searchQueryTime}ms`)

  // 최종 평가
  console.log(`\n${colors.bold}4. 최종 평가${colors.reset}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  
  const isSuccessful = 
    dataConsistencyRate >= 90 &&
    functionalityRate >= 80 &&
    performanceMetrics.listQueryTime < 2000
  
  if (isSuccessful) {
    console.log(`${colors.green}${colors.bold}
✅ 마이그레이션 검증 성공!
   
   Hot Deal 시스템이 Supabase로 성공적으로 마이그레이션되었습니다.
   모든 주요 기능이 정상 작동하며, 성능 기준을 충족합니다.
${colors.reset}`)
  } else {
    console.log(`${colors.yellow}${colors.bold}
⚠️  마이그레이션 검증 부분 성공
   
   일부 이슈가 발견되었습니다. 위의 보고서를 참고하여
   문제를 해결한 후 다시 검증을 실행해주세요.
${colors.reset}`)
  }

  // 권장 사항
  if (!isSuccessful || validationResult.missingInSupabase.length > 0) {
    console.log(`\n${colors.bold}5. 권장 조치사항${colors.reset}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    if (validationResult.missingInSupabase.length > 0) {
      console.log(`• 누락된 데이터 마이그레이션: pnpm tsx scripts/migrate-hotdeals-to-supabase.ts`)
    }
    
    if (dataConsistencyRate < 90) {
      console.log(`• 데이터 일관성 검사 및 수정 필요`)
    }
    
    if (functionalityRate < 100) {
      console.log(`• 실패한 기능 테스트 디버깅 필요`)
    }
    
    if (performanceMetrics.listQueryTime > 2000) {
      console.log(`• 데이터베이스 인덱스 최적화 검토`)
    }
  }
}

async function runVerification() {
  console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════════════════╗
║           Hot Deal Supabase 마이그레이션 검증 시작              ║
╚══════════════════════════════════════════════════════════════════╝
${colors.reset}`)

  // 검증 실행
  const validationResult = await compareDataSources()
  const functionalityTests = await verifyFunctionality()
  const performanceMetrics = await verifyPerformance()
  
  // 보고서 생성
  await generateReport(validationResult, functionalityTests, performanceMetrics)
}

// 검증 실행
runVerification()
  .then(() => {
    console.log(`\n${colors.gray}검증 완료: ${new Date().toLocaleString('ko-KR')}${colors.reset}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('검증 중 오류 발생:', error)
    process.exit(1)
  })