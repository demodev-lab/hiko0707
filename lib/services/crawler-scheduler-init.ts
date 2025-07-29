import { crawlerScheduler } from './crawler-scheduler'
import { CrawlerSource } from '@/lib/crawlers/new-crawler-manager'

// 기본 크롤링 스케줄 설정
export function initializeDefaultSchedules() {
  const defaultSchedules: Array<{
    source: CrawlerSource
    schedule: string
    enabled: boolean
  }> = [
    {
      source: 'ppomppu',
      schedule: '*/30 * * * *', // 30분마다
      enabled: true
    },
    {
      source: 'ruliweb',
      schedule: '*/30 * * * *', // 30분마다
      enabled: false // 비활성화 상태로 시작
    },
    {
      source: 'clien',
      schedule: '0 * * * *', // 매시간
      enabled: false
    },
    {
      source: 'quasarzone',
      schedule: '0 * * * *', // 매시간
      enabled: false
    },
    {
      source: 'coolenjoy',
      schedule: '0 */2 * * *', // 2시간마다
      enabled: false
    },
    {
      source: 'itcm',
      schedule: '0 */2 * * *', // 2시간마다
      enabled: false
    }
  ]

  // 기본 스케줄 추가
  defaultSchedules.forEach((config, index) => {
    crawlerScheduler.addJob({
      id: `default_${config.source}_${Date.now()}_${index}`,
      source: config.source,
      schedule: config.schedule,
      enabled: config.enabled,
      status: 'idle'
    })
  })

  console.log('✅ 기본 크롤링 스케줄이 설정되었습니다.')
}

// Next.js 서버 시작 시 자동 실행
if (typeof window === 'undefined') {
  // 서버 환경에서만 실행
  initializeDefaultSchedules()
}