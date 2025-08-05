import { CrawlerManager } from '../lib/crawlers/crawler-manager'
import { SupabaseHotDealRepository } from '../lib/db/supabase/repositories/hotdeal-repository'
import dotenv from 'dotenv'
import chalk from 'chalk'

// Load environment variables
dotenv.config()

async function testQuasarzoneCrawler() {
  console.log(chalk.cyan('🔍 퀘이사존 크롤러 테스트 시작...\n'))

  // 1. Test Supabase connection first
  console.log(chalk.blue('1️⃣ Supabase 연결 테스트'))
  try {
    const repository = new SupabaseHotDealRepository()
    
    // Try to find an existing post
    const existingPost = await repository.findBySourceAndPostId('quasarzone', 'test-1234')
    console.log(chalk.green('✅ Supabase 연결 성공!'))
    console.log(chalk.gray(`- 기존 포스트 조회 결과: ${existingPost ? '찾음' : '없음'}`))
  } catch (error) {
    console.error(chalk.red('❌ Supabase 연결 오류:'), error)
    return
  }

  // 2. Test the actual crawler
  console.log(chalk.blue('\n2️⃣ 퀘이사존 크롤러 실행 테스트'))
  try {
    const manager = new CrawlerManager({
      headless: true,  // Set to false if you want to see the browser
      maxPages: 1,     // Only crawl 1 page for testing
      delay: 3000,
      onProgress: (current, total, step) => {
        console.log(chalk.gray(`진행: ${current}/${total} - ${step}`))
      }
    })

    console.log(chalk.yellow('크롤링 시작... (첫 페이지만)'))
    const results = await manager.crawl('quasarzone')
    
    if (results.length > 0) {
      const result = results[0]
      console.log(chalk.green('\n✅ 크롤링 완료!'))
      console.log(chalk.cyan('📊 결과 통계:'))
      console.log(chalk.gray(`- 총 수집: ${result.totalCrawled}개`))
      console.log(chalk.gray(`- 신규: ${result.newDeals}개`))
      console.log(chalk.gray(`- 업데이트: ${result.updatedDeals}개`))
      console.log(chalk.gray(`- 오류: ${result.errors}개`))
      console.log(chalk.gray(`- 소요시간: ${result.duration}ms`))
      
      if (result.hotdeals.length > 0) {
        console.log(chalk.cyan('\n📋 첫 번째 핫딜 정보:'))
        const firstDeal = result.hotdeals[0]
        console.log(chalk.gray(`- 제목: ${firstDeal.title}`))
        console.log(chalk.gray(`- 소스 ID: ${firstDeal.source_id}`))
        console.log(chalk.gray(`- 카테고리: ${firstDeal.category}`))
        console.log(chalk.gray(`- 가격: ${firstDeal.sale_price.toLocaleString()}원`))
        console.log(chalk.gray(`- 판매처: ${firstDeal.seller}`))
        console.log(chalk.gray(`- 무료배송: ${firstDeal.is_free_shipping ? '예' : '아니오'}`))
        console.log(chalk.gray(`- 작성자: ${firstDeal.author_name}`))
        console.log(chalk.gray(`- 조회수: ${firstDeal.views.toLocaleString()}`))
        console.log(chalk.gray(`- 추천수: ${firstDeal.like_count}`))
        console.log(chalk.gray(`- URL: ${firstDeal.original_url}`))
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ 크롤러 실행 오류:'), error)
  }

  console.log(chalk.green('\n✅ 퀘이사존 크롤러 테스트 완료!'))
}

// Run the test
testQuasarzoneCrawler().catch(console.error)