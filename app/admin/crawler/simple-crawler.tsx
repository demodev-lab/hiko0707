'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Zap, CheckCircle, XCircle } from 'lucide-react'
import { FetchCrawler } from '@/lib/crawlers/fetch-crawler'
import { db } from '@/lib/db/database-service'
import { HotDealSource } from '@/types/hotdeal'

export function SimpleCrawler() {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [result, setResult] = useState<any>(null)
  const [maxPages, setMaxPages] = useState(1)

  const runSimpleCrawling = async () => {
    setIsRunning(true)
    setStatus('간편 크롤링 시작...')
    setResult(null)

    try {
      const crawler = new FetchCrawler()
      const deals = await crawler.crawlPpomppu(maxPages)
      
      setStatus(`${deals.length}개 핫딜 생성! 저장 중...`)
      
      // 데이터 저장
      let savedCount = 0
      let skippedCount = 0
      
      for (const deal of deals) {
        try {
          const existing = await db.hotdeals.findAll()
          const isDuplicate = existing.some(d => d.originalUrl === deal.originalUrl)
          
          if (!isDuplicate) {
            await db.hotdeals.create({
              ...deal,
              source: deal.source as HotDealSource,
              status: 'active' as const,
              sourcePostId: deal.title + '-' + Date.now(),
              viewCount: 0,
              likeCount: 0,
              commentCount: 0,
              translationStatus: 'pending' as const
            })
            savedCount++
          } else {
            skippedCount++
          }
        } catch (error) {
          console.error('핫딜 저장 실패:', error)
        }
      }

      setResult({
        success: true,
        totalCrawled: deals.length,
        saved: savedCount,
        skipped: skippedCount
      })
      
      setStatus(`완료! ${savedCount}개 저장, ${skippedCount}개 중복 스킵`)
      
      // 페이지 새로고침으로 상태 업데이트
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error) {
      console.error('크롤링 에러:', error)
      setStatus(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-600" />
          간편 크롤링 (모의 데이터)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>페이지 수</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={maxPages}
            onChange={(e) => setMaxPages(parseInt(e.target.value) || 1)}
            disabled={isRunning}
          />
          <p className="text-sm text-gray-500">
            실제 사이트 접속 없이 모의 데이터를 생성합니다
          </p>
        </div>

        <Button
          onClick={runSimpleCrawling}
          disabled={isRunning}
          className="w-full bg-purple-600 hover:bg-purple-700"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              모의 데이터 생성
            </>
          )}
        </Button>

        {status && (
          <div className="p-3 bg-purple-50 text-purple-700 rounded-md text-sm">
            {status}
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.success ? '생성 완료' : '생성 실패'}
              </span>
            </div>
            
            {result.success && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>생성: {result.totalCrawled}개</div>
                <div className="text-green-600">저장: {result.saved}개</div>
                <div className="text-yellow-600">중복: {result.skipped}개</div>
              </div>
            )}
            
            {result.error && (
              <p className="text-sm text-red-600">{result.error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}