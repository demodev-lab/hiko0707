#!/usr/bin/env tsx
/**
 * Hot Deal Supabase 통합 테스트
 * 
 * 사용법:
 * 1. pnpm tsx scripts/test-hotdeal-supabase-integration.ts
 * 
 * 테스트 항목:
 * - 서비스 계층 테스트
 * - 데이터 변환 테스트
 * - CRUD 작업 테스트
 * - 번역 기능 테스트
 * - 통계 및 분석 테스트
 */

import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'
import { transformLocalToSupabase, transformSupabaseToLocal } from '@/lib/utils/hotdeal-transformers'
import type { HotDeal } from '@/types/hotdeal'
import type { Database } from '@/database.types'

type HotDealRow = Database['public']['Tables']['hot_deals']['Row']

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
  test: (name: string) => console.log(`\n${colors.cyan}[TEST]${colors.reset} ${name}`),
  pass: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  fail: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (title: string) => console.log(`\n${colors.bold}${colors.magenta}=== ${title} ===${colors.reset}\n`),
}

// 테스트 통계
let passedTests = 0
let failedTests = 0

// 테스트 헬퍼 함수
function assert(condition: boolean, message: string) {
  if (condition) {
    log.pass(message)
    passedTests++
  } else {
    log.fail(message)
    failedTests++
  }
}

// 테스트용 mock 데이터
const mockLocalHotDeal: HotDeal = {
  id: 'test-' + Date.now(),
  title: '테스트 상품 - 갤럭시 버즈3 프로 50% 할인',
  price: 150000,
  source: 'ppomppu',
  sourcePostId: 'test-source-' + Date.now(),
  originalUrl: 'https://www.ppomppu.co.kr/test',
  thumbnailImageUrl: 'https://example.com/image.jpg',
  category: 'electronics',
  seller: '삼성전자',
  viewCount: 100,
  commentCount: 10,
  likeCount: 5,
  communityRecommendCount: 20,
  isPopular: true,
  isHot: false,
  crawledAt: new Date(),
  status: 'active',
  userId: 'test-user',
  shipping: {
    isFree: true
  },
  ranking: undefined
}

async function testDataTransformation() {
  log.section('데이터 변환 테스트')
  
  try {
    // LocalStorage → Supabase 변환 테스트
    log.test('LocalStorage → Supabase 변환')
    const supabaseData = transformLocalToSupabase(mockLocalHotDeal)
    
    assert(supabaseData.sale_price === mockLocalHotDeal.price, 'price → sale_price 변환')
    assert(supabaseData.original_price === mockLocalHotDeal.price, 'price → original_price 변환 (동일 값)')
    assert(supabaseData.discount_rate === 0, 'discount_rate 기본값 0')
    assert(supabaseData.thumbnail_url === mockLocalHotDeal.thumbnailImageUrl, 'thumbnailImageUrl → thumbnail_url 변환')
    assert(supabaseData.original_url === mockLocalHotDeal.originalUrl, 'originalUrl → original_url 변환')
    assert(supabaseData.source_id === mockLocalHotDeal.sourcePostId, 'sourcePostId → source_id 변환')
    assert(supabaseData.is_free_shipping === true, 'shipping.isFree → is_free_shipping 변환')
    
    // Supabase → LocalStorage 역변환 테스트
    log.test('Supabase → LocalStorage 역변환')
    const mockSupabaseRow: HotDealRow = {
      id: supabaseData.id!,
      title: supabaseData.title,
      description: supabaseData.description || null,
      original_price: supabaseData.original_price,
      sale_price: supabaseData.sale_price,
      discount_rate: supabaseData.discount_rate,
      thumbnail_url: supabaseData.thumbnail_url,
      image_url: supabaseData.image_url,
      original_url: supabaseData.original_url,
      category: supabaseData.category,
      source: supabaseData.source,
      source_id: supabaseData.source_id,
      seller: supabaseData.seller || null,
      is_free_shipping: supabaseData.is_free_shipping || false,
      status: 'active',
      end_date: supabaseData.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      views: 100,
      comment_count: 10,
      like_count: 5,
      author_name: supabaseData.author_name || '',
      shopping_comment: supabaseData.shopping_comment || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    }
    
    const localData = transformSupabaseToLocal(mockSupabaseRow)
    
    assert(localData.price === mockSupabaseRow.sale_price, 'sale_price → price 역변환')
    assert(localData.thumbnailImageUrl === mockSupabaseRow.thumbnail_url, 'thumbnail_url → thumbnailImageUrl 역변환')
    assert(localData.shipping?.isFree === mockSupabaseRow.is_free_shipping, 'is_free_shipping → shipping.isFree 역변환')
    
  } catch (error) {
    log.fail(`데이터 변환 테스트 오류: ${error}`)
    failedTests++
  }
}

async function testCRUDOperations() {
  log.section('CRUD 작업 테스트')
  
  let createdId: string | null = null
  
  try {
    // CREATE 테스트
    log.test('핫딜 생성')
    const createData = transformLocalToSupabase(mockLocalHotDeal)
    const created = await SupabaseHotDealService.createHotDeal(createData)
    
    if (created) {
      createdId = created.id
      assert(true, '핫딜 생성 성공')
      assert(created.title === createData.title, '생성된 핫딜 제목 일치')
      assert(created.sale_price === createData.sale_price, '생성된 핫딜 가격 일치')
    } else {
      assert(false, '핫딜 생성 실패')
    }
    
    // READ 테스트
    if (createdId) {
      log.test('핫딜 조회')
      const fetched = await SupabaseHotDealService.getHotDealById(createdId)
      
      if (fetched) {
        assert(true, '핫딜 조회 성공')
        assert(fetched.id === createdId, '조회된 핫딜 ID 일치')
        assert(fetched.title === createData.title, '조회된 핫딜 제목 일치')
      } else {
        assert(false, '핫딜 조회 실패')
      }
      
      // UPDATE 테스트
      log.test('핫딜 업데이트')
      const updated = await SupabaseHotDealService.updateHotDeal(createdId, {
        title: '업데이트된 테스트 상품',
        sale_price: 120000
      })
      
      assert(updated, '핫딜 업데이트 성공')
      
      if (updated) {
        const fetchedAfterUpdate = await SupabaseHotDealService.getHotDealById(createdId)
        assert(fetchedAfterUpdate?.title === '업데이트된 테스트 상품', '업데이트된 제목 확인')
        assert(fetchedAfterUpdate?.sale_price === 120000, '업데이트된 가격 확인')
      }
      
      // DELETE 테스트 (Soft Delete)
      log.test('핫딜 삭제')
      const deleted = await SupabaseHotDealService.deleteHotDeal(createdId)
      assert(deleted, '핫딜 삭제 성공')
      
      if (deleted) {
        const fetchedAfterDelete = await SupabaseHotDealService.getHotDealById(createdId)
        assert(fetchedAfterDelete === null, '삭제된 핫딜 조회 시 null 반환')
      }
    }
    
  } catch (error) {
    log.fail(`CRUD 작업 테스트 오류: ${error}`)
    failedTests++
  }
}

async function testListOperations() {
  log.section('목록 조회 테스트')
  
  try {
    // 기본 목록 조회
    log.test('기본 핫딜 목록 조회')
    const defaultList = await SupabaseHotDealService.getHotDeals()
    assert(Array.isArray(defaultList.data), '목록 데이터는 배열')
    assert(typeof defaultList.count === 'number', '전체 개수 반환')
    log.info(`현재 활성 핫딜: ${defaultList.count}개`)
    
    // 페이지네이션 테스트
    log.test('페이지네이션')
    const page1 = await SupabaseHotDealService.getHotDeals({ page: 1, limit: 5 })
    const page2 = await SupabaseHotDealService.getHotDeals({ page: 2, limit: 5 })
    
    assert(page1.data.length <= 5, '페이지 크기 제한 작동')
    if (defaultList.count > 5) {
      assert(page1.data[0]?.id !== page2.data[0]?.id, '다른 페이지 데이터')
    }
    
    // 정렬 테스트
    log.test('정렬 기능')
    const sortedByPrice = await SupabaseHotDealService.getHotDeals({ 
      sortBy: 'sale_price', 
      sortOrder: 'asc',
      limit: 10
    })
    
    if (sortedByPrice.data.length > 1) {
      const prices = sortedByPrice.data.map(d => d.sale_price)
      const isSorted = prices.every((price, i) => i === 0 || price >= prices[i - 1])
      assert(isSorted, '가격 오름차순 정렬 확인')
    }
    
    // 카테고리 필터 테스트
    log.test('카테고리 필터')
    const electronicDeals = await SupabaseHotDealService.getHotDeals({ 
      category: 'electronics' 
    })
    
    if (electronicDeals.data.length > 0) {
      const allElectronics = electronicDeals.data.every(d => d.category === 'electronics')
      assert(allElectronics, '모든 결과가 electronics 카테고리')
    }
    
    // 인기 핫딜 조회
    log.test('인기 핫딜 조회')
    const popularDeals = await SupabaseHotDealService.getPopularHotDeals(5)
    assert(Array.isArray(popularDeals), '인기 핫딜 목록은 배열')
    assert(popularDeals.length <= 5, '요청한 개수 이하로 반환')
    
    if (popularDeals.length > 1) {
      assert(
        popularDeals[0].views >= popularDeals[1].views,
        '조회수 기준 정렬 확인'
      )
    }
    
  } catch (error) {
    log.fail(`목록 조회 테스트 오류: ${error}`)
    failedTests++
  }
}

async function testDuplicateCheck() {
  log.section('중복 체크 테스트')
  
  try {
    // 테스트용 핫딜 생성
    const testData = transformLocalToSupabase({
      ...mockLocalHotDeal,
      id: 'dup-test-' + Date.now(),
      sourcePostId: 'dup-source-' + Date.now()
    })
    
    const created = await SupabaseHotDealService.createHotDeal(testData)
    
    if (created) {
      log.test('중복 체크 기능')
      
      // 중복 체크 - 존재하는 경우
      const isDuplicate = await SupabaseHotDealService.checkDuplicate(
        testData.source,
        testData.source_id
      )
      assert(isDuplicate === true, '존재하는 핫딜 중복으로 감지')
      
      // 중복 체크 - 존재하지 않는 경우
      const isNotDuplicate = await SupabaseHotDealService.checkDuplicate(
        'test-source',
        'non-existent-id'
      )
      assert(isNotDuplicate === false, '존재하지 않는 핫딜 중복 아님으로 감지')
      
      // 정리
      await SupabaseHotDealService.deleteHotDeal(created.id)
    }
    
  } catch (error) {
    log.fail(`중복 체크 테스트 오류: ${error}`)
    failedTests++
  }
}

async function testTranslations() {
  log.section('번역 기능 테스트')
  
  let createdId: string | null = null
  
  try {
    // 테스트용 핫딜 생성
    const testData = transformLocalToSupabase({
      ...mockLocalHotDeal,
      id: 'trans-test-' + Date.now(),
      title: '번역 테스트 상품'
    })
    
    const created = await SupabaseHotDealService.createHotDeal(testData)
    
    if (created) {
      createdId = created.id
      
      // 번역 생성 테스트
      log.test('번역 생성')
      const translation = await SupabaseHotDealService.createTranslation({
        hotdeal_id: createdId,
        language: 'en',
        title: 'Translation Test Product',
        description: 'This is a test product for translation',
        is_auto_translated: true
      })
      
      if (translation) {
        assert(true, '번역 생성 성공')
        assert(translation.language === 'en', '번역 언어 확인')
        assert(translation.title === 'Translation Test Product', '번역된 제목 확인')
      } else {
        assert(false, '번역 생성 실패')
      }
      
      // 번역 조회 테스트
      log.test('번역 조회')
      const fetchedTranslation = await SupabaseHotDealService.getTranslation(createdId, 'en')
      
      if (fetchedTranslation) {
        assert(true, '번역 조회 성공')
        assert(fetchedTranslation.hotdeal_id === createdId, '핫딜 ID 일치')
        assert(fetchedTranslation.language === 'en', '언어 코드 일치')
      } else {
        assert(false, '번역 조회 실패')
      }
      
      // 번역된 핫딜 목록 조회
      log.test('번역된 핫딜 목록 조회')
      const translatedList = await SupabaseHotDealService.getTranslatedHotDeals('en', { limit: 5 })
      
      assert(Array.isArray(translatedList.data), '번역된 목록은 배열')
      
      const hasTranslation = translatedList.data.some(item => 
        item.translations && item.translations.length > 0
      )
      assert(hasTranslation || translatedList.data.length === 0, '번역 데이터 포함 또는 빈 목록')
      
      // 정리
      await SupabaseHotDealService.deleteHotDeal(createdId)
    }
    
  } catch (error) {
    log.fail(`번역 기능 테스트 오류: ${error}`)
    failedTests++
  }
}

async function testStatistics() {
  log.section('통계 및 분석 테스트')
  
  try {
    // 통계 조회
    log.test('핫딜 통계 조회')
    const stats = await SupabaseHotDealService.getHotDealStats('all')
    
    assert(typeof stats.totalDeals === 'number', '전체 핫딜 수 반환')
    assert(typeof stats.activeDeals === 'number', '활성 핫딜 수 반환')
    assert(typeof stats.endedDeals === 'number', '종료된 핫딜 수 반환')
    assert(typeof stats.totalViews === 'number', '전체 조회수 반환')
    assert(typeof stats.totalLikes === 'number', '전체 좋아요 수 반환')
    assert(typeof stats.byCategory === 'object', '카테고리별 통계 반환')
    assert(typeof stats.bySource === 'object', '소스별 통계 반환')
    
    log.info(`전체 핫딜: ${stats.totalDeals}개`)
    log.info(`활성 핫딜: ${stats.activeDeals}개`)
    log.info(`종료 핫딜: ${stats.endedDeals}개`)
    
    // 카테고리 카운트
    log.test('카테고리별 핫딜 수')
    const categoryCounts = await SupabaseHotDealService.getCategoryCounts()
    
    assert(typeof categoryCounts === 'object', '카테고리 카운트는 객체')
    
    const totalFromCategories = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
    log.info(`카테고리별 합계: ${totalFromCategories}개`)
    
    // 만료 예정 핫딜
    log.test('만료 예정 핫딜 조회')
    const expiringDeals = await SupabaseHotDealService.getExpiringHotDeals()
    
    assert(Array.isArray(expiringDeals), '만료 예정 목록은 배열')
    
    if (expiringDeals.length > 0) {
      const allExpiringSoon = expiringDeals.every(deal => {
        const endDate = new Date(deal.end_date)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return endDate <= tomorrow && endDate >= new Date()
      })
      assert(allExpiringSoon, '모든 핫딜이 24시간 내 만료 예정')
    }
    
  } catch (error) {
    log.fail(`통계 테스트 오류: ${error}`)
    failedTests++
  }
}

async function testSearchFunctionality() {
  log.section('검색 기능 테스트')
  
  try {
    // 키워드 검색
    log.test('키워드 검색')
    const searchResults = await SupabaseHotDealService.searchHotDeals('갤럭시', { limit: 10 })
    
    assert(Array.isArray(searchResults.data), '검색 결과는 배열')
    assert(typeof searchResults.count === 'number', '검색 결과 개수 반환')
    
    if (searchResults.data.length > 0) {
      const hasKeyword = searchResults.data.some(deal => 
        deal.title.includes('갤럭시') || 
        (deal.description && deal.description.includes('갤럭시'))
      )
      assert(hasKeyword, '검색 결과에 키워드 포함')
    }
    
    // 가격 범위 검색
    log.test('가격 범위 검색')
    const priceRangeResults = await SupabaseHotDealService.searchHotDeals('', {
      minPrice: 10000,
      maxPrice: 100000,
      limit: 10
    })
    
    if (priceRangeResults.data.length > 0) {
      const inPriceRange = priceRangeResults.data.every(deal => 
        deal.sale_price >= 10000 && deal.sale_price <= 100000
      )
      assert(inPriceRange, '모든 결과가 가격 범위 내')
    }
    
  } catch (error) {
    log.fail(`검색 기능 테스트 오류: ${error}`)
    failedTests++
  }
}

async function runAllTests() {
  console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════╗
║     HotDeal Supabase 통합 테스트 시작        ║
╚══════════════════════════════════════════════╝
${colors.reset}`)

  // 각 테스트 실행
  await testDataTransformation()
  await testCRUDOperations()
  await testListOperations()
  await testDuplicateCheck()
  await testTranslations()
  await testStatistics()
  await testSearchFunctionality()

  // 최종 결과 출력
  console.log(`\n${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════╗
║              테스트 결과 요약                ║
╚══════════════════════════════════════════════╝
${colors.reset}
${colors.green}✓ 성공한 테스트: ${passedTests}개${colors.reset}
${colors.red}✗ 실패한 테스트: ${failedTests}개${colors.reset}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colors.bold}총 테스트: ${passedTests + failedTests}개${colors.reset}
${colors.bold}성공률: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%${colors.reset}
`)

  if (failedTests === 0) {
    console.log(`${colors.green}${colors.bold}
🎉 모든 테스트가 성공적으로 통과했습니다! 🎉
${colors.reset}`)
  } else {
    console.log(`${colors.red}${colors.bold}
⚠️  일부 테스트가 실패했습니다. 로그를 확인해주세요. ⚠️
${colors.reset}`)
  }
}

// 테스트 실행
runAllTests()
  .then(() => {
    process.exit(failedTests > 0 ? 1 : 0)
  })
  .catch((error) => {
    console.error('테스트 실행 중 오류:', error)
    process.exit(1)
  })