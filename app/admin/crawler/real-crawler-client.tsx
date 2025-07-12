'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react'
import { PpomppuRealCrawler } from '@/lib/crawlers/ppomppu-real-crawler'
import { db } from '@/lib/db/database-service'

export function RealCrawlerClient() {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [result, setResult] = useState<any>(null)
  const [maxPages, setMaxPages] = useState(1)

  const runCrawling = async () => {
    setIsRunning(true)
    setStatus('크롤링 준비 중...')
    setResult(null)

    try {
      // MCP 함수 확인
      console.log('MCP 함수 확인:')
      // @ts-ignore
      console.log('navigate:', typeof mcp__playwright__playwright_navigate)
      // @ts-ignore
      console.log('click:', typeof mcp__playwright__playwright_click)
      // @ts-ignore
      console.log('evaluate:', typeof mcp__playwright__playwright_evaluate)
      // @ts-ignore
      console.log('close:', typeof mcp__playwright__playwright_close)
      
      // 전역 객체 확인
      console.log('전역 객체 키:', Object.keys(window).filter(k => k.includes('mcp')))
      
      // 클라이언트에서 직접 크롤러 실행
      const crawler = new PpomppuRealCrawler()
      
      setStatus('뽐뿌 사이트 크롤링 시작...')
      
      const crawlResult = await crawler.crawl({
        maxPages: maxPages,
        pageDelay: 2000,
        detailDelay: 1000,
        skipDetail: false
      })

      if (crawlResult.success && crawlResult.data) {
        setStatus(`${crawlResult.data.length}개 핫딜 발견! 저장 중...`)
        
        // 데이터 저장
        let savedCount = 0
        let skippedCount = 0
        
        for (const deal of crawlResult.data) {
          try {
            // 중복 확인
            const existing = await db.hotdeals.findAll()
            const isDuplicate = existing.some(d => d.originalUrl === deal.originalUrl)
            
            if (!isDuplicate) {
              await db.hotdeals.create(deal)
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
          totalCrawled: crawlResult.data.length,
          saved: savedCount,
          skipped: skippedCount,
          duration: crawlResult.stats.duration
        })
        
        setStatus(`완료! ${savedCount}개 저장, ${skippedCount}개 중복 스킵`)
      } else {
        throw new Error(crawlResult.error || '크롤링 실패')
      }
      
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
    <Card>
      <CardHeader>
        <CardTitle>실시간 Playwright 크롤링</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>최대 페이지 수</Label>
          <Input
            type="number"
            min="1"
            max="5"
            value={maxPages}
            onChange={(e) => setMaxPages(parseInt(e.target.value) || 1)}
            disabled={isRunning}
          />
          <p className="text-sm text-gray-500">
            브라우저에서 직접 크롤링을 실행합니다 (1-5 페이지)
          </p>
        </div>

        <Button
          onClick={runCrawling}
          disabled={isRunning}
          className="w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              크롤링 진행 중...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              실시간 크롤링 시작
            </>
          )}
        </Button>
        
        <Button
          onClick={() => {
            console.log('=== Playwright MCP 함수 테스트 ===')
            console.log('브라우저 콘솔에서 다음 명령어를 실행해보세요:')
            console.log('mcp__playwright__playwright_navigate({ url: "https://www.ppomppu.co.kr", headless: false })')
          }}
          variant="outline"
          size="sm"
          className="w-full"
        >
          MCP 함수 테스트 (콘솔 확인)
        </Button>

        {status && (
          <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
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
                {result.success ? '크롤링 성공' : '크롤링 실패'}
              </span>
            </div>
            
            {result.success && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>크롤링: {result.totalCrawled}개</div>
                <div className="text-green-600">저장: {result.saved}개</div>
                <div className="text-yellow-600">중복: {result.skipped}개</div>
                <div>소요시간: {(result.duration / 1000).toFixed(1)}초</div>
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