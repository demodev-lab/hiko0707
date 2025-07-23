'use client'

import { useState, useEffect } from 'react'
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
// import { runCrawler } from '@/actions/crawler-actions' // API Route 사용으로 변경

// 크롤링 스케줄 타입
interface CrawlSchedule {
  enabled: boolean
  intervalType: 'minutes' | 'hours' | 'daily'
  intervalValue: number
  lastRun?: Date
  nextRun?: Date
}

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
  const [isCrawling, setIsCrawling] = useState(false)
  const [crawlProgress, setCrawlProgress] = useState(0)
  const [crawlStatus, setCrawlStatus] = useState<string>('')
  const [selectedSource, setSelectedSource] = useState('ppomppu')
  const [crawlPages, setCrawlPages] = useState(5)
  const [crawlMode, setCrawlMode] = useState<'pages' | 'time'>('time')
  const [timeRange, setTimeRange] = useState<'today' | 'hours' | 'days' | 'custom'>('today')
  const [customTimeValue, setCustomTimeValue] = useState(6)
  const [customTimeUnit, setCustomTimeUnit] = useState<'hours' | 'days'>('hours')
  const [autoImport, setAutoImport] = useState(true)
  const [schedule, setSchedule] = useState<CrawlSchedule>({
    enabled: false,
    intervalType: 'minutes',
    intervalValue: 30
  })
  const [crawlHistory, setCrawlHistory] = useState<CrawlHistory[]>([])
  const [jsonFiles, setJsonFiles] = useState<string[]>([])
  
  const { hotdeals, refetch: refetchHotDeals } = useHotDeals()

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

  // 크롤링 실행 - 완전히 새로운 구현
  const handleCrawl = async () => {
    console.log('handleCrawl 시작')
    
    // 상태 초기화
    setIsCrawling(true)
    setCrawlProgress(0)
    setCrawlStatus('크롤링 준비 중...')
    
    const startTime = Date.now()
    let progressInterval: NodeJS.Timeout | null = null
    
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
        setCrawlStatus(`${timeBasedMessage} 기간 내 게시물 크롤링 중...`)
      } else {
        setCrawlStatus('크롤링 시작...')
      }
      
      // UI 업데이트를 위한 짧은 대기
      console.log('UI 대기 시작')
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          console.log('UI 대기 완료')
          resolve()
        }, 1000)
      })
      
      // 진행 상황 시뮬레이션
      console.log('진행 상황 시뮬레이션 시작')
      progressInterval = setInterval(() => {
        setCrawlProgress((prev) => {
          const next = Math.min(prev + 10, 90)
          console.log('진행률:', next)
          return next
        })
      }, 1000)
      
      const crawlerOptions = {
        source: selectedSource,
        pages: actualPages,
        headless: true,
        saveToJson: true,
        saveToDb: autoImport,
        groupBySource: false,
        timeFilterHours: crawlMode === 'time' ? targetHours : undefined
      }
      
      console.log('크롤러 시작:', crawlerOptions)
      
      // API Route 사용
      let response
      let result
      
      try {
        response = await fetch('/api/crawler', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(crawlerOptions)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        result = await response.json()
      } catch (fetchError) {
        console.error('Fetch 에러:', fetchError)
        throw new Error(`API 호출 실패: ${fetchError instanceof Error ? fetchError.message : '알 수 없는 오류'}`)
      }
      
      console.log('크롤러 결과:', result)
      
      if (progressInterval) clearInterval(progressInterval)
      setCrawlProgress(100)
      
      // 결과 처리
      if (!result.success) {
        throw new Error(result.error || '크롤링 실패')
      }
      
      const duration = Date.now() - startTime
      const historyItem: CrawlHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        source: selectedSource,
        itemsCount: result.data?.results[0]?.totalDeals || 0,
        status: 'success',
        duration: Math.round(duration / 1000)
      }
      
      setCrawlHistory(prev => [historyItem, ...prev.slice(0, 9)])
      
      if (autoImport && result.data?.exportedFiles?.length > 0) {
        const filename = result.data.exportedFiles[0].split('/').pop()
        if (filename) {
          await handleImportJson(filename)
        }
      }
      
      const successMessage = crawlMode === 'time' 
        ? `${timeBasedMessage} 크롤링 완료! ${historyItem.itemsCount}개 아이템 수집`
        : `크롤링 완료! ${historyItem.itemsCount}개 아이템 수집`
      
      toast.success(successMessage)
      await loadJsonFiles()
      
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval)
      setCrawlProgress(0)
      setCrawlStatus('크롤링 실패')
      
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
    } finally {
      setIsCrawling(false)
      setCrawlProgress(0)
      setCrawlStatus('')
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
    
    // 로컬 스토리지에서 설정 로드
    const savedSchedule = localStorage.getItem('hiko_crawl_schedule')
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule))
    }
    
    const savedHistory = localStorage.getItem('hiko_crawl_history')
    if (savedHistory) {
      setCrawlHistory(JSON.parse(savedHistory))
    }
  }, [])

  // 스케줄 저장
  useEffect(() => {
    localStorage.setItem('hiko_crawl_schedule', JSON.stringify(schedule))
  }, [schedule])

  // 히스토리 저장
  useEffect(() => {
    localStorage.setItem('hiko_crawl_history', JSON.stringify(crawlHistory))
  }, [crawlHistory])

  return (
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
                    <span>{crawlProgress}%</span>
                  </div>
                  <Progress value={crawlProgress} />
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
              <CardDescription>실시간 핫딜 수집을 위한 자동 크롤링 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="schedule-enabled" 
                  checked={schedule.enabled}
                  onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="schedule-enabled">자동 크롤링 활성화</Label>
              </div>
              
              {schedule.enabled && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>크롤링 간격</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          max={schedule.intervalType === 'minutes' ? 60 : schedule.intervalType === 'hours' ? 24 : 30}
                          value={schedule.intervalValue?.toString() || '1'}
                          onChange={(e) => setSchedule(prev => ({ 
                            ...prev, 
                            intervalValue: parseInt(e.target.value) || 1 
                          }))}
                          className="w-20"
                        />
                        <Select 
                          value={schedule.intervalType} 
                          onValueChange={(v: any) => setSchedule(prev => ({ 
                            ...prev, 
                            intervalType: v,
                            intervalValue: v === 'minutes' ? 30 : v === 'hours' ? 1 : 1
                          }))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutes">분</SelectItem>
                            <SelectItem value="hours">시간</SelectItem>
                            <SelectItem value="daily">일</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>빠른 설정</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSchedule(prev => ({ ...prev, intervalType: 'minutes', intervalValue: 10 }))}
                        >
                          10분
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSchedule(prev => ({ ...prev, intervalType: 'minutes', intervalValue: 30 }))}
                        >
                          30분
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSchedule(prev => ({ ...prev, intervalType: 'hours', intervalValue: 1 }))}
                        >
                          1시간
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSchedule(prev => ({ ...prev, intervalType: 'hours', intervalValue: 2 }))}
                        >
                          2시간
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSchedule(prev => ({ ...prev, intervalType: 'hours', intervalValue: 6 }))}
                        >
                          6시간
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSchedule(prev => ({ ...prev, intervalType: 'daily', intervalValue: 1 }))}
                        >
                          매일
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-1">
                    <div className="space-y-2">
                      <Label>스케줄 정보</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">
                          {schedule.intervalValue} {schedule.intervalType === 'minutes' ? '분' : schedule.intervalType === 'hours' ? '시간' : '일'}마다 자동 크롤링
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          실시간 핫딜 업데이트를 위한 자동 수집이 활성화됩니다
                        </p>
                        {schedule.lastRun && (
                          <p className="text-xs text-muted-foreground mt-1">
                            마지막 실행: {new Date(schedule.lastRun).toLocaleString('ko-KR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      자동 크롤링은 서버 환경에서만 작동합니다. 
                      현재는 설정값만 저장되며, 실제 자동 실행을 위해서는 서버 크론 작업이 필요합니다.
                    </AlertDescription>
                  </Alert>
                  
                  {schedule.intervalType === 'minutes' && schedule.intervalValue < 10 && (
                    <Alert className="border-yellow-500">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-yellow-700">
                        너무 짧은 간격은 서버에 부담을 줄 수 있습니다. 
                        최소 10분 이상을 권장합니다.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
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
  )
}