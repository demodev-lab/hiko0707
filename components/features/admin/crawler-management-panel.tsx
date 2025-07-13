'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  Loader2, 
  Play, 
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react'
import { HotDealSource } from '@/types/hotdeal'
// TODO: 크롤러 액션들을 구현해야 함
// import { 
//   getCrawlerStatusAction, 
//   getAvailableCrawlersAction,
//   CrawlActionOptions,
//   CrawlActionResult
// } from '@/actions/crawler-actions'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

// 임시 타입 정의
interface CrawlActionOptions {
  sources: HotDealSource[]
  maxPages: number
  concurrent: boolean
  exportToJson: boolean
  saveToDb: boolean
  timeFilterHours?: number
}

interface CrawlActionResult {
  success: boolean
  message: string
  data?: any
  stats?: {
    totalCrawled: number
    totalSaved: number
    totalUpdated: number
    totalSkipped: number
    duration: number
  }
  errors?: string[]
}

interface CrawlerStatus {
  totalHotDeals: number
  todayHotDeals: number
  sources: Record<HotDealSource, number>
  lastCrawled?: Date
}

interface CrawlerInfo {
  type: HotDealSource
  name: string
  displayName: string
  status: 'active' | 'development' | 'planned'
  emoji: string
}

export function CrawlerManagementPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCrawling, setIsCrawling] = useState(false)
  const [crawlerStatus, setCrawlerStatus] = useState<CrawlerStatus | null>(null)
  const [availableCrawlers, setAvailableCrawlers] = useState<CrawlerInfo[]>([])
  const [crawlResult, setCrawlResult] = useState<CrawlActionResult | null>(null)
  
  // 크롤링 옵션
  const [selectedSources, setSelectedSources] = useState<HotDealSource[]>(['ppomppu'])
  const [maxPages, setMaxPages] = useState(1)
  const [concurrent, setConcurrent] = useState(false)
  const [exportToJson, setExportToJson] = useState(true)
  const [saveToDb, setSaveToDb] = useState(true)

  // 크롤러 상태 로드
  useEffect(() => {
    loadCrawlerStatus()
    loadAvailableCrawlers()
  }, [])

  const loadCrawlerStatus = async () => {
    setIsLoading(true)
    try {
      // TODO: 크롤러 상태 로드 함수 구현 필요
      // const result = await getCrawlerStatusAction()
      // if (result.success && result.data) {
      //   setCrawlerStatus(result.data)
      // }
    } catch (error) {
      console.error('크롤러 상태 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableCrawlers = async () => {
    try {
      // TODO: 크롤러 목록 로드 함수 구현 필요
      // const result = await getAvailableCrawlersAction()
      // if (result.success && result.data) {
      //   setAvailableCrawlers(result.data)
      // }
    } catch (error) {
      console.error('크롤러 목록 로드 실패:', error)
    }
  }

  const handleCrawl = async () => {
    setIsCrawling(true)
    setCrawlResult(null)
    
    try {
      const options: CrawlActionOptions = {
        sources: selectedSources,
        maxPages,
        concurrent,
        exportToJson,
        saveToDb
      }
      
      // TODO: 크롤링 액션 함수를 구현해야 함
      // const result = await executeCrawlAction(options)
      // setCrawlResult(result)
      
      toast.error('크롤링 기능이 아직 구현되지 않았습니다.')
    } catch (error) {
      toast.error('크롤링 중 오류가 발생했습니다')
    } finally {
      setIsCrawling(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'development': return 'secondary'
      case 'planned': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'development': return '개발중'
      case 'planned': return '예정'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">크롤러 관리</h1>
        <p className="text-muted-foreground">
          핫딜 정보를 수집하는 크롤러를 관리합니다
        </p>
      </div>

      {/* 상태 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 핫딜</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crawlerStatus?.totalHotDeals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              데이터베이스 총 핫딜 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 수집</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crawlerStatus?.todayHotDeals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              오늘 크롤링된 핫딜 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 크롤러</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availableCrawlers.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              사용 가능한 크롤러 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">마지막 크롤링</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crawlerStatus?.lastCrawled
                ? formatDistanceToNow(new Date(crawlerStatus.lastCrawled), { 
                    addSuffix: true,
                    locale: ko 
                  })
                : '없음'}
            </div>
            <p className="text-xs text-muted-foreground">
              마지막 크롤링 시간
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="control" className="space-y-4">
        <TabsList>
          <TabsTrigger value="control">크롤링 제어</TabsTrigger>
          <TabsTrigger value="status">크롤러 상태</TabsTrigger>
          <TabsTrigger value="logs">실행 로그</TabsTrigger>
        </TabsList>

        {/* 크롤링 제어 탭 */}
        <TabsContent value="control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>크롤링 실행</CardTitle>
              <CardDescription>
                원하는 커뮤니티에서 핫딜 정보를 수집합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 소스 선택 */}
              <div className="space-y-2">
                <Label>크롤링 대상</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {availableCrawlers.map((crawler) => (
                    <div key={crawler.type} className="flex items-center space-x-2">
                      <Checkbox
                        id={crawler.type}
                        checked={selectedSources.includes(crawler.type)}
                        disabled={crawler.status !== 'active'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSources([...selectedSources, crawler.type])
                          } else {
                            setSelectedSources(selectedSources.filter(s => s !== crawler.type))
                          }
                        }}
                      />
                      <label
                        htmlFor={crawler.type}
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                          crawler.status !== 'active' ? 'opacity-50' : ''
                        }`}
                      >
                        {crawler.emoji} {crawler.displayName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 페이지 수 설정 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxPages">크롤링 페이지 수</Label>
                  <Input
                    id="maxPages"
                    type="number"
                    min="1"
                    max="10"
                    value={maxPages}
                    onChange={(e) => setMaxPages(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    각 커뮤니티에서 크롤링할 페이지 수 (1-10)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>실행 옵션</Label>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="concurrent"
                        checked={concurrent}
                        onCheckedChange={(checked) => setConcurrent(checked as boolean)}
                      />
                      <label
                        htmlFor="concurrent"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        동시 실행 (더 빠르지만 부하 증가)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="exportToJson"
                        checked={exportToJson}
                        onCheckedChange={(checked) => setExportToJson(checked as boolean)}
                      />
                      <label
                        htmlFor="exportToJson"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        JSON 파일로 저장
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saveToDb"
                        checked={saveToDb}
                        onCheckedChange={(checked) => setSaveToDb(checked as boolean)}
                      />
                      <label
                        htmlFor="saveToDb"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        데이터베이스에 저장
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 실행 버튼 */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleCrawl}
                  disabled={isCrawling || selectedSources.length === 0}
                  className="flex items-center space-x-2"
                >
                  {isCrawling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>크롤링 중...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>크롤링 시작</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={loadCrawlerStatus}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  상태 새로고침
                </Button>
              </div>

              {/* 크롤링 결과 */}
              {crawlResult && (
                <Alert variant={crawlResult.success ? 'default' : 'destructive'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {crawlResult.success ? '크롤링 완료' : '크롤링 실패'}
                  </AlertTitle>
                  <AlertDescription>
                    <p>{crawlResult.message}</p>
                    {crawlResult.stats && (
                      <div className="mt-2 space-y-1 text-sm">
                        <p>• 크롤링: {crawlResult.stats.totalCrawled}개</p>
                        <p>• 신규 저장: {crawlResult.stats.totalSaved}개</p>
                        <p>• 업데이트: {crawlResult.stats.totalUpdated}개</p>
                        <p>• 스킵: {crawlResult.stats.totalSkipped}개</p>
                        <p>• 소요시간: {(crawlResult.stats.duration / 1000).toFixed(1)}초</p>
                      </div>
                    )}
                    {crawlResult.errors && crawlResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">오류 내역:</p>
                        <ul className="list-disc list-inside text-sm">
                          {crawlResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 크롤러 상태 탭 */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>크롤러 상태</CardTitle>
              <CardDescription>
                각 커뮤니티별 크롤러 상태와 수집 현황
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableCrawlers.map((crawler) => (
                  <div
                    key={crawler.type}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{crawler.emoji}</span>
                      <div>
                        <h4 className="font-semibold">{crawler.displayName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {crawler.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {crawlerStatus?.sources[crawler.type] || 0}개
                        </p>
                        <p className="text-xs text-muted-foreground">수집된 핫딜</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(crawler.status)}>
                        {getStatusText(crawler.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 실행 로그 탭 */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>실행 로그</CardTitle>
              <CardDescription>
                최근 크롤링 실행 기록
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-8 w-8 mx-auto mb-2" />
                <p>실행 로그 기능은 준비 중입니다</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}