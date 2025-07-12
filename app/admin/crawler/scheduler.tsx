'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Clock, Play, Pause, RefreshCw } from 'lucide-react'
import { runAutoCrawler } from '@/actions/auto-crawler-actions'

export function CrawlerScheduler() {
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)
  const [autoEnabled, setAutoEnabled] = useState(false)

  const handleManualRun = async () => {
    setIsRunning(true)
    try {
      await runAutoCrawler()
      setLastRun(new Date())
    } catch (error) {
      console.error('크롤러 실행 오류:', error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          크롤러 스케줄러
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-crawler" className="flex items-center gap-2">
            자동 크롤링 활성화
            <span className="text-xs text-gray-500">(준비중)</span>
          </Label>
          <Switch
            id="auto-crawler"
            checked={autoEnabled}
            onCheckedChange={setAutoEnabled}
            disabled={true}
          />
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600 mb-4">
            수동으로 크롤러를 실행하여 최신 핫딜을 수집합니다.
          </p>
          
          <Button
            onClick={handleManualRun}
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                크롤링 중...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                지금 크롤링 실행
              </>
            )}
          </Button>

          {lastRun && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              마지막 실행: {lastRun.toLocaleString()}
            </p>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• 뽐뿌 1-3페이지 크롤링</p>
          <p>• 중복 제거 후 자동 저장</p>
          <p>• 과도한 요청 방지를 위한 딜레이 적용</p>
        </div>
      </CardContent>
    </Card>
  )
}