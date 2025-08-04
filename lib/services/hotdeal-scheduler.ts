import cron from 'node-cron'
import { HotDealExpiryService } from './hotdeal-expiry-service'
import chalk from 'chalk'

/**
 * 핫딜 자동 관리 스케줄러
 * - 매시간 만료된 핫딜 처리
 * - 매일 정기 통계 리포트
 * - 시스템 상태 모니터링
 */
export class HotDealScheduler {
  private static instance: HotDealScheduler | null = null
  private scheduledTasks: cron.ScheduledTask[] = []
  private isRunning = false

  private constructor() {}

  static getInstance(): HotDealScheduler {
    if (!this.instance) {
      this.instance = new HotDealScheduler()
    }
    return this.instance
  }

  /**
   * 스케줄러 시작
   */
  start(): void {
    if (this.isRunning) {
      console.log(chalk.yellow('⚠️  스케줄러가 이미 실행 중입니다'))
      return
    }

    console.log(chalk.blue('🚀 핫딜 스케줄러 시작'))
    console.log(chalk.blue('=' .repeat(50)))

    // 1. 매시간 만료 처리 (정시마다 실행)
    const expiryTask = cron.schedule('0 * * * *', async () => {
      await this.runExpiryProcess()
    }, {
      scheduled: false,
      timezone: 'Asia/Seoul'
    })

    // 2. 매일 오전 9시 통계 리포트
    const dailyReportTask = cron.schedule('0 9 * * *', async () => {
      await this.runDailyReport()
    }, {
      scheduled: false,
      timezone: 'Asia/Seoul'
    })

    // 3. 매주 일요일 오전 6시 시스템 정리
    const weeklyCleanupTask = cron.schedule('0 6 * * 0', async () => {
      await this.runWeeklyCleanup()
    }, {
      scheduled: false,
      timezone: 'Asia/Seoul'
    })

    // 스케줄 시작
    expiryTask.start()
    dailyReportTask.start()
    weeklyCleanupTask.start()

    this.scheduledTasks = [expiryTask, dailyReportTask, weeklyCleanupTask]
    this.isRunning = true

    console.log(chalk.green('✅ 스케줄러가 성공적으로 시작되었습니다'))
    console.log(chalk.cyan('📋 실행 스케줄:'))
    console.log(chalk.gray('  - 만료 처리: 매시간 정시 (0분)'))
    console.log(chalk.gray('  - 일일 리포트: 매일 오전 9시'))
    console.log(chalk.gray('  - 주간 정리: 매주 일요일 오전 6시'))
  }

  /**
   * 스케줄러 중지
   */
  stop(): void {
    if (!this.isRunning) {
      console.log(chalk.yellow('⚠️  스케줄러가 실행 중이 아닙니다'))
      return
    }

    console.log(chalk.yellow('🛑 스케줄러 중지 중...'))
    
    this.scheduledTasks.forEach(task => {
      task.stop()
      task.destroy()
    })

    this.scheduledTasks = []
    this.isRunning = false

    console.log(chalk.green('✅ 스케줄러가 성공적으로 중지되었습니다'))
  }

  /**
   * 스케줄러 상태 확인
   */
  getStatus(): { running: boolean; tasksCount: number; nextExecutions: string[] } {
    const nextExecutions = this.scheduledTasks
      .filter(task => task.getStatus() === 'scheduled')
      .map(task => {
        // cron 패턴에서 다음 실행 시간 추정 (간단한 구현)
        const now = new Date()
        const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0)
        return nextHour.toLocaleString('ko-KR')
      })

    return {
      running: this.isRunning,
      tasksCount: this.scheduledTasks.length,
      nextExecutions
    }
  }

  /**
   * 만료 처리 실행
   */
  private async runExpiryProcess(): Promise<void> {
    const timestamp = new Date().toLocaleString('ko-KR')
    console.log(chalk.cyan(`\n🕐 [${timestamp}] 정기 만료 처리 시작`))

    try {
      const stats = await HotDealExpiryService.processExpiredDeals({
        batchSize: 500,
        warningHours: 24,
        dryRun: false // 실제 적용
      })

      console.log(chalk.green(`✅ 만료 처리 완료:`))
      console.log(chalk.gray(`   - 확인: ${stats.totalChecked}개`))
      console.log(chalk.yellow(`   - 만료: ${stats.expired}개`))
      console.log(chalk.blue(`   - 예정: ${stats.expiringSoon}개`))
      
      if (stats.errors > 0) {
        console.log(chalk.red(`   - 오류: ${stats.errors}개`))
      }

      // 만료된 핫딜이 많은 경우 알림
      if (stats.expired > 50) {
        console.log(chalk.yellow(`⚠️  많은 핫딜이 만료되었습니다: ${stats.expired}개`))
      }

    } catch (error) {
      console.error(chalk.red(`❌ 만료 처리 실패 [${timestamp}]:`, error))
    }
  }

  /**
   * 일일 통계 리포트
   */
  private async runDailyReport(): Promise<void> {
    const timestamp = new Date().toLocaleString('ko-KR')
    console.log(chalk.cyan(`\n📊 [${timestamp}] 일일 통계 리포트 생성`))

    try {
      const stats = await HotDealExpiryService.getExpiryStatistics()
      
      console.log(chalk.cyan('📈 핫딜 현황:'))
      console.log(chalk.green(`   활성 핫딜: ${stats.active.toLocaleString()}개`))
      console.log(chalk.red(`   만료된 핫딜: ${stats.ended.toLocaleString()}개`))
      console.log(chalk.yellow(`   24시간 내 만료 예정: ${stats.expiringSoon.toLocaleString()}개`))
      console.log(chalk.blue(`   오늘 만료된 핫딜: ${stats.expiredToday.toLocaleString()}개`))

      const totalDeals = stats.active + stats.ended
      const expiryRate = totalDeals > 0 ? (stats.ended / totalDeals * 100).toFixed(1) : '0'
      console.log(chalk.cyan(`   전체 만료율: ${expiryRate}%`))

      // 만료 예정 핫딜이 많은 경우 알림
      if (stats.expiringSoon > 100) {
        console.log(chalk.yellow(`⚠️  많은 핫딜이 만료 예정입니다: ${stats.expiringSoon}개`))
      }

    } catch (error) {
      console.error(chalk.red(`❌ 일일 리포트 생성 실패 [${timestamp}]:`, error))
    }
  }

  /**
   * 주간 시스템 정리
   */
  private async runWeeklyCleanup(): Promise<void> {
    const timestamp = new Date().toLocaleString('ko-KR')
    console.log(chalk.cyan(`\n🧹 [${timestamp}] 주간 시스템 정리 시작`))

    try {
      // 통계 수집
      const stats = await HotDealExpiryService.getExpiryStatistics()
      
      console.log(chalk.cyan('📊 주간 시스템 상태:'))
      console.log(chalk.green(`   활성 핫딜: ${stats.active.toLocaleString()}개`))
      console.log(chalk.red(`   만료된 핫딜: ${stats.ended.toLocaleString()}개`))
      
      // 향후 확장 가능한 정리 작업들
      // - 오래된 로그 정리
      // - 임시 파일 정리
      // - 캐시 최적화
      // - 데이터베이스 인덱스 최적화

      console.log(chalk.green(`✅ 주간 정리 완료`))

    } catch (error) {
      console.error(chalk.red(`❌ 주간 정리 실패 [${timestamp}]:`, error))
    }
  }

  /**
   * 수동 만료 처리 실행
   */
  async runManualExpiry(): Promise<void> {
    console.log(chalk.blue('🔧 수동 만료 처리 실행'))
    await this.runExpiryProcess()
  }

  /**
   * 수동 통계 리포트 실행
   */
  async runManualReport(): Promise<void> {
    console.log(chalk.blue('🔧 수동 통계 리포트 실행'))
    await this.runDailyReport()
  }
}