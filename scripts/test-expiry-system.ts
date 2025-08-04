#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { supabaseAdmin } from '@/lib/supabase/client'
import { HotDealExpiryService } from '@/lib/services/hotdeal-expiry-service'
import chalk from 'chalk'

dotenv.config()

/**
 * 만료 시스템 테스트 스크립트
 */
async function testExpirySystem() {
  const supabase = supabaseAdmin()
  if (!supabase) {
    console.error(chalk.red('❌ Supabase 클라이언트 초기화 실패'))
    process.exit(1)
  }

  try {
    console.log(chalk.blue('🧪 만료 시스템 테스트 시작'))
    console.log(chalk.blue('=' .repeat(50)))

    // 1. 현재 상태 확인
    console.log(chalk.cyan('\n📊 테스트 전 상태:'))
    const beforeStats = await HotDealExpiryService.getExpiryStatistics()
    console.log(chalk.gray(`- 활성: ${beforeStats.active}개, 만료: ${beforeStats.ended}개`))

    // 2. 테스트용으로 2개 핫딜을 과거 시간으로 설정
    console.log(chalk.cyan('\n⏰ 테스트용 만료 설정 중...'))
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2시간 전
    
    // 먼저 2개 핫딜 조회
    const { data: dealsToUpdate, error: fetchError } = await supabase
      .from('hot_deals')
      .select('id, title, end_date')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(2)

    if (fetchError) {
      throw new Error(`테스트 핫딜 조회 실패: ${fetchError.message}`)
    }

    // 조회된 핫딜들의 만료 시간 업데이트
    const testDeals = []
    if (dealsToUpdate && dealsToUpdate.length > 0) {
      for (const deal of dealsToUpdate) {
        const { data, error: updateError } = await supabase
          .from('hot_deals')
          .update({ end_date: pastDate })
          .eq('id', deal.id)
          .select('id, title, end_date')
          .single()

        if (updateError) {
          throw new Error(`핫딜 ${deal.id} 업데이트 실패: ${updateError.message}`)
        }
        testDeals.push(data)
      }
    }


    console.log(chalk.green('✅ 테스트용 만료 설정 완료:'))
    testDeals?.forEach(deal => {
      console.log(chalk.gray(`- ${deal.title}: ${new Date(deal.end_date).toLocaleString('ko-KR')}`))
    })

    // 3. 만료 처리 실행 (실제 적용)
    console.log(chalk.cyan('\n🔄 만료 처리 실행 중...'))
    const stats = await HotDealExpiryService.processExpiredDeals({
      dryRun: false, // 실제 적용
      batchSize: 100,
      warningHours: 24
    })

    console.log(chalk.green('\n✅ 만료 처리 결과:'))
    console.log(chalk.gray(`- 총 확인: ${stats.totalChecked}개`))
    console.log(chalk.yellow(`- 만료 처리: ${stats.expired}개`))
    console.log(chalk.blue(`- 만료 예정: ${stats.expiringSoon}개`))
    console.log(chalk.red(`- 오류: ${stats.errors}개`))

    // 4. 처리 후 상태 확인
    console.log(chalk.cyan('\n📊 테스트 후 상태:'))
    const afterStats = await HotDealExpiryService.getExpiryStatistics()
    console.log(chalk.gray(`- 활성: ${afterStats.active}개, 만료: ${afterStats.ended}개`))
    console.log(chalk.green(`- 변경: +${afterStats.ended - beforeStats.ended}개 만료됨`))

    // 5. 만료된 핫딜 확인
    if (afterStats.ended > beforeStats.ended) {
      console.log(chalk.cyan('\n🔍 새로 만료된 핫딜 확인:'))
      const { data: expiredDeals } = await supabase
        .from('hot_deals')
        .select('id, title, status, end_date, updated_at')
        .eq('status', 'ended')
        .order('updated_at', { ascending: false })
        .limit(5)

      expiredDeals?.forEach((deal, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${deal.title}`))
        console.log(chalk.gray(`     상태: ${deal.status}, 만료: ${new Date(deal.end_date).toLocaleString('ko-KR')}`))
      })
    }

    console.log(chalk.green('\n🎉 만료 시스템 테스트 완료!'))

  } catch (error) {
    console.error(chalk.red('\n❌ 테스트 실패:'), error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  testExpirySystem()
}