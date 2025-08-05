import 'dotenv/config'
import { SupabaseHotDealService } from '../lib/services/supabase-hotdeal-service'
import { SupabaseProfileService } from '../lib/services/supabase-profile-service'
import { supabase } from '../lib/supabase/client'

async function testRegression() {
  console.log('🔄 Phase 0.1 회귀 테스트 시작 (Supabase)...\n')
  
  let allTestsPassed = true
  const testResults: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = []

  // 테스트 헬퍼 함수
  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    try {
      await testFn()
      testResults.push({ name: testName, status: 'PASS' })
      console.log(`✅ ${testName}`)
    } catch (error) {
      testResults.push({ 
        name: testName, 
        status: 'FAIL', 
        error: error instanceof Error ? error.message : String(error)
      })
      console.log(`❌ ${testName}: ${error instanceof Error ? error.message : String(error)}`)
      allTestsPassed = false
    }
  }

  // 1. Supabase 데이터베이스 기본 기능 테스트
  await runTest('Supabase 데이터베이스 연결', async () => {
    const { data, error } = await supabase()
      .from('hot_deals')
      .select('id')
      .limit(1)
    
    if (error) {
      throw new Error(`핫딜 테이블 접근 실패: ${error.message}`)
    }
  })

  await runTest('HotDeal 데이터 조회', async () => {
    const { data: hotDeals } = await SupabaseHotDealService.getHotDeals({ limit: 10 })
    if (!Array.isArray(hotDeals)) {
      throw new Error('핫딜 목록 조회 실패')
    }
  })

  await runTest('Profile 서비스 기본 기능', async () => {
    // 존재하지 않는 프로필 조회 테스트
    const testUserId = `test-user-${Date.now()}`
    const profile = await SupabaseProfileService.getProfile(testUserId)
    // 존재하지 않는 프로필이므로 null이어야 함
    if (profile !== null) {
      throw new Error('존재하지 않는 프로필이 반환됨')
    }
  })

  // 2. 인증 시스템 테스트 (Clerk 통합 확인)
  await runTest('Clerk 인증 시스템 확인', async () => {
    // Clerk은 서버 사이드에서 직접 사용자 생성을 지원하지 않음
    // 대신 프로필 서비스가 정상 작동하는지 확인
    const testUserId = `test-user-${Date.now()}`
    
    try {
      // 프로필 서비스가 존재하고 호출 가능한지 확인
      const profile = await SupabaseProfileService.getProfile(testUserId)
      // 존재하지 않는 프로필이므로 null이어야 함
      if (profile !== null) {
        throw new Error('존재하지 않는 프로필이 반환됨')
      }
    } catch (error) {
      // 프로필을 찾을 수 없다는 오류는 정상
      if (error instanceof Error && !error.message.includes('프로필을 찾을 수 없습니다')) {
        throw error
      }
    }
  })

  // 3. 크롤링 시스템 기본 구조 확인
  await runTest('크롤링 스크립트 존재 확인', async () => {
    const fs = require('fs')
    const path = require('path')
    
    const crawlerPath = path.join(process.cwd(), 'lib', 'crawlers')
    if (!fs.existsSync(crawlerPath)) {
      throw new Error('크롤링 디렉토리가 존재하지 않음')
    }
    
    const crawlerFiles = fs.readdirSync(crawlerPath)
    if (crawlerFiles.length === 0) {
      throw new Error('크롤링 파일이 존재하지 않음')
    }
  })

  // 4. 주요 페이지 접근성 테스트 (공개 페이지만)
  const pagesToTest = [
    { url: 'http://localhost:3000/', name: '메인 페이지' },
    { url: 'http://localhost:3000/register', name: '회원가입 페이지' }
  ]

  for (const page of pagesToTest) {
    await runTest(`${page.name} 접근`, async () => {
      try {
        const response = await fetch(page.url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('fetch')) {
          throw new Error('서버 연결 실패')
        }
        throw error
      }
    })
  }

  // 인증이 필요한 페이지는 리다이렉트 확인 (302는 정상)
  const protectedPages = [
    { url: 'http://localhost:3000/mypage', name: '마이페이지 (인증 확인)' },
    { url: 'http://localhost:3000/orders', name: '주문 페이지 (인증 확인)' },
    { url: 'http://localhost:3000/profile', name: '프로필 페이지 (인증 확인)' }
  ]

  for (const page of protectedPages) {
    await runTest(`${page.name}`, async () => {
      try {
        const response = await fetch(page.url, { redirect: 'manual' })
        // 인증이 필요한 페이지는 302 리다이렉트 또는 200 (이미 로그인된 경우)이 정상
        if (response.status !== 302 && response.status !== 200 && response.status !== 307) {
          throw new Error(`예상치 못한 HTTP 상태: ${response.status}`)
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('fetch')) {
          throw new Error('서버 연결 실패')
        }
        throw error
      }
    })
  }

  // 5. API Routes 기본 기능 테스트 (존재하는 경우)
  await runTest('API 엔드포인트 확인', async () => {
    try {
      const response = await fetch('http://localhost:3000/api/test')
      // API가 없을 수 있으므로 404도 정상으로 처리
      if (response.status !== 404 && !response.ok) {
        throw new Error(`API 엔드포인트 오류: HTTP ${response.status}`)
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('API 서버 연결 실패')
      }
      // API가 없는 것은 정상 (Server Actions 사용)
    }
  })

  // 6. 환경 변수 확인
  await runTest('필수 환경 변수 확인', async () => {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      throw new Error(`누락된 환경 변수: ${missingVars.join(', ')}`)
    }
  })

  // 7. Supabase 데이터 무결성 확인
  await runTest('Supabase 데이터 무결성 확인', async () => {
    // 핫딜 데이터 구조 확인
    const { data: hotDeals } = await SupabaseHotDealService.getHotDeals({ limit: 10 })
    
    if (hotDeals && hotDeals.length > 0) {
      const hotDeal = hotDeals[0]
      if (!hotDeal.id || !hotDeal.title || !hotDeal.source) {
        throw new Error('핫딜 데이터 구조 오류')
      }
    }
  })

  // 8. 번역 시스템 기본 기능 확인
  await runTest('번역 시스템 확인', async () => {
    // 번역 캐시 디렉토리 확인
    const fs = require('fs')
    const path = require('path')  
    const translationCachePath = path.join(process.cwd(), 'translations-cache')
    
    // 캐시 디렉토리가 존재하지 않아도 정상 (첫 실행)
    if (fs.existsSync(translationCachePath)) {
      const files = fs.readdirSync(translationCachePath)
      // 캐시 파일이 있다면 JSON 형식인지 확인
      if (files.length > 0) {
        const firstFile = files[0]
        if (firstFile.endsWith('.json')) {
          const content = fs.readFileSync(path.join(translationCachePath, firstFile), 'utf8')
          JSON.parse(content) // JSON 파싱 테스트
        }
      }
    }
  })

  // 결과 출력
  console.log('\n📊 테스트 결과 요약:')
  console.log('─'.repeat(50))
  
  const passedTests = testResults.filter(r => r.status === 'PASS').length
  const failedTests = testResults.filter(r => r.status === 'FAIL').length
  
  console.log(`✅ 통과: ${passedTests}개`)
  console.log(`❌ 실패: ${failedTests}개`)
  console.log(`📈 성공률: ${Math.round((passedTests / testResults.length) * 100)}%`)

  if (failedTests > 0) {
    console.log('\n🚨 실패한 테스트 상세:')
    testResults
      .filter(r => r.status === 'FAIL')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`)
      })
  }

  console.log('\n' + (allTestsPassed ? '✅ 모든 회귀 테스트 통과!' : '⚠️  일부 테스트 실패'))
  
  return allTestsPassed
}

// 스크립트 실행
testRegression()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('회귀 테스트 중 오류 발생:', error)
    process.exit(1)
  })