#!/usr/bin/env node

import { config } from 'dotenv'
import { CrawlerManager } from '../lib/crawlers/crawler-manager'
import { SupabaseHotDealRepository } from '../lib/db/supabase/repositories/hotdeal-repository'
import chalk from 'chalk'

// 환경변수 로드
config({ path: '.env' })

async function quickTest() {
  console.log(chalk.blue('🚀 Quick Supabase 크롤러 테스트'))
  
  const useSupabase = process.env.USE_SUPABASE === 'true'
  console.log(`- Supabase 사용: ${useSupabase ? '✅' : '❌'}`)
  
  if (!useSupabase) {
    console.log(chalk.red('USE_SUPABASE가 true가 아닙니다.'))
    return
  }
  
  try {
    // 크롤러 매니저 생성 (1페이지만)
    const manager = new CrawlerManager({
      headless: true,
      maxPages: 1,
      delay: 2000,
      timeout: 30000,
      timeFilterHours: 24
    })
    
    console.log(chalk.yellow('\n크롤링 시작 (1페이지만)...'))
    const results = await manager.crawl('ppomppu')
    
    const hotdeals = results[0]?.hotdeals || []
    console.log(chalk.green(`✅ ${hotdeals.length}개 핫딜 크롤링 완료`))
    
    if (hotdeals.length > 0) {
      // Supabase 저장 테스트
      const supabaseRepo = new SupabaseHotDealRepository()
      let saved = 0
      let duplicates = 0
      
      console.log(chalk.yellow('\nSupabase에 저장 중...'))
      
      // 처음 3개만 저장 테스트
      for (let i = 0; i < Math.min(3, hotdeals.length); i++) {
        const hotdeal = hotdeals[i]
        
        try {
          // 중복 확인
          const existing = await supabaseRepo.findBySourceAndPostId(
            hotdeal.source,
            hotdeal.sourcePostId
          )
          
          if (existing) {
            console.log(chalk.gray(`⏭️  중복: ${hotdeal.title}`))
            duplicates++
          } else {
            const result = await supabaseRepo.create(hotdeal)
            if (result) {
              console.log(chalk.green(`✅ 저장: ${hotdeal.title}`))
              saved++
            }
          }
        } catch (error) {
          console.error(chalk.red(`❌ 오류: ${error}`))
        }
      }
      
      console.log(chalk.cyan('\n📊 결과:'))
      console.log(`- 저장된 핫딜: ${saved}개`)
      console.log(`- 중복된 핫딜: ${duplicates}개`)
      
      // Supabase에서 확인
      console.log(chalk.yellow('\nSupabase 데이터 확인...'))
      const allHotdeals = await supabaseRepo.findAll({ limit: 5 })
      console.log(chalk.green(`✅ Supabase에 총 ${allHotdeals.length}개 핫딜 존재`))
      
      if (allHotdeals.length > 0) {
        console.log(chalk.cyan('\n최근 핫딜:'))
        allHotdeals.slice(0, 3).forEach(hd => {
          console.log(`- [${hd.source}] ${hd.title} (${hd.id})`)
        })
      }
    }
    
  } catch (error) {
    console.error(chalk.red('테스트 실패:'), error)
  }
}

// 실행
if (require.main === module) {
  quickTest()
    .then(() => {
      console.log(chalk.blue('\n✅ 테스트 완료'))
      process.exit(0)
    })
    .catch((error) => {
      console.error(chalk.red('\n❌ 오류:'), error)
      process.exit(1)
    })
}