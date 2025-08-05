import { useState, useCallback, useEffect, useRef } from 'react'
import { CrawlerSource } from '@/lib/crawlers/crawler-manager'

export interface CrawlerOptions {
  pages?: number
  headless?: boolean
  saveToDb?: boolean
  saveToJson?: boolean
  groupBySource?: boolean
  timeFilterHours?: number
  manual?: boolean
}

export interface CrawlerResult {
  source: string
  totalDeals: number
  newDeals: number
  updatedDeals: number
  statistics?: any
  crawledAt: Date
}

export interface CrawlerProgress {
  jobId?: string
  source: CrawlerSource
  status: string
  progress: number
  currentPage?: number
  totalPages?: number
  itemsCrawled?: number
}

export interface CrawlJob {
  id: string
  source: CrawlerSource
  schedule: string
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

export function useBackendCrawler() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<CrawlerResult[]>([])
  const [progress, setProgress] = useState<CrawlerProgress | null>(null)
  const [jobs, setJobs] = useState<CrawlJob[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)

  // 크롤링 작업 목록 조회
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/crawler/schedule')
      const data = await response.json()
      
      if (data.success) {
        setJobs(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    }
  }, [])

  // 크롤링 실행
  const crawl = useCallback(async (source: CrawlerSource, options: CrawlerOptions = {}) => {
    setIsLoading(true)
    setError(null)
    setProgress(null)
    
    try {
      const response = await fetch('/api/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          ...options,
          manual: true
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Crawling failed')
      }

      if (data.success) {
        setResults(data.data.results)
        return data.data
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 크롤링 작업 추가
  const addJob = useCallback(async (source: CrawlerSource, schedule: string = '*/30 * * * *') => {
    try {
      const response = await fetch('/api/crawler/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          schedule,
          enabled: true
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add job')
      }

      await fetchJobs()
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add job'
      setError(errorMessage)
      throw err
    }
  }, [fetchJobs])

  // 크롤링 작업 토글
  const toggleJob = useCallback(async (jobId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/crawler/schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          enabled
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle job')
      }

      await fetchJobs()
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle job'
      setError(errorMessage)
      throw err
    }
  }, [fetchJobs])

  // 크롤링 작업 삭제
  const removeJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/crawler/schedule?jobId=${jobId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove job')
      }

      await fetchJobs()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove job'
      setError(errorMessage)
      throw err
    }
  }, [fetchJobs])

  // SSE를 통한 실시간 진행 상황 구독
  const subscribeToProgress = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource('/api/crawler/progress')
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'progress') {
          setProgress(data as CrawlerProgress)
        } else if (data.type === 'complete') {
          setProgress(null)
          // 완료 시 작업 목록 새로고침
          fetchJobs()
        } else if (data.type === 'error') {
          setError(data.error)
          setProgress(null)
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err)
      }
    }

    eventSource.onerror = () => {
      console.error('SSE connection error')
      eventSource.close()
      eventSourceRef.current = null
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [fetchJobs])

  // 컴포넌트 마운트 시 작업 목록 조회 및 SSE 구독
  useEffect(() => {
    fetchJobs()
    const cleanup = subscribeToProgress()
    
    return () => {
      cleanup()
    }
  }, [fetchJobs, subscribeToProgress])

  // 컴포넌트 언마운트 시 SSE 연결 종료
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return {
    crawl,
    isLoading,
    error,
    results,
    progress,
    jobs,
    addJob,
    toggleJob,
    removeJob,
    fetchJobs
  }
}