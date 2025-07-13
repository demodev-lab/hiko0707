'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Brain,
  Target,
  TrendingUp,
  Users,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Zap,
  Star,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MousePointer,
  ShoppingCart,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Percent
} from 'lucide-react'
import { 
  useRecommendationEngine,
  useRecommendationDashboard 
} from '@/hooks/use-recommendation-engine'
import { UserRecommendation, RecommendationConfig } from '@/lib/services/recommendation-engine'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface RecommendationManagerProps {
  className?: string
}

export function RecommendationManager({ className = '' }: RecommendationManagerProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'recommendations' | 'performance' | 'users' | 'settings'>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generateConfig, setGenerateConfig] = useState<Partial<RecommendationConfig>>({
    maxRecommendations: 10,
    minConfidence: 30,
    includeTypes: ['hotdeal', 'category', 'price_range'],
    personalizeScoring: true,
    diversifyResults: true
  })

  const {
    userRecommendations,
    recommendationsByType,
    recommendationsByPriority,
    recommendationSummary,
    recentRecommendations,
    expiringSoonRecommendations,
    isLoadingRecommendations,
    generateRecommendations,
    recordClick,
    recordApplication,
    recordFeedback,
    clearExpired,
    isGenerating,
    refetchRecommendations
  } = useRecommendationEngine(selectedUserId)

  const {
    performanceMetrics,
    typePerformance,
    categoryDistribution,
    alertItems,
    recentActivity,
    isLoading: isLoadingDashboard
  } = useRecommendationDashboard()

  const filteredRecommendations = userRecommendations.filter(rec => {
    const matchesSearch = !searchQuery || 
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || rec.type === filterType
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'fresh' && !rec.clicked && !rec.applied) ||
      (filterStatus === 'clicked' && rec.clicked && !rec.applied) ||
      (filterStatus === 'applied' && rec.applied) ||
      (filterStatus === 'with_feedback' && rec.feedback)

    return matchesSearch && matchesType && matchesStatus
  })

  const handleGenerateRecommendations = async () => {
    if (!selectedUserId) {
      toast.error('사용자를 선택해주세요')
      return
    }

    const result = await generateRecommendations(selectedUserId, generateConfig)
    if (result) {
      setShowGenerateDialog(false)
      toast.success(`${result.length}개의 추천이 생성되었습니다`)
    }
  }

  const getRecommendationTypeIcon = (type: UserRecommendation['type']) => {
    switch (type) {
      case 'hotdeal': return <Zap className="h-4 w-4" />
      case 'category': return <Target className="h-4 w-4" />
      case 'price_range': return <BarChart3 className="h-4 w-4" />
      case 'timing': return <Clock className="h-4 w-4" />
      case 'site': return <Star className="h-4 w-4" />
      case 'custom': return <Brain className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800'
    if (confidence >= 60) return 'bg-blue-100 text-blue-800'
    if (confidence >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getPriorityBadgeColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800'
    if (priority >= 5) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">추천 시스템 관리</h2>
          <p className="text-muted-foreground">맞춤 추천 시스템을 관리하고 성과를 분석합니다</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => clearExpired()}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            만료된 추천 정리
          </Button>
          <Button 
            onClick={() => setShowGenerateDialog(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            추천 생성
          </Button>
        </div>
      </div>

      {/* 알림 */}
      {alertItems.length > 0 && (
        <div className="space-y-2">
          {alertItems.map((alert, index) => (
            <Alert key={index} className={
              alert.severity === 'high' ? 'border-red-200 bg-red-50' :
              alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
              'border-blue-200 bg-blue-50'
            }>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>
                {alert.count}개의 항목이 주의가 필요합니다
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            대시보드
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            추천 목록
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            성과 분석
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            사용자 분석
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            설정
          </TabsTrigger>
        </TabsList>

        {/* 대시보드 탭 */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* 핵심 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 추천수</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.totalRecommendations}</div>
                <p className="text-xs text-muted-foreground">최근 7일간</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">클릭률</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.clickRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {performanceMetrics.clickRate > 15 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      좋음
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <ArrowDown className="h-3 w-3" />
                      개선 필요
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">적용률</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.applicationRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {performanceMetrics.applicationRate > 5 ? (
                    <span className="text-green-600">효과적</span>
                  ) : (
                    <span className="text-yellow-600">보통</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">사용자 참여도</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.userEngagement.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">평균 클릭/사용자</p>
              </CardContent>
            </Card>
          </div>

          {/* 최근 활동 및 타입별 성과 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  최근 활동
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">최근 추천</span>
                  <Badge variant="secondary">{recentActivity.recentRecommendations}개</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">만료 임박</span>
                  <Badge variant={recentActivity.expiringSoon > 0 ? "destructive" : "secondary"}>
                    {recentActivity.expiringSoon}개
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">높은 우선순위</span>
                  <Badge variant="outline">{recentActivity.highPriority}개</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  타입별 성과
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {typePerformance.slice(0, 5).map((type) => (
                  <div key={type.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">
                        {type.type === 'hotdeal' ? '핫딜' :
                         type.type === 'category' ? '카테고리' :
                         type.type === 'price_range' ? '가격대' :
                         type.type === 'timing' ? '타이밍' :
                         type.type === 'site' ? '사이트' : '커스텀'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {type.clickRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={type.clickRate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 카테고리 분포 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                카테고리별 분포
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categoryDistribution.map((category) => (
                  <div key={category.name} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{category.name}</h4>
                      <Badge variant="outline">{category.value}개</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>클릭률</span>
                        <span>{category.clickRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={category.clickRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 추천 목록 탭 */}
        <TabsContent value="recommendations" className="space-y-6">
          {/* 필터 및 검색 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                필터링 및 검색
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>사용자 ID</Label>
                  <Input
                    placeholder="사용자 ID 입력"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>검색</Label>
                  <Input
                    placeholder="제목, 설명 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>타입</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="hotdeal">핫딜</SelectItem>
                      <SelectItem value="category">카테고리</SelectItem>
                      <SelectItem value="price_range">가격대</SelectItem>
                      <SelectItem value="timing">타이밍</SelectItem>
                      <SelectItem value="site">사이트</SelectItem>
                      <SelectItem value="custom">커스텀</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>상태</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="fresh">신규</SelectItem>
                      <SelectItem value="clicked">클릭됨</SelectItem>
                      <SelectItem value="applied">적용됨</SelectItem>
                      <SelectItem value="with_feedback">피드백 있음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetchRecommendations()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  새로고침
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 추천 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  추천 목록 ({filteredRecommendations.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRecommendations ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredRecommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  추천이 없습니다
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredRecommendations.map((recommendation) => (
                      <div key={recommendation.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getRecommendationTypeIcon(recommendation.type)}
                              <h4 className="font-medium">{recommendation.title}</h4>
                              <Badge className={getConfidenceBadgeColor(recommendation.confidence)}>
                                {recommendation.confidence}%
                              </Badge>
                              <Badge className={getPriorityBadgeColor(recommendation.priority)}>
                                P{recommendation.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {recommendation.description}
                            </p>
                            <p className="text-xs text-muted-foreground italic">
                              {recommendation.reasoning}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(recommendation.createdAt, 'MM/dd HH:mm', { locale: ko })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              만료: {formatDistanceToNow(recommendation.expiresAt, { locale: ko })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {recommendation.clicked && (
                              <Badge variant="outline" className="text-blue-600">
                                <MousePointer className="h-3 w-3 mr-1" />
                                클릭됨
                              </Badge>
                            )}
                            {recommendation.applied && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                적용됨
                              </Badge>
                            )}
                            {recommendation.feedback && (
                              <Badge variant="outline" className={
                                recommendation.feedback === 'helpful' ? 'text-green-600' :
                                recommendation.feedback === 'not_helpful' ? 'text-red-600' :
                                'text-gray-600'
                              }>
                                {recommendation.feedback === 'helpful' ? (
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                ) : recommendation.feedback === 'not_helpful' ? (
                                  <ThumbsDown className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {recommendation.feedback === 'helpful' ? '도움됨' :
                                 recommendation.feedback === 'not_helpful' ? '도움안됨' : '관련없음'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* 추천 아이템 목록 */}
                        {recommendation.items.length > 0 && (
                          <div className="pt-2 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {recommendation.items.slice(0, 3).map((item) => (
                                <div key={item.id} className="text-xs p-2 bg-gray-50 rounded">
                                  <div className="font-medium truncate">{item.title}</div>
                                  {item.price && (
                                    <div className="text-green-600">
                                      ₩{item.price.toLocaleString()}
                                      {item.originalPrice && item.originalPrice > item.price && (
                                        <span className="ml-1 text-gray-400 line-through">
                                          ₩{item.originalPrice.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {recommendation.items.length > 3 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                +{recommendation.items.length - 3}개 더
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => recordClick(recommendation.id)}
                            className="gap-1"
                          >
                            <MousePointer className="h-3 w-3" />
                            클릭 기록
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => recordApplication(recommendation.id)}
                            className="gap-1"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            적용 기록
                          </Button>
                          <Select onValueChange={(value) => recordFeedback(recommendation.id, value as any)}>
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue placeholder="피드백" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="helpful">도움됨</SelectItem>
                              <SelectItem value="not_helpful">도움안됨</SelectItem>
                              <SelectItem value="irrelevant">관련없음</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 성과 분석 탭 */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>타입별 클릭률 비교</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {typePerformance.map((type) => (
                  <div key={type.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">
                        {type.type === 'hotdeal' ? '핫딜' :
                         type.type === 'category' ? '카테고리' :
                         type.type === 'price_range' ? '가격대' :
                         type.type === 'timing' ? '타이밍' :
                         type.type === 'site' ? '사이트' : '커스텀'}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-medium">{type.clickRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{type.count}개</div>
                      </div>
                    </div>
                    <Progress value={type.clickRate} className="h-3" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>성과 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {performanceMetrics.clickRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">평균 클릭률</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {performanceMetrics.applicationRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">평균 적용률</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {performanceMetrics.feedbackRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">피드백률</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {performanceMetrics.userEngagement.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">사용자당 클릭</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 사용자 분석 탭 */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>사용자별 추천 분석</CardTitle>
              <p className="text-sm text-muted-foreground">
                개별 사용자의 추천 활용도를 분석합니다
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="분석할 사용자 ID 입력"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => refetchRecommendations()}
                    disabled={!selectedUserId}
                  >
                    분석
                  </Button>
                </div>

                {selectedUserId && recommendationSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 border rounded-lg">
                      <div className="text-lg font-semibold">{recommendationSummary.total}</div>
                      <div className="text-sm text-muted-foreground">전체 추천수</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">
                        {recommendationSummary.clickRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">클릭률</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-lg font-semibold text-green-600">
                        {recommendationSummary.applicationRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">적용률</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 설정 탭 */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>추천 생성 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>최대 추천수</Label>
                  <Input
                    type="number"
                    value={generateConfig.maxRecommendations || 10}
                    onChange={(e) => setGenerateConfig(prev => ({
                      ...prev,
                      maxRecommendations: parseInt(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>최소 신뢰도 (%)</Label>
                  <Input
                    type="number"
                    value={generateConfig.minConfidence || 30}
                    onChange={(e) => setGenerateConfig(prev => ({
                      ...prev,
                      minConfidence: parseInt(e.target.value)
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>포함할 추천 타입</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(['hotdeal', 'category', 'price_range', 'timing', 'site', 'custom'] as const).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Switch
                        checked={generateConfig.includeTypes?.includes(type) || false}
                        onCheckedChange={(checked) => {
                          const currentTypes = generateConfig.includeTypes || []
                          if (checked) {
                            setGenerateConfig(prev => ({
                              ...prev,
                              includeTypes: [...currentTypes, type]
                            }))
                          } else {
                            setGenerateConfig(prev => ({
                              ...prev,
                              includeTypes: currentTypes.filter(t => t !== type)
                            }))
                          }
                        }}
                      />
                      <Label className="text-sm">
                        {type === 'hotdeal' ? '핫딜' :
                         type === 'category' ? '카테고리' :
                         type === 'price_range' ? '가격대' :
                         type === 'timing' ? '타이밍' :
                         type === 'site' ? '사이트' : '커스텀'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={generateConfig.personalizeScoring || false}
                  onCheckedChange={(checked) => setGenerateConfig(prev => ({
                    ...prev,
                    personalizeScoring: checked
                  }))}
                />
                <Label>개인화 점수 적용</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={generateConfig.diversifyResults || false}
                  onCheckedChange={(checked) => setGenerateConfig(prev => ({
                    ...prev,
                    diversifyResults: checked
                  }))}
                />
                <Label>결과 다양성 확보</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 추천 생성 다이얼로그 */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 추천 생성</DialogTitle>
            <DialogDescription>
              선택한 사용자를 위한 맞춤 추천을 생성합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>사용자 ID</Label>
              <Input
                placeholder="추천을 생성할 사용자 ID"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>생성할 추천수</Label>
              <Input
                type="number"
                value={generateConfig.maxRecommendations || 10}
                onChange={(e) => setGenerateConfig(prev => ({
                  ...prev,
                  maxRecommendations: parseInt(e.target.value)
                }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              취소
            </Button>
            <Button 
              onClick={handleGenerateRecommendations}
              disabled={!selectedUserId || isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}