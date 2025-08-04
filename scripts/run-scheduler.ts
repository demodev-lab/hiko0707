#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { HotDealScheduler } from '@/lib/services/hotdeal-scheduler'
import chalk from 'chalk'

// 환경 변수 로드
dotenv.config()

/**
 * 핫딜 스케줄러 실행 스크립트
 * - 스케줄러 시작/중지/상태 확인
 * - 수동 작업 실행
 */

function printUsage() {
  console.log(chalk.cyan('\n📖 사용법:'))
  console.log(chalk.gray('스케줄러 시작:'))
  console.log(chalk.white('  npx tsx scripts/run-scheduler.ts start'))
  console.log(chalk.gray('\n스케줄러 상태 확인:'))
  console.log(chalk.white('  npx tsx scripts/run-scheduler.ts status'))
  console.log(chalk.gray('\n수동 만료 처리:'))
  console.log(chalk.white('  npx tsx scripts/run-scheduler.ts manual-expiry'))
  console.log(chalk.gray('\n수동 통계 리포트:'))
  console.log(chalk.white('  npx tsx scripts/run-scheduler.ts manual-report'))
  console.log(chalk.gray('\n데몬 모드 (백그라운드 실행):'))
  console.log(chalk.white('  npx tsx scripts/run-scheduler.ts daemon'))
  console.log(chalk.gray('\n옵션:'))
  console.log(chalk.white('  --help, -h        도움말 표시'))
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  // 도움말 표시
  if (args.includes('--help') || args.includes('-h') || !command) {
    printUsage()
    return
  }

  console.log(chalk.blue('🔄 핫딜 스케줄러 관리 도구'))
  console.log(chalk.blue('=' .repeat(50)))

  const scheduler = HotDealScheduler.getInstance()

  try {
    switch (command) {
      case 'start':
        console.log(chalk.cyan('\n🚀 스케줄러 시작 중...'))
        scheduler.start()
        
        // 프로세스 종료 핸들러
        process.on('SIGINT', () => {
          console.log(chalk.yellow('\n\n🛑 종료 신호 감지됨'))
          scheduler.stop()
          process.exit(0)
        })

        process.on('SIGTERM', () => {
          console.log(chalk.yellow('\n\n🛑 종료 신호 감지됨'))
          scheduler.stop()
          process.exit(0)
        })

        // 스케줄러를 계속 실행하기 위해 대기
        console.log(chalk.gray('\n💡 Ctrl+C를 눌러 종료하세요'))
        await new Promise(() => {}) // 무한 대기
        break

      case 'status':
        console.log(chalk.cyan('\n📊 스케줄러 상태 확인'))
        const status = scheduler.getStatus()
        
        console.log(chalk.gray(`실행 상태: ${status.running ? chalk.green('실행 중') : chalk.red('중지됨')}`))
        console.log(chalk.gray(`스케줄된 작업: ${status.tasksCount}개`))
        
        if (status.nextExecutions.length > 0) {
          console.log(chalk.gray('다음 실행 예정:'))
          status.nextExecutions.forEach((time, index) => {
            console.log(chalk.gray(`  ${index + 1}. ${time}`))
          })
        }
        break

      case 'manual-expiry':
        console.log(chalk.cyan('\n🔧 수동 만료 처리 실행'))
        await scheduler.runManualExpiry()
        break

      case 'manual-report':
        console.log(chalk.cyan('\n🔧 수동 통계 리포트 실행'))
        await scheduler.runManualReport()
        break

      case 'daemon':
        console.log(chalk.cyan('\n👹 데몬 모드로 스케줄러 시작'))
        scheduler.start()
        
        // 프로세스 종료 핸들러
        process.on('SIGINT', () => {
          console.log(chalk.yellow('\n🛑 데몬 종료'))
          scheduler.stop()
          process.exit(0)
        })

        process.on('SIGTERM', () => {
          console.log(chalk.yellow('\n🛑 데몬 종료'))
          scheduler.stop()
          process.exit(0)
        })

        // 백그라운드에서 계속 실행
        console.log(chalk.green('✅ 데몬이 백그라운드에서 실행 중입니다'))
        console.log(chalk.gray('종료하려면 프로세스를 kill하세요'))
        
        // 무한 대기
        setInterval(() => {
          // 5분마다 상태 체크 (선택사항)
        }, 5 * 60 * 1000)
        
        await new Promise(() => {}) // 무한 대기
        break

      default:
        console.error(chalk.red(`❌ 알 수 없는 명령어: ${command}`))
        printUsage()
        process.exit(1)
    }

  } catch (error) {
    console.error(chalk.red('\n❌ 작업 실패:'), error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  main()
}