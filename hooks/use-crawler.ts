'use client'

import { useState, useCallback } from 'react'
import { HotDealSource } from '@/types/hotdeal'
import { CrawlerFactory } from '@/lib/crawlers/crawler-factory'
import { CrawlerResult } from '@/lib/crawlers/types'
import { toast } from 'sonner'

export interface CrawlOptions {
  sources: HotDealSource[]
  maxPages?: number
  concurrent?: boolean
  pageDelay?: number
  detailDelay?: number
  skipDetail?: boolean
}

export function useCrawler() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<Map<HotDealSource, CrawlerResult>>(new Map())
  const [errors, setErrors] = useState<Map<HotDealSource, string>>(new Map())

  // 단일 소스 크롤링
  const crawlSource = useCallback(async (
    source: HotDealSource,
    options: Omit<CrawlOptions, 'sources'>
  ): Promise<CrawlerResult> => {
    try {
      console.log(`🔍 ${source} 크롤링 시작...`)
      
      const crawler = CrawlerFactory.createCrawler(source)
      const result = await crawler.crawl({
        maxPages: options.maxPages || 1,
        pageDelay: options.pageDelay || 2000,
        detailDelay: options.detailDelay || 1000,
        skipDetail: options.skipDetail || false
      })
      
      if (result.success) {
        console.log(`✅ ${source} 크롤링 완료: ${result.stats.totalCrawled}개`)
      } else {
        console.error(`❌ ${source} 크롤링 실패:`, result.error)
      }
      
      return result
    } catch (error) {
      console.error(`❌ ${source} 크롤링 오류:`, error)
      throw error
    }
  }, [])

  // 다중 소스 크롤링
  const crawl = useCallback(async (options: CrawlOptions) => {
    setIsRunning(true)
    setResults(new Map())
    setErrors(new Map())
    
    const newResults = new Map<HotDealSource, CrawlerResult>()
    const newErrors = new Map<HotDealSource, string>()
    
    try {
      if (options.concurrent) {
        // 동시 실행
        const promises = options.sources.map(source =>
          crawlSource(source, options)
            .then(result => ({ source, result }))
            .catch(error => ({ source, error }))
        )
        
        const outcomes = await Promise.allSettled(promises)
        
        outcomes.forEach((outcome) => {
          if (outcome.status === 'fulfilled') {
            const value = outcome.value
            if ('result' in value) {
              newResults.set(value.source, value.result)
            } else if ('error' in value) {
              newErrors.set(value.source, value.error.message || '알 수 없는 오류')
            }
          }
        })
      } else {
        // 순차 실행
        for (const source of options.sources) {
          try {
            const result = await crawlSource(source, options)
            newResults.set(source, result)
          } catch (error) {
            newErrors.set(source, error instanceof Error ? error.message : '알 수 없는 오류')
          }
        }
      }
      
      setResults(newResults)
      setErrors(newErrors)
      
      // 결과 요약 표시
      const totalCrawled = Array.from(newResults.values())
        .reduce((sum, result) => sum + result.stats.totalCrawled, 0)
      
      const successCount = Array.from(newResults.values())
        .filter(result => result.success).length
      
      if (successCount === options.sources.length) {
        toast.success(`크롤링 완료: ${totalCrawled}개의 핫딜을 수집했습니다.`)
      } else if (successCount > 0) {
        toast.warning(`크롤링 부분 완료: ${successCount}/${options.sources.length}개 소스에서 ${totalCrawled}개 수집`)
      } else {
        toast.error('크롤링 실패: 모든 소스에서 크롤링에 실패했습니다.')
      }
      
      return {
        success: successCount > 0,
        results: newResults,
        errors: newErrors,
        totalCrawled
      }
    } catch (error) {
      console.error('크롤링 중 오류:', error)
      toast.error('크롤링 중 오류가 발생했습니다.')
      throw error
    } finally {
      setIsRunning(false)
    }
  }, [crawlSource, toast])

  return {
    crawl,
    isRunning,
    results,
    errors
  }
}