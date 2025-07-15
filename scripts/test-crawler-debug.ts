#!/usr/bin/env npx tsx

/**
 * 크롤러 디버깅 테스트 스크립트
 * 
 * 웹에서 크롤링이 실패할 때 원인을 파악하기 위한 스크립트
 */

// import { runCrawler } from '../actions/crawler-actions' // File deleted
import chalk from 'chalk'

async function testCrawler() {
  console.log(chalk.blue('🔍 크롤러 디버깅 테스트 시작...\n'))
  
  try {
    console.log(chalk.cyan('📋 테스트 설정:'))
    console.log('- 소스: ppomppu')
    console.log('- 페이지: 1')
    console.log('- 헤드리스 모드: true')
    console.log('- JSON 저장: true')
    console.log('')
    
    // const result = await runCrawler({
    //   source: 'ppomppu',
    //   pages: 1,
    //   headless: true,
    //   saveToJson: true,
    //   saveToDb: false,
    //   groupBySource: false
    // })
    
    console.log(chalk.green('✅ 크롤링 테스트 스킵 (크롤러 액션 파일 삭제됨)'))
    console.log('')
    // console.log(chalk.cyan('📊 결과:'))
    // console.log(`성공: ${result.success}`)
    
    // if (result.success) {
    //   console.log(`총 딜 수: ${result.data?.totalDeals || 0}`)
    //   console.log(`내보낸 파일: ${result.data?.exportedFiles?.length || 0}개`)
      
    //   if (result.data?.results) {
    //     result.data.results.forEach((r, i) => {
    //       console.log(`- 소스 ${i + 1}: ${r.source} (${r.totalDeals}개 딜)`)
    //     })
    //   }
      
    //   if (result.data?.exportedFiles) {
    //     console.log('')
    //     console.log(chalk.cyan('📁 내보낸 파일:'))
    //     result.data.exportedFiles.forEach(file => {
    //       console.log(`- ${file}`)
    //     })
    //   }
    // } else {
    //   console.log(chalk.red(`❌ 오류: ${result.error}`))
    // }
    
  } catch (error) {
    console.log(chalk.red('❌ 테스트 실패:'))
    console.log(chalk.red(error instanceof Error ? error.message : String(error)))
    console.log('')
    console.log(chalk.yellow('💡 가능한 원인:'))
    console.log('1. Playwright 브라우저가 설치되지 않았습니다')
    console.log('2. 네트워크 연결 문제입니다')
    console.log('3. 뽐뿌 사이트 구조가 변경되었습니다')
    console.log('4. 메모리 부족 문제입니다')
    
    console.log('')
    console.log(chalk.cyan('🔧 해결 방법:'))
    console.log('1. npx playwright install 실행')
    console.log('2. 인터넷 연결 확인')
    console.log('3. 다른 소스로 테스트')
    console.log('4. 페이지 수를 줄여서 재시도')
  }
}

testCrawler().catch(console.error)