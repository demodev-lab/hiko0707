#!/usr/bin/env node

import { config } from 'dotenv'
import { crawlerScheduler } from '../lib/services/crawler-scheduler'
import chalk from 'chalk'

// 환경변수 로드
config({ path: '.env' })

async function testSupabaseCrawler() {
  console.log(chalk.blue('🧪 Supabase 크롤러 테스트 시작'))
  
  // 환경변수 확인
  console.log(chalk.yellow('\n📋 환경변수 확인:'))
  console.log(`- USE_SUPABASE: ${process.env.USE_SUPABASE}`)
  console.log(`- SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}`)
  console.log(`- SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}`)
  console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 없음'}`)
  
  if (process.env.USE_SUPABASE !== 'true') {
    console.log(chalk.red('\n❌ USE_SUPABASE가 true로 설정되지 않았습니다.'))
    console.log(chalk.yellow('💡 .env.local 파일에 USE_SUPABASE=true를 추가하세요.'))
    return
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(chalk.red('\n❌ Supabase 환경변수가 설정되지 않았습니다.'))
    console.log(chalk.yellow('💡 .env.local 파일에 Supabase 관련 환경변수를 추가하세요.'))
    return
  }
  
  try {
    console.log(chalk.green('\n✅ 환경변수 설정 완료'))
    console.log(chalk.blue('\n🚀 테스트 크롤링 시작 (최대 5페이지)'))
    
    // 수동 크롤링 실행 (테스트용으로 5페이지만)
    const result = await crawlerScheduler.runCrawlManually('ppomppu', {
      maxPages: 5,
      timeFilterHours: 24
    })
    
    console.log(chalk.green('\n✅ 크롤링 완료!'))
    console.log(chalk.cyan('📊 결과:'))
    console.log(`- 총 크롤링된 핫딜: ${result.totalCrawled}개`)
    console.log(`- 새로 추가된 핫딜: ${result.newDeals}개`)
    console.log(`- 업데이트된 핫딜: ${result.updatedDeals}개`)
    
    if (result.newDeals > 0 || result.updatedDeals > 0) {
      console.log(chalk.green('\n🎉 Supabase에 데이터가 성공적으로 저장되었습니다!'))
      console.log(chalk.yellow('💡 Supabase Dashboard에서 hotdeals 테이블을 확인해보세요.'))
    } else if (result.totalCrawled > 0) {
      console.log(chalk.yellow('\n⚠️  모든 핫딜이 이미 존재합니다 (중복).'))
    } else {
      console.log(chalk.red('\n❌ 크롤링된 핫딜이 없습니다.'))
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ 테스트 실패:'), error)
    if (error instanceof Error && error.message.includes('relation "hotdeals" does not exist')) {
      console.log(chalk.yellow('\n💡 hotdeals 테이블이 없습니다. 먼저 마이그레이션을 실행하세요:'))
      console.log(chalk.yellow('   Supabase Dashboard SQL Editor에서 000_crawler_tables.sql 실행'))
    }
  }
}

// 실행
if (require.main === module) {
  testSupabaseCrawler()
    .then(() => {
      console.log(chalk.blue('\n✅ 테스트 완료'))
      process.exit(0)
    })
    .catch((error) => {
      console.error(chalk.red('\n❌ 테스트 오류:'), error)
      process.exit(1)
    })
}