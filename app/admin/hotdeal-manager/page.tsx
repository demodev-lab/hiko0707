'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  RefreshCw, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Save,
  History,
  Settings,
  Activity,
  Database,
  FileJson,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { useHotDeals } from '@/hooks/use-local-db'
import { useBackendCrawler } from '@/hooks/use-backend-crawler'
import { CrawlerSource } from '@/lib/crawlers/new-crawler-manager'


// 크롤링 히스토리 타입
interface CrawlHistory {
  id: string
  timestamp: Date
  source: string
  itemsCount: number
  status: 'success' | 'failed' | 'partial'
  duration: number
  errorMessage?: string
}

export default function HotDealManagerPage() {
  // 상태 관리
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedSource, setSelectedSource] = useState<CrawlerSource>('ppomppu')
  const [crawlPages, setCrawlPages] = useState(5)
  const [crawlMode, setCrawlMode] = useState<'pages' | 'time'>('time')
  const [timeRange, setTimeRange] = useState<'today' | 'hours' | 'days' | 'custom'>('today')
  const [customTimeValue, setCustomTimeValue] = useState(6)
  const [customTimeUnit, setCustomTimeUnit] = useState<'hours' | 'days'>('hours')
  const [autoImport, setAutoImport] = useState(true)
  const [crawlHistory, setCrawlHistory] = useState<CrawlHistory[]>([])
  const [jsonFiles, setJsonFiles] = useState<string[]>([])
  
  const { hotdeals, refetch: refetchHotDeals } = useHotDeals()
  const { 
    crawl, 
    isLoading: isCrawling, 
    error: crawlError,
    results: crawlResults,
    progress: crawlProgress,
    jobs: crawlJobs,
    addJob,
    toggleJob,
    removeJob,
    fetchJobs
  } = useBackendCrawler()

  // 통계 계산
  const stats = {
    total: hotdeals.length,
    active: hotdeals.filter(h => h.status === 'active').length,
    today: hotdeals.filter(h => 
      new Date(h.crawledAt).toDateString() === new Date().toDateString()
    ).length,
    sources: [...new Set(hotdeals.map(h => h.source))].length,
  }

  // JSON 파일 목록 로드
  const loadJsonFiles = async () => {
    try {
      const response = await fetch('/api/placeholder/list-exports')
      if (response.ok) {
        const files = await response.json()
        setJsonFiles(files)
      }
    } catch (error) {
      console.error('Failed to load JSON files:', error)
    }
  }

  // 크롤링 실행 - 백엔드 API 사용
  const handleCrawl = async () => {
    console.log('handleCrawl 시작')
    
    const startTime = Date.now()
    
    try {
      // 시간 기준 설정
      let actualPages = crawlPages
      let targetHours: number | undefined
      let timeBasedMessage = ''
      
      if (crawlMode === 'time') {
        if (timeRange === 'today') {
          targetHours = 24
          timeBasedMessage = '최근 24시간'
        } else if (timeRange === 'hours') {
          targetHours = customTimeValue
          timeBasedMessage = `최근 ${customTimeValue}시간`
        } else if (timeRange === 'days') {
          targetHours = customTimeValue * 24
          timeBasedMessage = `최근 ${customTimeValue}일`
        } else if (timeRange === 'custom') {
          targetHours = customTimeUnit === 'hours' ? customTimeValue : customTimeValue * 24
          timeBasedMessage = `최근 ${customTimeValue}${customTimeUnit === 'hours' ? '시간' : '일'}`
        }
        
        // 시간 기준일 때는 충분히 많은 페이지로 설정하되, 크롤러가 시간 범위를 벗어나면 자동 중단
        actualPages = 50
      }
      
      const crawlerOptions = {
        pages: actualPages,
        headless: true,
        saveToJson: true,
        saveToDb: autoImport,
        groupBySource: false,
        timeFilterHours: crawlMode === 'time' ? targetHours : undefined
      }
      
      console.log('크롤러 시작:', crawlerOptions)
      
      // 백엔드 API 호출
      const result = await crawl(selectedSource, crawlerOptions)
      
      const duration = Date.now() - startTime
      const historyItem: CrawlHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        source: selectedSource,
        itemsCount: result.results[0]?.totalDeals || 0,
        status: 'success',
        duration: Math.round(duration / 1000)
      }
      
      setCrawlHistory(prev => [historyItem, ...prev.slice(0, 9)])
      
      if (autoImport && result.exportedFiles?.length > 0) {
        const filename = result.exportedFiles[0].split('/').pop()
        if (filename) {
          await handleImportJson(filename)
        }
      }
      
      const successMessage = crawlMode === 'time' 
        ? `${timeBasedMessage} 크롤링 완료! ${historyItem.itemsCount}개 아이템 수집`
        : `크롤링 완료! ${historyItem.itemsCount}개 아이템 수집`
      
      toast.success(successMessage)
      await loadJsonFiles()
      await refetchHotDeals()
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      console.error('크롤링 오류:', error)
      toast.error(`크롤링 실패: ${errorMessage}`)
      
      const historyItem: CrawlHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        source: selectedSource,
        itemsCount: 0,
        status: 'failed',
        duration: Math.round((Date.now() - startTime) / 1000),
        errorMessage
      }
      
      setCrawlHistory(prev => [historyItem, ...prev.slice(0, 9)])
    }
  }

  // JSON 파일 가져오기
  const handleImportJson = async (filename: string) => {
    try {
      // 파일 읽기
      const response = await fetch(`/api/placeholder/exports/${filename}`)
      const data = await response.json()
      
      if (!data.hotdeals || !Array.isArray(data.hotdeals)) {
        throw new Error('잘못된 JSON 형식')
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
      await refetchHotDeals()
      
      toast.success(`${newHotdeals.length}개의 핫딜을 가져왔습니다`)
    } catch (error) {
      toast.error('JSON 가져오기 실패')
      console.error(error)
    }
  }

  // 현재 데이터 내보내기
  const handleExportData = async () => {
    try {
      const response = await fetch('/api/placeholder/export-current-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotdeals })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('데이터를 성공적으로 내보냈습니다')
        await loadJsonFiles()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('데이터 내보내기 실패')
      console.error(error)
    }
  }

  // 모든 데이터 삭제
  const handleClearAll = async () => {
    if (!confirm('정말로 모든 핫딜 데이터를 삭제하시겠습니까?')) return
    
    localStorage.setItem('hiko_hotdeals', JSON.stringify([]))
    await refetchHotDeals()
    toast.success('모든 데이터가 삭제되었습니다')
  }

  // 초기 로드
  useEffect(() => {
    loadJsonFiles()
    
    const savedHistory = localStorage.getItem('hiko_crawl_history')
    if (savedHistory) {
      setCrawlHistory(JSON.parse(savedHistory))
    }
  }, [])

  // 히스토리 저장
  useEffect(() => {
    localStorage.setItem('hiko_crawl_history', JSON.stringify(crawlHistory))
  }, [crawlHistory])

  // 실시간 진행 상황을 문자열로 변환
  const crawlStatus = crawlProgress ? 
    `크롤링 중... ${crawlProgress.progress}% (${crawlProgress.itemsCrawled || 0}개 수집)` : 
    ''

  // 크롤링 진행률 (0-100)
  const crawlProgressValue = crawlProgress?.progress || 0

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">핫딜 통합 관리</h1>
          <p className="text-muted-foreground">크롤링, 데이터 관리, 자동화를 한 곳에서</p>
        </div>
        <Badge variant={isCrawling ? "default" : "secondary"} className="gap-2">
          <Activity className={`h-3 w-3 ${isCrawling ? 'animate-pulse' : ''}`} />
          {isCrawling ? '크롤링 중' : '대기 중'}
        </Badge>
      </div>

      {/* 대시보드 통계 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 핫딜</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 딜</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 수집</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">데이터 소스</CardTitle>
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sources}</div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">대시보드</TabsTrigger>
          <TabsTrigger value="crawler">크롤러</TabsTrigger>
          <TabsTrigger value="data">데이터</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        {/* 대시보드 탭 */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>빠른 실행</CardTitle>
              <CardDescription>
                {crawlMode === 'time' 
                  ? `시간 기준 크롤링 (${timeRange === 'today' ? '오늘' 
                      : timeRange === 'hours' ? `${customTimeValue}시간` 
                      : timeRange === 'days' ? `${customTimeValue}일`
                      : `${customTimeValue}${customTimeUnit === 'hours' ? '시간' : '일'}`}) - ${selectedSource}` 
                  : `페이지 기준 크롤링 (${crawlPages}페이지) - ${selectedSource}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={() => handleCrawl()} 
                  disabled={isCrawling}
                  size="lg"
                  className="flex-1"
                >
                  {isCrawling ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      크롤링 중...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      크롤링 시작
                    </>
                  )}
                </Button>
                <Button variant="outline" size="lg" onClick={loadJsonFiles}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  새로고침
                </Button>
              </div>
              
              {isCrawling && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{crawlStatus}</span>
                    <span>{crawlProgressValue}%</span>
                  </div>
                  <Progress value={crawlProgressValue} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 크롤링 히스토리 */}
          <Card>
            <CardHeader>
              <CardTitle>크롤링 히스토리</CardTitle>
              <CardDescription>최근 10개의 크롤링 기록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {crawlHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">아직 크롤링 기록이 없습니다</p>
                ) : (
                  crawlHistory.map(history => (
                    <div key={history.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {history.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{history.source}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(history.timestamp).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{history.itemsCount}개</p>
                        <p className="text-sm text-muted-foreground">{history.duration}초</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 크롤러 탭 */}
        <TabsContent value="crawler" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>크롤링 설정</CardTitle>
              <CardDescription>크롤링 소스와 옵션을 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* 크롤링 소스 */}
                <div className="space-y-2">
                  <Label>크롤링 소스</Label>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ppomppu">뽐뿌</SelectItem>
                      <SelectItem value="ruliweb" disabled>루리웹 (준비중)</SelectItem>
                      <SelectItem value="clien" disabled>클리앙 (준비중)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 크롤링 방식 선택 */}
                <div className="space-y-2">
                  <Label>크롤링 방식</Label>
                  <Select value={crawlMode} onValueChange={(v: 'pages' | 'time') => setCrawlMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">⏰ 시간 기준 (권장)</SelectItem>
                      <SelectItem value="pages">📄 페이지 기준</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 시간 기준 설정 */}
                {crawlMode === 'time' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                    <div className="space-y-2">
                      <Label>크롤링 기간</Label>
                      <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">🌅 오늘 (최근 24시간)</SelectItem>
                          <SelectItem value="hours">⏰ 최근 몇 시간</SelectItem>
                          <SelectItem value="days">📅 최근 몇 일</SelectItem>
                          <SelectItem value="custom">⚙️ 직접 설정</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 시간/일 직접 설정 */}
                    {(timeRange === 'hours' || timeRange === 'days' || timeRange === 'custom') && (
                      <div className="space-y-2">
                        <Label>
                          {timeRange === 'hours' ? '시간 입력' : 
                           timeRange === 'days' ? '일 입력' : 
                           '기간 설정'}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="1"
                            max={timeRange === 'hours' ? 72 : 30}
                            value={customTimeValue}
                            onChange={(e) => setCustomTimeValue(parseInt(e.target.value) || 1)}
                            className="flex-1"
                            placeholder="숫자 입력"
                          />
                          {timeRange === 'custom' && (
                            <Select value={customTimeUnit} onValueChange={(v: 'hours' | 'days') => setCustomTimeUnit(v)}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hours">시간</SelectItem>
                                <SelectItem value="days">일</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {timeRange === 'hours' && `최근 ${customTimeValue}시간 동안의 게시글을 크롤링합니다`}
                          {timeRange === 'days' && `최근 ${customTimeValue}일 동안의 게시글을 크롤링합니다`}
                          {timeRange === 'custom' && `최근 ${customTimeValue}${customTimeUnit === 'hours' ? '시간' : '일'} 동안의 게시글을 크롤링합니다`}
                        </p>
                      </div>
                    )}

                    {/* 빠른 설정 버튼들 */}
                    <div className="space-y-2">
                      <Label>빠른 설정</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTimeRange('hours')
                            setCustomTimeValue(1)
                          }}
                        >
                          1시간
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTimeRange('hours')
                            setCustomTimeValue(6)
                          }}
                        >
                          6시간
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTimeRange('hours')
                            setCustomTimeValue(12)
                          }}
                        >
                          12시간
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTimeRange('today')}
                        >
                          오늘
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTimeRange('days')
                            setCustomTimeValue(3)
                          }}
                        >
                          3일
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTimeRange('days')
                            setCustomTimeValue(7)
                          }}
                        >
                          1주일
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 페이지 기준 설정 */}
                {crawlMode === 'pages' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-2">
                      <Label>크롤링 페이지 수</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={crawlPages}
                          onChange={(e) => setCrawlPages(parseInt(e.target.value) || 1)}
                          className="flex-1"
                          placeholder="페이지 수 입력"
                        />
                        <span className="flex items-center text-sm text-gray-500">페이지</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        총 {crawlPages}페이지를 크롤링합니다 (페이지당 약 20-30개 게시글)
                      </p>
                    </div>

                    {/* 빠른 페이지 설정 */}
                    <div className="space-y-2">
                      <Label>빠른 설정</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCrawlPages(1)}
                        >
                          1페이지
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCrawlPages(3)}
                        >
                          3페이지
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCrawlPages(5)}
                        >
                          5페이지
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCrawlPages(10)}
                        >
                          10페이지
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCrawlPages(20)}
                        >
                          20페이지
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="auto-import" 
                  checked={autoImport}
                  onCheckedChange={setAutoImport}
                />
                <Label htmlFor="auto-import">크롤링 후 자동으로 데이터 가져오기</Label>
              </div>
              
              <Button 
                onClick={() => handleCrawl()} 
                disabled={isCrawling}
                className="w-full"
              >
                {isCrawling ? '크롤링 중...' : '크롤링 시작'}
              </Button>
            </CardContent>
          </Card>

          {/* 스케줄링 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>자동 크롤링 스케줄</CardTitle>
              <CardDescription>백엔드에서 실행되는 자동 크롤링 작업 관리</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 현재 스케줄된 작업 목록 */}
              <div className="space-y-2">
                <Label>스케줄된 크롤링 작업</Label>
                {crawlJobs.length === 0 ? (
                  <div className="p-4 border rounded-lg text-center text-muted-foreground">
                    <p>스케줄된 작업이 없습니다</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => addJob(selectedSource, '*/30 * * * *')}
                    >
                      30분마다 크롤링 추가
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {crawlJobs.map(job => (
                      <div key={job.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={job.enabled}
                              onCheckedChange={(enabled) => toggleJob(job.id, enabled)}
                            />
                            <div>
                              <p className="font-medium">{job.source}</p>
                              <p className="text-sm text-muted-foreground">
                                스케줄: {job.schedule}
                              </p>
                              {job.lastRun && (
                                <p className="text-xs text-muted-foreground">
                                  마지막 실행: {new Date(job.lastRun).toLocaleString('ko-KR')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={job.status === 'running' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                              {job.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeJob(job.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {job.statistics && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            총 {job.statistics.totalCrawled}개 수집 
                            (신규: {job.statistics.newDeals}, 업데이트: {job.statistics.updatedDeals})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 새 스케줄 추가 */}
              <div className="space-y-2">
                <Label>새 크롤링 스케줄 추가</Label>
                <div className="flex gap-2">
                  <Select value={selectedSource} onValueChange={(v) => setSelectedSource(v as CrawlerSource)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ppomppu">뽐뿌</SelectItem>
                      <SelectItem value="ruliweb">루리웹</SelectItem>
                      <SelectItem value="clien">클리앙</SelectItem>
                      <SelectItem value="quasarzone">퀘이사존</SelectItem>
                      <SelectItem value="coolenjoy">쿨엔조이</SelectItem>
                      <SelectItem value="itcm">잇츠엠</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    defaultValue="*/30 * * * *"
                    onValueChange={(schedule) => addJob(selectedSource, schedule)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*/10 * * * *">10분마다</SelectItem>
                      <SelectItem value="*/30 * * * *">30분마다</SelectItem>
                      <SelectItem value="0 * * * *">매시간</SelectItem>
                      <SelectItem value="0 */2 * * *">2시간마다</SelectItem>
                      <SelectItem value="0 */6 * * *">6시간마다</SelectItem>
                      <SelectItem value="0 0 * * *">매일 자정</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  백엔드 서버에서 node-cron을 통해 자동으로 실행됩니다.
                  실시간 진행 상황은 대시보드에서 확인할 수 있습니다.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 데이터 탭 */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>데이터 관리</CardTitle>
              <CardDescription>핫딜 데이터를 가져오거나 내보내세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleExportData}
                >
                  <Download className="mr-2 h-4 w-4" />
                  현재 데이터 내보내기
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleClearAll}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  모든 데이터 삭제
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* JSON 파일 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>저장된 JSON 파일</CardTitle>
              <CardDescription>크롤링된 데이터 파일 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {jsonFiles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">저장된 파일이 없습니다</p>
                ) : (
                  jsonFiles.slice(0, 10).map(file => (
                    <div key={file} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-mono">{file}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImportJson(file)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        가져오기
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 설정 탭 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>시스템 설정</CardTitle>
              <CardDescription>크롤링 시스템의 고급 설정을 관리하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  추가 설정 옵션은 곧 제공될 예정입니다.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ProtectedRoute>
  )
}