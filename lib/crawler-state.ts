// 크롤링 상태를 전역으로 관리하는 싱글톤
interface CrawlerProgress {
  isRunning: boolean
  currentStep: string
  progress: number // 0-100
  currentPost: number
  totalPosts: number
  source: string
  timeFilter?: number
  startTime?: Date
  estimatedTimeLeft?: number
}

class CrawlerStateManager {
  private static instance: CrawlerStateManager
  private progress: CrawlerProgress = {
    isRunning: false,
    currentStep: '',
    progress: 0,
    currentPost: 0,
    totalPosts: 0,
    source: ''
  }

  static getInstance(): CrawlerStateManager {
    if (!CrawlerStateManager.instance) {
      CrawlerStateManager.instance = new CrawlerStateManager()
    }
    return CrawlerStateManager.instance
  }

  startCrawling(source: string, timeFilter?: number) {
    this.progress = {
      isRunning: true,
      currentStep: '크롤링 시작 중...',
      progress: 0,
      currentPost: 0,
      totalPosts: 0,
      source,
      timeFilter,
      startTime: new Date()
    }
  }

  updateStep(step: string) {
    this.progress.currentStep = step
  }

  setTotalPosts(total: number) {
    this.progress.totalPosts = total
  }

  updateProgress(currentPost: number, step?: string) {
    this.progress.currentPost = currentPost
    
    if (this.progress.totalPosts > 0) {
      this.progress.progress = Math.round((currentPost / this.progress.totalPosts) * 100)
    }
    
    if (step) {
      this.progress.currentStep = step
    }

    // 예상 완료 시간 계산
    if (this.progress.startTime && currentPost > 0) {
      const elapsed = Date.now() - this.progress.startTime.getTime()
      const avgTimePerPost = elapsed / currentPost
      const remainingPosts = this.progress.totalPosts - currentPost
      this.progress.estimatedTimeLeft = Math.round((remainingPosts * avgTimePerPost) / 1000) // 초 단위
    }
  }

  finishCrawling() {
    this.progress = {
      isRunning: false,
      currentStep: '크롤링 완료',
      progress: 100,
      currentPost: this.progress.totalPosts,
      totalPosts: this.progress.totalPosts,
      source: this.progress.source
    }
    
    // 5초 후 상태 초기화
    setTimeout(() => {
      this.progress = {
        isRunning: false,
        currentStep: '',
        progress: 0,
        currentPost: 0,
        totalPosts: 0,
        source: ''
      }
    }, 5000)
  }

  getProgress(): CrawlerProgress {
    return { ...this.progress }
  }

  reset() {
    this.progress = {
      isRunning: false,
      currentStep: '',
      progress: 0,
      currentPost: 0,
      totalPosts: 0,
      source: ''
    }
  }
}

export const crawlerState = CrawlerStateManager.getInstance()
export type { CrawlerProgress }