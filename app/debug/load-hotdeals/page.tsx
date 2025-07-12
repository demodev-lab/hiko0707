'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function LoadHotDealsPage() {
  const [loading, setLoading] = useState(false)
  const [hotdealsCount, setHotdealsCount] = useState(0)
  const [lastLoaded, setLastLoaded] = useState<string | null>(null)

  // 최신 JSON 파일을 자동으로 로드
  const loadLatestHotdeals = async () => {
    setLoading(true)
    try {
      // JSON 파일 목록 가져오기
      const filesResponse = await fetch('/api/placeholder/list-exports')
      const files = await filesResponse.json()
      
      if (files.length === 0) {
        toast.error('저장된 JSON 파일이 없습니다')
        return
      }
      
      // 가장 최신 파일 선택
      const latestFile = files[0]
      
      // 파일 내용 가져오기
      const dataResponse = await fetch(`/api/placeholder/exports/${latestFile}`)
      const data = await dataResponse.json()
      
      if (!data.hotdeals || !Array.isArray(data.hotdeals)) {
        toast.error('잘못된 JSON 형식입니다')
        return
      }
      
      // localStorage에 저장 - 안전한 데이터 처리
      const newHotdeals = data.hotdeals.map((deal: any, index: number) => ({
        ...deal,
        id: `hotdeals_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        // 필수 필드 기본값 설정
        communityCommentCount: deal.communityCommentCount || 0,
        communityRecommendCount: deal.communityRecommendCount || 0,
        viewCount: deal.viewCount || 0,
        price: deal.price || 0,
        crawledAt: deal.crawledAt || deal.postDate || new Date().toISOString()
      }))
      
      localStorage.setItem('hiko_hotdeals', JSON.stringify(newHotdeals))
      setHotdealsCount(newHotdeals.length)
      setLastLoaded(latestFile)
      
      toast.success(`${newHotdeals.length}개의 핫딜을 성공적으로 로드했습니다!`)
      
    } catch (error) {
      console.error('핫딜 로드 오류:', error)
      toast.error('핫딜 로드 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 현재 localStorage 상태 확인
  const checkCurrentState = () => {
    try {
      const hotdealsData = localStorage.getItem('hiko_hotdeals')
      if (hotdealsData) {
        const parsed = JSON.parse(hotdealsData)
        setHotdealsCount(Array.isArray(parsed) ? parsed.length : 0)
      } else {
        setHotdealsCount(0)
      }
    } catch (error) {
      setHotdealsCount(0)
    }
  }

  // 데이터 초기화
  const clearData = () => {
    localStorage.removeItem('hiko_hotdeals')
    setHotdealsCount(0)
    setLastLoaded(null)
    toast.success('핫딜 데이터를 삭제했습니다')
  }

  // 페이지 로드 시 상태 확인
  React.useEffect(() => {
    checkCurrentState()
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">핫딜 데이터 로더</h1>
        <Button onClick={checkCurrentState} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          상태 확인
        </Button>
      </div>

      {/* 현재 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {hotdealsCount > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            )}
            현재 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span>핫딜 개수:</span>
              <Badge variant={hotdealsCount > 0 ? 'default' : 'secondary'}>
                {hotdealsCount}개
              </Badge>
            </div>
            {lastLoaded && (
              <div className="flex items-center gap-2">
                <span>마지막 로드:</span>
                <Badge variant="outline">{lastLoaded}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>데이터 로드</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              최신 크롤링 데이터를 localStorage에 로드합니다.
            </p>
            <Button 
              onClick={loadLatestHotdeals} 
              disabled={loading}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? '로딩 중...' : '최신 핫딜 로드'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>데이터 초기화</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              현재 localStorage의 핫딜 데이터를 삭제합니다.
            </p>
            <Button 
              onClick={clearData} 
              variant="destructive"
              className="w-full"
            >
              데이터 삭제
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 안내 메시지 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>사용 방법:</strong><br />
          1. &quot;최신 핫딜 로드&quot; 버튼을 클릭하여 크롤링된 데이터를 로드하세요<br />
          2. 메인 페이지로 돌아가서 핫딜 카드가 표시되는지 확인하세요<br />
          3. 문제가 계속되면 브라우저를 새로고침해보세요
        </AlertDescription>
      </Alert>
    </div>
  )
}