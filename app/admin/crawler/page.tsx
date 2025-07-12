'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Download, Upload, Play, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { runCrawler, importCrawlData, getCrawlerProgress } from '@/actions/crawler-actions'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CrawlResult {
  source: string
  totalDeals: number
  newDeals: number
  updatedDeals: number
  statistics: any
  crawledAt: string
}

interface CrawlerProgress {
  isRunning: boolean
  currentStep: string
  progress: number
  currentPost: number
  totalPosts: number
  source: string
  timeFilter?: number
  startTime?: Date
  estimatedTimeLeft?: number
}

export default function CrawlerManagementPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<CrawlResult[]>([])
  const [lastCrawlTime, setLastCrawlTime] = useState<Date | null>(null)
  const [crawlerProgress, setCrawlerProgress] = useState<CrawlerProgress>({
    isRunning: false,
    currentStep: '',
    progress: 0,
    currentPost: 0,
    totalPosts: 0,
    source: ''
  })
  
  // Crawler options
  const [source, setSource] = useState<string>('ppomppu')
  const [pages, setPages] = useState<string>('2')
  const [timeFilter, setTimeFilter] = useState<string>('')
  const [headless, setHeadless] = useState(true)
  const [saveToDb, setSaveToDb] = useState(true)
  const [saveToJson, setSaveToJson] = useState(false)
  const [groupBySource, setGroupBySource] = useState(false)

  // 진행도 폴링
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning || crawlerProgress.isRunning) {
      interval = setInterval(async () => {
        try {
          const progressData = await getCrawlerProgress()
          setCrawlerProgress(progressData)
          setProgress(progressData.progress)
          
          // 크롤링 완료 시 상태 업데이트
          if (!progressData.isRunning) {
            setIsRunning(false)
            if (interval) clearInterval(interval)
          }
        } catch (error) {
          console.error('진행도 조회 실패:', error)
        }
      }, 1000) // 1초마다 폴링
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, crawlerProgress.isRunning])

  const handleRunCrawler = async () => {
    setIsRunning(true)
    setProgress(0)
    setResults([])
    setCrawlerProgress({
      isRunning: true,
      currentStep: '크롤링 시작 중...',
      progress: 0,
      currentPost: 0,
      totalPosts: 0,
      source
    })
    
    try {
      const result = await runCrawler({
        source,
        pages: parseInt(pages),
        headless,
        saveToDb,
        saveToJson,
        groupBySource,
        timeFilterHours: timeFilter ? parseInt(timeFilter) : undefined
      })
      
      if (result.success && result.data) {
        setResults(result.data.results)
        setLastCrawlTime(new Date())
        
        toast.success('크롤링 완료', {
          description: `${result.data.totalDeals}개의 핫딜을 수집했습니다.`
        })
        
        if (result.data.exportedFiles?.length > 0) {
          toast.info('JSON 파일 생성됨', {
            description: `${result.data.exportedFiles.length}개의 파일이 생성되었습니다.`
          })
        }
      } else {
        throw new Error(result.error || '크롤링 실패')
      }
    } catch (error) {
      toast.error('크롤링 실패', {
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      })
      setIsRunning(false)
    }
  }

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const result = await importCrawlData(data)
      
      if (result.success) {
        toast.success('가져오기 완료', {
          description: `${result.savedCount}개 저장, ${result.updatedCount}개 업데이트됨`
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('가져오기 실패', {
        description: error instanceof Error ? error.message : '파일을 읽을 수 없습니다.'
      })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">크롤러 관리</h1>
          <p className="text-muted-foreground">핫딜 커뮤니티에서 데이터를 수집합니다</p>
        </div>
        {lastCrawlTime && (
          <div className="text-sm text-muted-foreground">
            마지막 크롤링: {formatDistanceToNow(lastCrawlTime, { addSuffix: true, locale: ko })}
          </div>
        )}
      </div>

      <Tabs defaultValue="crawler" className="space-y-4">
        <TabsList>
          <TabsTrigger value="crawler">크롤러 실행</TabsTrigger>
          <TabsTrigger value="results">크롤링 결과</TabsTrigger>
          <TabsTrigger value="import">데이터 가져오기</TabsTrigger>
        </TabsList>

        <TabsContent value="crawler" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>크롤러 설정</CardTitle>
              <CardDescription>크롤링 옵션을 설정하고 실행하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="source">크롤링 소스</Label>
                  <Select value={source} onValueChange={setSource} disabled={isRunning}>
                    <SelectTrigger id="source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ppomppu">뽐뿌</SelectItem>
                      <SelectItem value="ruliweb" disabled>루리웹 (준비중)</SelectItem>
                      <SelectItem value="clien" disabled>클리앙 (준비중)</SelectItem>
                      <SelectItem value="quasarzone" disabled>퀘이사존 (준비중)</SelectItem>
                      <SelectItem value="coolenjoy" disabled>쿨엔조이 (준비중)</SelectItem>
                      <SelectItem value="itcm" disabled>잇츠엠 (준비중)</SelectItem>
                      <SelectItem value="all" disabled>전체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pages">크롤링 페이지 수</Label>
                  <Input
                    id="pages"
                    type="number"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    min="1"
                    max="10"
                    disabled={isRunning}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeFilter">시간 기준 필터링 (선택사항)</Label>
                <Input
                  id="timeFilter"
                  type="number"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  placeholder="시간 입력 (예: 12)"
                  min="1"
                  max="168"
                  disabled={isRunning}
                />
                <p className="text-sm text-muted-foreground">
                  입력한 시간(시간 단위) 이내의 게시물만 크롤링합니다. 비워두면 페이지 기준으로 크롤링합니다.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="headless">헤드리스 모드</Label>
                    <p className="text-sm text-muted-foreground">브라우저를 숨김 모드로 실행</p>
                  </div>
                  <Switch
                    id="headless"
                    checked={headless}
                    onCheckedChange={setHeadless}
                    disabled={isRunning}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="save-db">데이터베이스 저장</Label>
                    <p className="text-sm text-muted-foreground">수집한 데이터를 DB에 저장</p>
                  </div>
                  <Switch
                    id="save-db"
                    checked={saveToDb}
                    onCheckedChange={setSaveToDb}
                    disabled={isRunning}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="save-json">JSON 파일 내보내기</Label>
                    <p className="text-sm text-muted-foreground">수집한 데이터를 JSON 파일로 저장</p>
                  </div>
                  <Switch
                    id="save-json"
                    checked={saveToJson}
                    onCheckedChange={setSaveToJson}
                    disabled={isRunning}
                  />
                </div>
                
                {saveToJson && (
                  <div className="flex items-center justify-between pl-8">
                    <div className="space-y-0.5">
                      <Label htmlFor="group-by-source">소스별 파일 분리</Label>
                      <p className="text-sm text-muted-foreground">각 소스별로 별도 파일 생성</p>
                    </div>
                    <Switch
                      id="group-by-source"
                      checked={groupBySource}
                      onCheckedChange={setGroupBySource}
                      disabled={isRunning}
                    />
                  </div>
                )}
              </div>
              
              {(isRunning || crawlerProgress.isRunning) && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{crawlerProgress.currentStep}</span>
                      <span className="font-medium">{crawlerProgress.progress}%</span>
                    </div>
                    <Progress value={crawlerProgress.progress} className="h-2" />
                  </div>
                  
                  {crawlerProgress.totalPosts > 0 && (
                    <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded-lg">
                      <div>
                        <p className="text-muted-foreground">진행 상황</p>
                        <p className="font-medium">
                          {crawlerProgress.currentPost} / {crawlerProgress.totalPosts}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">소스</p>
                        <p className="font-medium capitalize">{crawlerProgress.source}</p>
                      </div>
                      {crawlerProgress.estimatedTimeLeft && (
                        <>
                          <div>
                            <p className="text-muted-foreground">예상 완료</p>
                            <p className="font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(crawlerProgress.estimatedTimeLeft / 60)}분 {crawlerProgress.estimatedTimeLeft % 60}초
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <Button
                onClick={handleRunCrawler}
                disabled={isRunning}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">아직 크롤링 결과가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.source}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="capitalize">{result.source}</CardTitle>
                      <Badge variant="secondary">
                        {formatDistanceToNow(new Date(result.crawledAt), { addSuffix: true, locale: ko })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium">총 핫딜</p>
                        <p className="text-2xl font-bold">{result.totalDeals}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">새로운 핫딜</p>
                        <p className="text-2xl font-bold text-green-600">{result.newDeals}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">업데이트됨</p>
                        <p className="text-2xl font-bold text-blue-600">{result.updatedDeals}</p>
                      </div>
                    </div>
                    
                    {result.statistics && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2">통계</h4>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">무료배송</span>
                            <span>{result.statistics.freeShippingCount || 0}개</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">인기 게시글</span>
                            <span>{result.statistics.popularCount || 0}개</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">이미지 포함</span>
                            <span>{result.statistics.imagesCount || 0}개</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>JSON 파일 가져오기</CardTitle>
              <CardDescription>이전에 내보낸 JSON 파일에서 데이터를 가져옵니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  JSON 파일은 크롤러가 생성한 형식과 일치해야 합니다.
                  잘못된 형식의 파일은 오류를 발생시킬 수 있습니다.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4">
                <Label htmlFor="import-file" className="cursor-pointer">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      클릭하여 JSON 파일 선택
                    </p>
                  </div>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportJson}
                  />
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}