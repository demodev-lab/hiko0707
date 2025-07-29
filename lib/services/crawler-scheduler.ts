import * as cron from 'node-cron'
import { HotdealCrawlerManager, CrawlerSource } from '@/lib/crawlers/new-crawler-manager'
import { db } from '@/lib/db/database-service'
import { SupabaseHotDealRepository } from '@/lib/db/supabase/repositories/hotdeal-repository'
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
  private crawlerManager: HotdealCrawlerManager
  private supabaseRepository: SupabaseHotDealRepository
  private useSupabase: boolean = false

  constructor() {
    super()
    this.crawlerManager = new HotdealCrawlerManager({
      headless: true,
      maxPages: 10,
      delay: 4000,
      timeout: 60000,
      timeFilterHours: 24 // 최근 24시간 핫딜만
    })
    this.supabaseRepository = new SupabaseHotDealRepository()
    
    // 환경변수로 Supabase 사용 여부 결정
    this.useSupabase = process.env.USE_SUPABASE === 'true' && 
                       !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
                       !!process.env.SUPABASE_SERVICE_ROLE_KEY
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
      }, {
        scheduled: false
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

      // 크롤링 실행
      const startTime = Date.now()
      const results = await this.crawlerManager.crawl(job.source)
      
      let totalCrawled = 0
      let newDeals = 0
      let updatedDeals = 0

      // 결과 처리 및 저장
      for (const result of results) {
        totalCrawled += result.hotdeals.length

        for (const hotdeal of result.hotdeals) {
          try {
            if (this.useSupabase) {
              // Supabase에 저장
              const existing = await this.supabaseRepository.findBySourceAndPostId(
                hotdeal.source,
                hotdeal.sourcePostId
              )
              
              if (existing) {
                await this.supabaseRepository.update(existing.id, hotdeal)
                updatedDeals++
              } else {
                await this.supabaseRepository.create(hotdeal)
                newDeals++
              }
            } else {
              // 기존 LocalStorage 방식
              const existing = await db.hotdeals.findOne(hd => 
                hd.source === hotdeal.source && 
                hd.sourcePostId === hotdeal.sourcePostId
              )
              
              if (existing) {
                await db.hotdeals.update(existing.id, {
                  ...hotdeal,
                  id: existing.id
                })
                updatedDeals++
              } else {
                await db.hotdeals.create(hotdeal)
                newDeals++
              }
            }
          } catch (error) {
            console.error('Failed to save hotdeal:', error)
          }
        }

        // 진행 상황 업데이트
        this.emit('crawl:progress', {
          jobId,
          source: job.source,
          status: 'processing',
          progress: 80,
          itemsCrawled: totalCrawled
        } as CrawlProgress)
      }

      const duration = Date.now() - startTime

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
    const manager = new HotdealCrawlerManager({
      headless: true,
      maxPages: options?.maxPages || 10,
      delay: 4000,
      timeout: 60000,
      timeFilterHours: options?.timeFilterHours || 24
    })

    const results = await manager.crawl(source)
    
    let totalCrawled = 0
    let newDeals = 0
    let updatedDeals = 0

    for (const result of results) {
      totalCrawled += result.hotdeals.length

      for (const hotdeal of result.hotdeals) {
        try {
          if (this.useSupabase) {
            // Supabase에 저장
            const existing = await this.supabaseRepository.findBySourceAndPostId(
              hotdeal.source,
              hotdeal.sourcePostId
            )
            
            if (existing) {
              await this.supabaseRepository.update(existing.id, hotdeal)
              updatedDeals++
            } else {
              await this.supabaseRepository.create(hotdeal)
              newDeals++
            }
          } else {
            // 기존 LocalStorage 방식
            const existing = await db.hotdeals.findOne(hd => 
              hd.source === hotdeal.source && 
              hd.sourcePostId === hotdeal.sourcePostId
            )
            
            if (existing) {
              await db.hotdeals.update(existing.id, {
                ...hotdeal,
                id: existing.id
              })
              updatedDeals++
            } else {
              await db.hotdeals.create(hotdeal)
              newDeals++
            }
          }
        } catch (error) {
          console.error('Failed to save hotdeal:', error)
        }
      }
    }

    return {
      totalCrawled,
      newDeals,
      updatedDeals,
      results
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