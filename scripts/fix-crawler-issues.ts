#!/usr/bin/env npx tsx

/**
 * 크롤링 문제 해결 스크립트
 * 
 * 이 스크립트는 다음 문제들을 해결합니다:
 * 1. Playwright 브라우저 설치
 * 2. exports 디렉토리 생성
 * 3. 권한 문제 확인
 * 4. 크롤러 테스트
 */

import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'

async function main() {
  console.log(chalk.blue('🔧 크롤링 문제 해결을 시작합니다...\n'))

  // 1. exports 디렉토리 생성
  try {
    const exportsDir = path.join(process.cwd(), 'exports')
    await fs.mkdir(exportsDir, { recursive: true })
    console.log(chalk.green('✅ exports 디렉토리 생성 완료'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  exports 디렉토리가 이미 존재합니다'))
  }

  // 2. Playwright 브라우저 설치 확인
  try {
    console.log(chalk.cyan('\n🌐 Playwright 브라우저 설치 확인 중...'))
    execSync('npx playwright install chromium', { stdio: 'inherit' })
    console.log(chalk.green('✅ Playwright 브라우저 설치 완료'))
  } catch (error) {
    console.log(chalk.red('❌ Playwright 브라우저 설치 실패'))
    console.log(chalk.yellow('수동으로 실행해주세요: npx playwright install chromium'))
  }

  // 3. 간단한 크롤러 테스트
  try {
    console.log(chalk.cyan('\n🧪 크롤러 테스트 시작...'))
    
    // 간단한 테스트 코드
    const { PpomppuCrawler } = await import('../lib/crawlers/new-ppomppu-crawler')
    const crawler = new PpomppuCrawler({ 
      headless: true, 
      maxPages: 1,
      delay: 1000 
    })
    
    // 브라우저 초기화만 테스트
    await crawler.init()
    await crawler.cleanup()
    
    console.log(chalk.green('✅ 크롤러 기본 테스트 완료'))
    
  } catch (error) {
    console.log(chalk.red('❌ 크롤러 테스트 실패:'))
    console.log(chalk.red(error instanceof Error ? error.message : String(error)))
    
    console.log(chalk.yellow('\n💡 문제 해결 방법:'))
    console.log('1. Playwright 브라우저 수동 설치: npx playwright install')
    console.log('2. Chrome/Chromium이 시스템에 설치되어 있는지 확인')
    console.log('3. 메모리 부족 시 브라우저 옵션 조정')
  }

  // 4. 권한 확인
  try {
    const testFile = path.join(process.cwd(), 'exports', 'test.json')
    await fs.writeFile(testFile, '{"test": true}')
    await fs.unlink(testFile)
    console.log(chalk.green('✅ 파일 시스템 권한 확인 완료'))
  } catch (error) {
    console.log(chalk.red('❌ 파일 시스템 권한 문제:'))
    console.log(chalk.red(error instanceof Error ? error.message : String(error)))
  }

  console.log(chalk.blue('\n🎉 문제 해결 스크립트 완료!'))
  console.log(chalk.gray('이제 다시 크롤링을 시도해보세요.'))
}

main().catch(console.error)