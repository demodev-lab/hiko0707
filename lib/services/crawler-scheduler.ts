import * as cron from 'node-cron'
import { CrawlerManager, CrawlerSource } from '@/lib/crawlers/crawler-manager'
import { EventEmitter } from 'events'

export interface CrawlJob {
  id: string
  source: CrawlerSource
  schedule: string // cron expression
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  status: 'idle' | 'running' | 'failed'
  statistics?: {
    totalCrawled: number
    newDeals: number
    updatedDeals: number
    duration: number
  }
}

export interface CrawlProgress {
  jobId: string
  source: CrawlerSource
  status: string
  progress: number
  currentPage?: number
  totalPages?: number
  itemsCrawled?: number
}

class CrawlerScheduler extends EventEmitter {
  private jobs: Map<string, cron.ScheduledTask> = new Map()
  private jobConfigs: Map<string, CrawlJob> = new Map()
  constructor() {
    super()
    console.log('🟦 CrawlerScheduler 초기화됨')
  }


  // 크롤링 작업 추가
  addJob(job: CrawlJob): void {
    if (this.jobs.has(job.id)) {
      this.removeJob(job.id)
    }

    this.jobConfigs.set(job.id, job)

    if (job.enabled) {
      const task = cron.schedule(job.schedule, async () => {
        await this.executeCrawl(job.id)
      })

      this.jobs.set(job.id, task)
      task.start()
      
      // 다음 실행 시간 계산
      this.updateNextRunTime(job.id)
    }
  }

  // 크롤링 작업 제거
  removeJob(jobId: string): void {
    const task = this.jobs.get(jobId)
    if (task) {
      task.stop()
      this.jobs.delete(jobId)
    }
    this.jobConfigs.delete(jobId)
  }

  // 작업 활성화/비활성화
  toggleJob(jobId: string, enabled: boolean): void {
    const job = this.jobConfigs.get(jobId)
    if (!job) return

    job.enabled = enabled

    if (enabled) {
      this.addJob(job)
    } else {
      const task = this.jobs.get(jobId)
      if (task) {
        task.stop()
        this.jobs.delete(jobId)
      }
    }
  }

  // 크롤링 실행
  private async executeCrawl(jobId: string): Promise<void> {
    const job = this.jobConfigs.get(jobId)
    if (!job) return

    try {
      job.status = 'running'
      job.lastRun = new Date()
      
      // 진행 상황 이벤트 발생
      this.emit('crawl:start', {
        jobId,
        source: job.source,
        startTime: new Date()
      })

      // 크롤링 실행 (이제 크롤러가 직접 Supabase에 저장)
      const crawlerManager = new CrawlerManager({
        headless: true,
        maxPages: 10,
        delay: 4000,
        timeout: 60000,
        timeFilterHours: 24 // 최근 24시간 핫딜만
      })
      
      const results = await crawlerManager.crawl(job.source)
      const result = results[0] // 단일 소스 크롤링이므로 첫 번째 결과 사용
      
      const totalCrawled = result.totalCrawled
      const newDeals = result.newDeals
      const updatedDeals = result.updatedDeals
      const duration = result.duration

      // 진행 상황 업데이트
      this.emit('crawl:progress', {
        jobId,
        source: job.source,
        status: 'processing',
        progress: 100,
        itemsCrawled: totalCrawled
      } as CrawlProgress)

      // 통계 업데이트
      job.statistics = {
        totalCrawled,
        newDeals,
        updatedDeals,
        duration
      }
      job.status = 'idle'

      // 완료 이벤트
      this.emit('crawl:complete', {
        jobId,
        source: job.source,
        statistics: job.statistics,
        endTime: new Date()
      })

      // 다음 실행 시간 업데이트
      this.updateNextRunTime(jobId)

    } catch (error) {
      job.status = 'failed'
      
      this.emit('crawl:error', {
        jobId,
        source: job.source,
        error: error instanceof Error ? error.message : 'Unknown error',
        endTime: new Date()
      })

      console.error(`Crawl job ${jobId} failed:`, error)
    }
  }

  // 수동 크롤링 실행
  async runCrawlManually(source: CrawlerSource, options?: {
    maxPages?: number
    timeFilterHours?: number
  }): Promise<any> {
    const manager = new CrawlerManager({
      headless: true,
      maxPages: options?.maxPages || 10,
      delay: 4000,
      timeout: 60000,
      timeFilterHours: options?.timeFilterHours || 24
    })

    const results = await manager.crawl(source)
    const result = results[0] // 단일 소스 크롤링이므로 첫 번째 결과 사용
    
    return {
      totalCrawled: result.totalCrawled,
      newDeals: result.newDeals,
      updatedDeals: result.updatedDeals,
      results: [{
        source,
        hotdeals: result.hotdeals
      }]
    }
  }

  // 다음 실행 시간 계산
  private updateNextRunTime(jobId: string): void {
    const job = this.jobConfigs.get(jobId)
    if (!job || !job.enabled) return

    // node-cron doesn't provide next run time, so we'll calculate it manually
    // This is a simplified version - you might want to use a library like cron-parser
    const now = new Date()
    const parts = job.schedule.split(' ')
    
    // Simple calculation for common patterns
    if (job.schedule === '*/10 * * * *') { // Every 10 minutes
      job.nextRun = new Date(now.getTime() + 10 * 60 * 1000)
    } else if (job.schedule === '*/30 * * * *') { // Every 30 minutes
      job.nextRun = new Date(now.getTime() + 30 * 60 * 1000)
    } else if (job.schedule === '0 * * * *') { // Every hour
      job.nextRun = new Date(now.getTime() + 60 * 60 * 1000)
    } else if (job.schedule === '0 0 * * *') { // Daily at midnight
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      job.nextRun = tomorrow
    }
  }

  // 모든 작업 가져오기
  getAllJobs(): CrawlJob[] {
    return Array.from(this.jobConfigs.values())
  }

  // 작업 가져오기
  getJob(jobId: string): CrawlJob | undefined {
    return this.jobConfigs.get(jobId)
  }

  // 모든 작업 중지
  stopAll(): void {
    this.jobs.forEach(task => task.stop())
    this.jobs.clear()
  }

  // 모든 작업 시작
  startAll(): void {
    this.jobConfigs.forEach(job => {
      if (job.enabled) {
        this.addJob(job)
      }
    })
  }
}

// 싱글톤 인스턴스
export const crawlerScheduler = new CrawlerScheduler()