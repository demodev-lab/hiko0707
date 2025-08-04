#!/usr/bin/env tsx
/**
 * Hot Deal UI 통합 테스트
 * UI 컴포넌트들이 Supabase 데이터를 올바르게 표시하는지 확인
 * 
 * 사용법:
 * 1. pnpm tsx scripts/test-hotdeal-ui-integration.ts
 */

import { chromium } from '@playwright/test'

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
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

async function testHotDealListPage() {
  log.section('핫딜 목록 페이지 테스트')
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // 핫딜 목록 페이지 접속
    log.test('핫딜 목록 페이지 로드')
    await page.goto('http://localhost:3000/hotdeals')
    await page.waitForLoadState('networkidle')
    
    // 페이지 제목 확인
    const title = await page.title()
    if (title.includes('핫딜') || title.includes('Hot Deal')) {
      log.pass('페이지 제목 확인')
      passedTests++
    } else {
      log.fail('페이지 제목이 올바르지 않음')
      failedTests++
    }
    
    // 핫딜 카드 존재 확인
    log.test('핫딜 카드 표시 확인')
    const hotdealCards = await page.$$('[data-testid="hotdeal-card"], .hotdeal-card, article')
    
    if (hotdealCards.length > 0) {
      log.pass(`${hotdealCards.length}개의 핫딜 카드 발견`)
      passedTests++
      
      // 첫 번째 카드의 내용 확인
      const firstCard = hotdealCards[0]
      const titleText = await firstCard.$eval('h2, h3, .title', el => el.textContent)
      const priceText = await firstCard.$eval('.price, [class*="price"]', el => el.textContent).catch(() => null)
      
      if (titleText) {
        log.pass('핫딜 제목 표시 확인')
        passedTests++
      } else {
        log.fail('핫딜 제목을 찾을 수 없음')
        failedTests++
      }
      
      if (priceText) {
        log.pass('핫딜 가격 표시 확인')
        passedTests++
      } else {
        log.info('가격 정보가 없는 핫딜일 수 있음')
      }
    } else {
      log.fail('핫딜 카드를 찾을 수 없음')
      failedTests++
    }
    
    // 필터 및 정렬 옵션 확인
    log.test('필터 및 정렬 옵션')
    const categoryFilter = await page.$('select[name*="category"], [data-testid="category-filter"]')
    const sortSelect = await page.$('select[name*="sort"], [data-testid="sort-select"]')
    
    if (categoryFilter) {
      log.pass('카테고리 필터 존재')
      passedTests++
    } else {
      log.fail('카테고리 필터를 찾을 수 없음')
      failedTests++
    }
    
    if (sortSelect) {
      log.pass('정렬 옵션 존재')
      passedTests++
    } else {
      log.fail('정렬 옵션을 찾을 수 없음')
      failedTests++
    }
    
    // 페이지네이션 확인
    log.test('페이지네이션')
    const pagination = await page.$('[role="navigation"], .pagination, [class*="pagination"]')
    
    if (pagination) {
      log.pass('페이지네이션 컴포넌트 존재')
      passedTests++
    } else {
      log.info('페이지네이션이 없거나 데이터가 적을 수 있음')
    }
    
  } catch (error) {
    log.fail(`핫딜 목록 페이지 테스트 오류: ${error}`)
    failedTests++
  } finally {
    await browser.close()
  }
}

async function testHotDealDetailPage() {
  log.section('핫딜 상세 페이지 테스트')
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // 먼저 목록 페이지에서 첫 번째 핫딜 링크 찾기
    await page.goto('http://localhost:3000/hotdeals')
    await page.waitForLoadState('networkidle')
    
    const firstHotDealLink = await page.$('a[href^="/hotdeals/"]:not([href="/hotdeals"])')
    
    if (!firstHotDealLink) {
      log.info('테스트할 핫딜이 없음')
      return
    }
    
    const href = await firstHotDealLink.getAttribute('href')
    log.info(`상세 페이지 테스트: ${href}`)
    
    // 상세 페이지로 이동
    log.test('핫딜 상세 페이지 로드')
    await page.goto(`http://localhost:3000${href}`)
    await page.waitForLoadState('networkidle')
    
    // 주요 요소 확인
    log.test('상세 페이지 요소 확인')
    
    // 제목
    const detailTitle = await page.$('h1')
    if (detailTitle) {
      log.pass('상세 페이지 제목 표시')
      passedTests++
    } else {
      log.fail('상세 페이지 제목을 찾을 수 없음')
      failedTests++
    }
    
    // 이미지
    const image = await page.$('img[alt*="핫딜"], img[alt*="상품"], .product-image img')
    if (image) {
      log.pass('상품 이미지 표시')
      passedTests++
    } else {
      log.fail('상품 이미지를 찾을 수 없음')
      failedTests++
    }
    
    // 가격 정보
    const priceInfo = await page.$('.price, [class*="price"]')
    if (priceInfo) {
      log.pass('가격 정보 표시')
      passedTests++
    } else {
      log.info('가격 정보가 없는 핫딜일 수 있음')
    }
    
    // 구매 버튼
    const buyButton = await page.$('button:has-text("대리구매"), button:has-text("구매")')
    if (buyButton) {
      log.pass('구매 버튼 표시')
      passedTests++
    } else {
      log.fail('구매 버튼을 찾을 수 없음')
      failedTests++
    }
    
    // 원글 링크
    const originalLink = await page.$('a:has-text("원글"), a[target="_blank"]')
    if (originalLink) {
      log.pass('원글 링크 표시')
      passedTests++
    } else {
      log.fail('원글 링크를 찾을 수 없음')
      failedTests++
    }
    
    // 댓글 섹션
    const commentSection = await page.$('[class*="comment"], #comments')
    if (commentSection) {
      log.pass('댓글 섹션 표시')
      passedTests++
    } else {
      log.info('댓글 섹션이 없을 수 있음')
    }
    
  } catch (error) {
    log.fail(`핫딜 상세 페이지 테스트 오류: ${error}`)
    failedTests++
  } finally {
    await browser.close()
  }
}

async function testHomePage() {
  log.section('홈페이지 핫딜 섹션 테스트')
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // 홈페이지 접속
    log.test('홈페이지 로드')
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // 핫딜 섹션 확인
    log.test('홈페이지 핫딜 섹션')
    const hotdealSection = await page.$('section:has-text("핫딜"), section:has-text("Hot Deal"), [class*="hotdeal"]')
    
    if (hotdealSection) {
      log.pass('핫딜 섹션 발견')
      passedTests++
      
      // 핫딜 카드 확인
      const hotdealCards = await hotdealSection.$$('article, .card, [class*="card"]')
      
      if (hotdealCards.length > 0) {
        log.pass(`홈페이지에 ${hotdealCards.length}개의 핫딜 표시`)
        passedTests++
      } else {
        log.fail('홈페이지에 핫딜이 표시되지 않음')
        failedTests++
      }
      
      // 더보기 링크 확인
      const moreLink = await page.$('a[href="/hotdeals"]:has-text("더보기"), a[href="/hotdeals"]:has-text("더 보기")')
      
      if (moreLink) {
        log.pass('핫딜 더보기 링크 존재')
        passedTests++
      } else {
        log.fail('핫딜 더보기 링크를 찾을 수 없음')
        failedTests++
      }
    } else {
      log.fail('홈페이지에서 핫딜 섹션을 찾을 수 없음')
      failedTests++
    }
    
  } catch (error) {
    log.fail(`홈페이지 테스트 오류: ${error}`)
    failedTests++
  } finally {
    await browser.close()
  }
}

async function testTranslationFeature() {
  log.section('번역 기능 테스트')
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // 언어 변경을 위해 localStorage 설정
    await page.goto('http://localhost:3000')
    await page.evaluate(() => {
      localStorage.setItem('hiko-language', 'en')
    })
    
    // 핫딜 목록 페이지 재로드
    log.test('영어로 변경 후 핫딜 목록')
    await page.goto('http://localhost:3000/hotdeals')
    await page.waitForLoadState('networkidle')
    
    // 번역 표시기 확인
    const translationIndicators = await page.$$('[class*="translation"], [data-translated="true"]')
    
    if (translationIndicators.length > 0) {
      log.pass('번역 표시기 발견')
      passedTests++
    } else {
      log.info('번역 표시기가 없거나 번역이 아직 되지 않았을 수 있음')
    }
    
    // 언어 선택기 확인
    const languageSelector = await page.$('select[name*="language"], [data-testid="language-selector"]')
    
    if (languageSelector) {
      log.pass('언어 선택기 존재')
      passedTests++
      
      // 사용 가능한 언어 옵션 확인
      const options = await languageSelector.$$eval('option', opts => opts.map(opt => opt.value))
      
      const expectedLanguages = ['ko', 'en', 'zh', 'vi', 'mn', 'th', 'ja', 'ru']
      const hasAllLanguages = expectedLanguages.every(lang => options.includes(lang))
      
      if (hasAllLanguages) {
        log.pass('모든 지원 언어 옵션 존재')
        passedTests++
      } else {
        log.fail('일부 언어 옵션이 누락됨')
        failedTests++
      }
    } else {
      log.fail('언어 선택기를 찾을 수 없음')
      failedTests++
    }
    
  } catch (error) {
    log.fail(`번역 기능 테스트 오류: ${error}`)
    failedTests++
  } finally {
    await browser.close()
  }
}

async function testAdminHotDealManager() {
  log.section('관리자 핫딜 매니저 테스트')
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // 관리자 페이지 접속
    log.test('관리자 핫딜 매니저 로드')
    await page.goto('http://localhost:3000/admin/hotdeal-manager')
    await page.waitForLoadState('networkidle')
    
    // 로그인 필요 여부 확인
    const isLoginPage = await page.$('input[name="email"], input[name="password"]')
    
    if (isLoginPage) {
      log.info('로그인이 필요함 - 관리자 권한 테스트 스킵')
      return
    }
    
    // 크롤러 선택 옵션
    log.test('크롤러 관리 기능')
    const crawlerSelect = await page.$('select[name*="crawler"], [data-testid="crawler-select"]')
    
    if (crawlerSelect) {
      log.pass('크롤러 선택 옵션 존재')
      passedTests++
      
      const crawlerOptions = await crawlerSelect.$$eval('option', opts => opts.map(opt => opt.value))
      const expectedCrawlers = ['ppomppu', 'ruliweb', 'clien', 'quasarzone', 'coolenjoy', 'itcm']
      
      const hasAllCrawlers = expectedCrawlers.every(crawler => 
        crawlerOptions.some(opt => opt.includes(crawler))
      )
      
      if (hasAllCrawlers) {
        log.pass('모든 크롤러 옵션 존재')
        passedTests++
      } else {
        log.fail('일부 크롤러 옵션이 누락됨')
        failedTests++
      }
    } else {
      log.fail('크롤러 선택 옵션을 찾을 수 없음')
      failedTests++
    }
    
    // 핫딜 목록 테이블
    const hotdealTable = await page.$('table, [role="table"]')
    
    if (hotdealTable) {
      log.pass('핫딜 관리 테이블 존재')
      passedTests++
    } else {
      log.fail('핫딜 관리 테이블을 찾을 수 없음')
      failedTests++
    }
    
  } catch (error) {
    log.fail(`관리자 페이지 테스트 오류: ${error}`)
    failedTests++
  } finally {
    await browser.close()
  }
}

async function runAllTests() {
  console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════╗
║       HotDeal UI 통합 테스트 시작           ║
╚══════════════════════════════════════════════╝
${colors.reset}`)

  log.info('개발 서버가 실행 중인지 확인하세요 (http://localhost:3000)')
  
  // 서버 연결 확인
  try {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto('http://localhost:3000', { timeout: 5000 })
    await browser.close()
    log.pass('개발 서버 연결 확인')
  } catch (error) {
    log.fail('개발 서버에 연결할 수 없습니다. pnpm dev를 실행하세요.')
    process.exit(1)
  }

  // 각 테스트 실행
  await testHotDealListPage()
  await testHotDealDetailPage()
  await testHomePage()
  await testTranslationFeature()
  await testAdminHotDealManager()

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
🎉 모든 UI 테스트가 성공적으로 통과했습니다! 🎉
${colors.reset}`)
  } else {
    console.log(`${colors.yellow}${colors.bold}
⚠️  일부 UI 테스트가 실패했습니다. 
   이는 UI 변경이나 다른 요인 때문일 수 있습니다. ⚠️
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