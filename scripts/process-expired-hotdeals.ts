#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { HotDealExpiryService } from '@/lib/services/hotdeal-expiry-service'
import type { ExpiryConfig } from '@/lib/services/hotdeal-expiry-service'
import chalk from 'chalk'
import ora from 'ora'

// 환경 변수 로드
dotenv.config()

/**
 * 핫딜 만료 자동 처리 배치 스크립트
 * - 만료된 핫딜을 'ended' 상태로 업데이트
 * - 만료 예정 핫딜 통계 제공
 * - 다양한 실행 옵션 지원
 */

/**
 * 통계 출력
 */
function printExpiryStats(stats: any, config: ExpiryConfig) {
  console.log(chalk.cyan('\n📈 만료 처리 결과:'))
  console.log(chalk.gray(`- 총 확인된 핫딜: ${stats.totalChecked.toLocaleString()}개`))
  console.log(chalk.yellow(`- 만료 처리: ${stats.expired.toLocaleString()}개`))
  console.log(chalk.blue(`- 만료 예정 (${config.warningHours || 24}시간 내): ${stats.expiringSoon.toLocaleString()}개`))
  if (stats.errors > 0) {
    console.log(chalk.red(`- 오류: ${stats.errors.toLocaleString()}개`))
  }
  console.log(chalk.gray(`- 처리 시간: ${(stats.processingTime / 1000).toFixed(2)}초`))

  const successRate = stats.totalChecked > 0 
    ? ((stats.totalChecked - stats.errors) / stats.totalChecked * 100).toFixed(1)
    : '0'

  console.log(chalk.cyan(`\n✨ 성공률: ${successRate}%`))
  
  if (config.dryRun) {
    console.log(chalk.yellow('\n💡 실제 적용하려면 --apply 옵션을 사용하세요'))
  }
}

/**
 * 만료 예정 핫딜 목록 출력
 */
async function showExpiringSoonDeals(hours: number = 24, limit: number = 10) {
  const spinner = ora('만료 예정 핫딜 조회 중...').start()
  
  try {
    const deals = await HotDealExpiryService.getExpiringSoonDeals(hours, limit)
    spinner.succeed(`${hours}시간 내 만료 예정 핫딜 ${deals.length}개 발견`)
    
    if (deals.length === 0) {
      console.log(chalk.green('\n🎉 만료 예정인 핫딜이 없습니다!'))
      return
    }

    console.log(chalk.cyan(`\n⏰ ${hours}시간 내 만료 예정 핫딜 (상위 ${Math.min(limit, deals.length)}개):`))
    
    deals.forEach((deal, index) => {
      const endDate = new Date(deal.end_date)
      const hoursLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60))
      const category = deal.category || '기타'
      
      console.log(chalk.gray(`  ${index + 1}. [${category}] ${deal.title}`))
      console.log(chalk.gray(`     만료: ${endDate.toLocaleString('ko-KR')} (${hoursLeft}시간 후)`))
      console.log(chalk.gray(`     조회: ${deal.views || 0} | 좋아요: ${deal.like_count || 0}`))
      console.log()
    })
  } catch (error) {
    spinner.fail('만료 예정 핫딜 조회 실패')
    console.error(error)
  }
}

/**
 * 전체 만료 통계 출력
 */
async function showExpiryStatistics() {
  const spinner = ora('만료 통계 조회 중...').start()
  
  try {
    const stats = await HotDealExpiryService.getExpiryStatistics()
    spinner.succeed('만료 통계 조회 완료')
    
    console.log(chalk.cyan('\n📊 핫딜 만료 통계:'))
    console.log(chalk.green(`- 활성 핫딜: ${stats.active.toLocaleString()}개`))
    console.log(chalk.red(`- 만료된 핫딜: ${stats.ended.toLocaleString()}개`))
    console.log(chalk.yellow(`- 24시간 내 만료 예정: ${stats.expiringSoon.toLocaleString()}개`))
    console.log(chalk.blue(`- 오늘 만료된 핫딜: ${stats.expiredToday.toLocaleString()}개`))
    
    const totalDeals = stats.active + stats.ended
    const expiryRate = totalDeals > 0 ? (stats.ended / totalDeals * 100).toFixed(1) : '0'
    
    console.log(chalk.cyan(`\n💫 전체 만료율: ${expiryRate}%`))
  } catch (error) {
    spinner.fail('만료 통계 조회 실패')
    console.error(error)
  }
}

/**
 * 특정 핫딜 만료 시간 연장
 */
async function extendHotdeal(hotdealId: string, hours: number = 24) {
  const spinner = ora(`핫딜 만료 시간 ${hours}시간 연장 중...`).start()
  
  try {
    const success = await HotDealExpiryService.extendExpiry(hotdealId, hours)
    
    if (success) {
      spinner.succeed(`핫딜 만료 시간이 ${hours}시간 연장되었습니다`)
    } else {
      spinner.fail('핫딜 만료 시간 연장 실패')
    }
  } catch (error) {
    spinner.fail('핫딜 만료 시간 연장 중 오류 발생')
    console.error(error)
  }
}

/**
 * 메인 함수
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--apply')
  const showStats = args.includes('--stats')
  const showExpiring = args.includes('--expiring')
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '500')
  const warningHours = parseInt(args.find(arg => arg.startsWith('--warning-hours='))?.split('=')[1] || '24')
  const extendId = args.find(arg => arg.startsWith('--extend='))?.split('=')[1]
  const extendHours = parseInt(args.find(arg => arg.startsWith('--extend-hours='))?.split('=')[1] || '24')

  try {
    console.log(chalk.blue('🔄 핫딜 만료 자동 관리 시스템'))
    console.log(chalk.blue('=' .repeat(50)))

    // 만료 통계 표시
    if (showStats) {
      await showExpiryStatistics()
      return
    }

    // 만료 예정 핫딜 표시
    if (showExpiring) {
      await showExpiringSoonDeals(warningHours, 20)
      return
    }

    // 특정 핫딜 만료 시간 연장
    if (extendId) {
      await extendHotdeal(extendId, extendHours)
      return
    }

    // 만료 처리 설정
    const config: ExpiryConfig = {
      batchSize,
      warningHours,
      dryRun
    }

    console.log(chalk.cyan('\n⚙️  처리 설정:'))
    console.log(chalk.gray(`- 배치 크기: ${config.batchSize}개`))
    console.log(chalk.gray(`- 만료 예정 기준: ${config.warningHours}시간`))
    console.log(chalk.gray(`- 실행 모드: ${dryRun ? 'DRY RUN' : 'APPLY'}`))

    // 사전 통계 조회
    console.log(chalk.cyan('\n📊 처리 전 통계:'))
    const beforeStats = await HotDealExpiryService.getExpiryStatistics()
    console.log(chalk.gray(`- 활성: ${beforeStats.active}개, 만료: ${beforeStats.ended}개`))

    // 만료 처리 실행
    const stats = await HotDealExpiryService.processExpiredDeals(config)
    printExpiryStats(stats, config)

    // 처리 후 통계 (실제 적용한 경우만)
    if (!dryRun && stats.expired > 0) {
      console.log(chalk.cyan('\n📊 처리 후 통계:'))
      const afterStats = await HotDealExpiryService.getExpiryStatistics()
      console.log(chalk.gray(`- 활성: ${afterStats.active}개, 만료: ${afterStats.ended}개`))
      console.log(chalk.green(`- 변경된 핫딜: ${stats.expired}개`))
    }

  } catch (error) {
    console.error(chalk.red('\n❌ 작업 실패:'), error)
    process.exit(1)
  }
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(chalk.cyan('\n📖 사용법:'))
  console.log(chalk.gray('기본 실행 (dry-run):'))
  console.log(chalk.white('  npx tsx scripts/process-expired-hotdeals.ts'))
  console.log(chalk.gray('\n실제 적용:'))
  console.log(chalk.white('  npx tsx scripts/process-expired-hotdeals.ts --apply'))
  console.log(chalk.gray('\n통계 조회:'))
  console.log(chalk.white('  npx tsx scripts/process-expired-hotdeals.ts --stats'))
  console.log(chalk.gray('\n만료 예정 핫딜 조회:'))
  console.log(chalk.white('  npx tsx scripts/process-expired-hotdeals.ts --expiring'))
  console.log(chalk.gray('\n특정 핫딜 만료 시간 연장:'))
  console.log(chalk.white('  npx tsx scripts/process-expired-hotdeals.ts --extend=핫딜ID --extend-hours=24'))
  console.log(chalk.gray('\n옵션:'))
  console.log(chalk.white('  --batch-size=500      배치 크기 (기본: 500)'))
  console.log(chalk.white('  --warning-hours=24    만료 예정 기준 시간 (기본: 24)'))
  console.log(chalk.white('  --apply               실제 적용 (기본: dry-run)'))
}

// 도움말 표시
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage()
} else {
  // 스크립트 실행
  if (require.main === module) {
    main()
  }
}