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
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Target,
  Brain,
  Lightbulb,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Activity,
  Zap,
  Filter,
  RefreshCw,
  PieChart,
  LineChart,
  Eye,
  Search,
  Download,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { 
  usePurchaseAnalytics,
  useAnalyticsDashboard,
  useUserPurchasePattern 
} from '@/hooks/use-purchase-analytics'
import { PurchasePattern, RecommendationRule, UserSegment } from '@/lib/services/purchase-analytics'
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

interface PurchaseAnalyticsManagerProps {
  className?: string
}

export function PurchaseAnalyticsManager({ className = '' }: PurchaseAnalyticsManagerProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patterns' | 'segments' | 'insights' | 'recommendations'>('dashboard')
  const [selectedTimeframe, setSelectedTimeframe] = useState<PurchasePattern['timeframe']>('monthly')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [newRuleForm, setNewRuleForm] = useState({
    name: '',
    description: '',
    conditions: {
      categories: [] as string[],
      priceRange: { min: 0, max: 1000000 },
      timing: [] as string[],
      userSegment: [] as string[]
    },
    recommendations: {
      suggestCategories: [] as string[],
      suggestPriceRange: { min: 0, max: 1000000 },
      suggestTiming: [] as string[],
      customMessage: ''
    },
    priority: 5,
    enabled: true
  })

  const {
    analyticsOverview,
    trendAnalysis,
    segmentAnalysis,
    insightsSummary,
    recommendationPerformance,
    userSegments,
    recommendationRules,
    allPatterns,
    isLoadingMetrics,
    isLoadingPatterns,
    calculateMetrics,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetchMetrics,
    isCalculating,
    isAddingRule
  } = usePurchaseAnalytics()

  const {
    keyMetrics,
    topCategories,
    segmentDistribution,
    trendData
  } = useAnalyticsDashboard()

  // 필터링된 패턴 목록
  const filteredPatterns = allPatterns.filter(pattern => {
    const matchesSearch = pattern.userId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTimeframe = pattern.timeframe === selectedTimeframe
    return matchesSearch && matchesTimeframe
  })

  const handleRefreshMetrics = async () => {
    await refetchMetrics()
  }

  const handleAddRule = async () => {
    if (!newRuleForm.name || !newRuleForm.description) {
      toast.error('규칙명과 설명을 입력해주세요')
      return
    }

    const result = await addRule(newRuleForm)
    
    if (result) {
      setShowRuleDialog(false)
      setNewRuleForm({
        name: '',
        description: '',
        conditions: {
          categories: [],
          priceRange: { min: 0, max: 1000000 },
          timing: [],
          userSegment: []
        },
        recommendations: {
          suggestCategories: [],
          suggestPriceRange: { min: 0, max: 1000000 },
          suggestTiming: [],
          customMessage: ''
        },
        priority: 5,
        enabled: true
      })
    }
  }

  const renderChangeIndicator = (change: number) => {
    if (change === 0) return <Minus className="w-3 h-3 text-gray-400" />
    return change > 0 ? (
      <ArrowUp className="w-3 h-3 text-green-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-red-600" />
    )
  }

  const renderInsightBadge = (importance: string) => {
    const config = {
      critical: { variant: 'destructive' as const, label: '긴급' },
      high: { variant: 'default' as const, color: 'bg-red-100 text-red-800', label: '높음' },
      medium: { variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800', label: '보통' },
      low: { variant: 'secondary' as const, label: '낮음' }
    }

    const configItem = config[importance as keyof typeof config] || config.low
    const { variant, label } = configItem
    const color = 'color' in configItem ? configItem.color : undefined

    return (
      <Badge variant={variant} className={color ? `text-xs ${color} border-0` : 'text-xs'}>
        {label}
      </Badge>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            구매 패턴 분석
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshMetrics}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  새로고침
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-3 h-3 mr-1" />
              내보내기
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="patterns">구매 패턴</TabsTrigger>
            <TabsTrigger value="segments">고객 세그먼트</TabsTrigger>
            <TabsTrigger value="insights">인사이트</TabsTrigger>
            <TabsTrigger value="recommendations">추천 규칙</TabsTrigger>
          </TabsList>

          {/* 대시보드 탭 */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* 핵심 지표 */}
            <div className="grid grid-cols-4 gap-4">
              {keyMetrics.map((metric) => (
                <Card key={metric.title}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{metric.title}</p>
                        <p className="text-lg font-bold">{metric.value}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {metric.icon === 'ShoppingCart' && <ShoppingCart className="w-4 h-4 text-blue-600" />}
                        {metric.icon === 'DollarSign' && <DollarSign className="w-4 h-4 text-green-600" />}
                        {metric.icon === 'TrendingUp' && <TrendingUp className="w-4 h-4 text-purple-600" />}
                        {metric.icon === 'Zap' && <Zap className="w-4 h-4 text-orange-600" />}
                        {renderChangeIndicator(metric.change)}
                      </div>
                    </div>
                    {metric.change !== 0 && (
                      <p className={`text-xs mt-1 ${
                        metric.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}% 지난 주 대비
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 차트 섹션 */}
            <div className="grid grid-cols-2 gap-6">
              {/* 카테고리별 매출 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">카테고리별 매출</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topCategories.map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{category.category}</span>
                            <span className="text-xs text-muted-foreground">
                              ₩{category.totalAmount.toLocaleString()}
                            </span>
                          </div>
                          <Progress 
                            value={category.percentage} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 고객 세그먼트 분포 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">고객 세그먼트 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {segmentDistribution.map((segment) => (
                      <div key={segment.name} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{segment.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {segment.value}명 ({segment.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress 
                            value={segment.percentage} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 인사이트 요약 */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Lightbulb className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">총 인사이트</p>
                  <p className="text-2xl font-bold">{insightsSummary.totalInsights}</p>
                  <p className="text-xs text-muted-foreground">
                    액션 가능: {insightsSummary.actionableInsights}개
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">긴급/중요 인사이트</p>
                  <p className="text-2xl font-bold">{insightsSummary.criticalInsights}</p>
                  <p className="text-xs text-muted-foreground">
                    즉시 대응 필요
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Settings className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">활성 추천 규칙</p>
                  <p className="text-2xl font-bold">{recommendationPerformance.activeRules}</p>
                  <p className="text-xs text-muted-foreground">
                    총 {recommendationPerformance.totalRules}개 중
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 구매 패턴 탭 */}
          <TabsContent value="patterns" className="space-y-4">
            {/* 필터 및 검색 */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="사용자 ID 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="기간 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">일별</SelectItem>
                  <SelectItem value="weekly">주별</SelectItem>
                  <SelectItem value="monthly">월별</SelectItem>
                  <SelectItem value="quarterly">분기별</SelectItem>
                  <SelectItem value="yearly">연별</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 패턴 통계 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">분석된 패턴</p>
                <p className="text-lg font-bold text-blue-600">{filteredPatterns.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">활성 사용자</p>
                <p className="text-lg font-bold text-green-600">
                  {new Set(filteredPatterns.map(p => p.userId)).size}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">인사이트</p>
                <p className="text-lg font-bold text-yellow-600">
                  {filteredPatterns.reduce((sum, p) => sum + p.insights.length, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">추천 적용</p>
                <p className="text-lg font-bold text-purple-600">
                  {filteredPatterns.reduce((sum, p) => sum + p.recommendations.length, 0)}
                </p>
              </div>
            </div>

            {/* 패턴 목록 */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {isLoadingPatterns ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">패턴을 불러오는 중...</p>
                  </div>
                ) : filteredPatterns.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">분석된 패턴이 없습니다</p>
                  </div>
                ) : (
                  filteredPatterns.map((pattern) => (
                    <div key={pattern.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">사용자 {pattern.userId}</h4>
                          <Badge variant="outline" className="text-xs">
                            {pattern.timeframe === 'daily' && '일별'}
                            {pattern.timeframe === 'weekly' && '주별'}
                            {pattern.timeframe === 'monthly' && '월별'}
                            {pattern.timeframe === 'quarterly' && '분기별'}
                            {pattern.timeframe === 'yearly' && '연별'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">주요 카테고리</p>
                          <p className="font-medium">
                            {pattern.patterns.frequentCategories[0]?.category || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">선호 사이트</p>
                          <p className="font-medium">
                            {pattern.patterns.shoppingSites[0]?.site || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">인사이트</p>
                          <p className="font-medium">{pattern.insights.length}개</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">마지막 업데이트</p>
                          <p className="font-medium">
                            {formatDistanceToNow(pattern.lastUpdated, { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </p>
                        </div>
                      </div>

                      {/* 주요 인사이트 */}
                      {pattern.insights.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs font-medium mb-2">주요 인사이트</p>
                          <div className="space-y-1">
                            {pattern.insights.slice(0, 2).map((insight) => (
                              <div key={insight.id} className="flex items-center gap-2">
                                {renderInsightBadge(insight.importance)}
                                <span className="text-xs">{insight.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 고객 세그먼트 탭 */}
          <TabsContent value="segments" className="space-y-4">
            {/* 세그먼트 요약 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">총 세그먼트</p>
                <p className="text-lg font-bold text-blue-600">{userSegments.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">가장 큰 세그먼트</p>
                <p className="text-lg font-bold text-green-600">
                  {segmentAnalysis.reduce((max, segment) => 
                    segment.size > max.size ? segment : max, 
                    segmentAnalysis[0] || { name: '-', size: 0 }
                  ).name}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">평균 성장률</p>
                <p className="text-lg font-bold text-purple-600">
                  {userSegments.length > 0 
                    ? (userSegments.reduce((sum, s) => sum + s.trends.growth, 0) / userSegments.length).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>

            {/* 세그먼트 목록 */}
            <div className="space-y-4">
              {userSegments.map((segment) => {
                const analysis = segmentAnalysis.find(s => s.id === segment.id)
                
                return (
                  <Card key={segment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{segment.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {segment.size}명
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{segment.description}</p>
                      
                      {/* 조건 */}
                      <div>
                        <p className="text-xs font-medium mb-2">세그먼트 조건</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground">총 지출</p>
                            <p>₩{segment.criteria.totalSpending.min.toLocaleString()} - ₩{segment.criteria.totalSpending.max === Infinity ? '∞' : segment.criteria.totalSpending.max.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">주문 빈도</p>
                            <p>{segment.criteria.orderFrequency.min} - {segment.criteria.orderFrequency.max === Infinity ? '∞' : segment.criteria.orderFrequency.max}회</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">평균 주문가</p>
                            <p>₩{segment.criteria.averageOrderValue.min.toLocaleString()} - ₩{segment.criteria.averageOrderValue.max === Infinity ? '∞' : segment.criteria.averageOrderValue.max.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">충성도 점수</p>
                            <p>{segment.criteria.loyaltyScore.min} - {segment.criteria.loyaltyScore.max}</p>
                          </div>
                        </div>
                      </div>

                      {/* 특성 */}
                      <div>
                        <p className="text-xs font-medium mb-2">주요 특성</p>
                        <div className="flex flex-wrap gap-1">
                          {segment.characteristics.map((characteristic, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {characteristic}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* 트렌드 */}
                      <div>
                        <p className="text-xs font-medium mb-2">성과 지표</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">성장률</p>
                            <p className={`text-sm font-bold ${
                              segment.trends.growth > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {segment.trends.growth > 0 ? '+' : ''}{segment.trends.growth}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">유지율</p>
                            <p className="text-sm font-bold text-blue-600">{segment.trends.retention}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">이탈률</p>
                            <p className="text-sm font-bold text-orange-600">{segment.trends.churn}%</p>
                          </div>
                        </div>
                      </div>

                      {/* 분포 */}
                      {analysis && (
                        <div>
                          <p className="text-xs font-medium mb-2">전체 고객 중 비율</p>
                          <Progress value={analysis.percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {analysis.percentage.toFixed(1)}% ({analysis.size}명)
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* 인사이트 탭 */}
          <TabsContent value="insights" className="space-y-4">
            {/* 인사이트 통계 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">총 인사이트</p>
                <p className="text-lg font-bold text-blue-600">{insightsSummary.totalInsights}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">긴급/중요</p>
                <p className="text-lg font-bold text-red-600">{insightsSummary.criticalInsights}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">액션 가능</p>
                <p className="text-lg font-bold text-green-600">{insightsSummary.actionableInsights}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">최근 7일</p>
                <p className="text-lg font-bold text-purple-600">{insightsSummary.recentInsights}</p>
              </div>
            </div>

            {/* 인사이트 유형별 분포 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">인사이트 유형별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(insightsSummary.insightsByType).map(([type, count]) => {
                    const typeLabels: Record<string, string> = {
                      spending_trend: '지출 트렌드',
                      category_shift: '카테고리 변화',
                      timing_pattern: '구매 타이밍',
                      price_sensitivity: '가격 민감도',
                      site_preference: '사이트 선호도'
                    }
                    
                    const percentage = insightsSummary.totalInsights > 0 
                      ? (count / insightsSummary.totalInsights) * 100 
                      : 0

                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {typeLabels[type] || type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {count}개 ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 최근 인사이트 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">최근 중요 인사이트</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {allPatterns
                      .flatMap(pattern => pattern.insights)
                      .filter(insight => insight.importance === 'critical' || insight.importance === 'high')
                      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
                      .slice(0, 10)
                      .map((insight) => (
                        <div key={insight.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {renderInsightBadge(insight.importance)}
                              {insight.actionable && (
                                <Badge variant="outline" className="text-xs">액션 가능</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              신뢰도: {insight.confidence}%
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(insight.generatedAt, { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 추천 규칙 탭 */}
          <TabsContent value="recommendations" className="space-y-4">
            {/* 추천 성과 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">총 규칙</p>
                <p className="text-lg font-bold text-blue-600">{recommendationPerformance.totalRules}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">활성 규칙</p>
                <p className="text-lg font-bold text-green-600">{recommendationPerformance.activeRules}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">비활성 규칙</p>
                <p className="text-lg font-bold text-gray-600">{recommendationPerformance.inactiveRules}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">활용률</p>
                <p className="text-lg font-bold text-purple-600">
                  {recommendationPerformance.utilizationRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* 새 규칙 추가 버튼 */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">추천 규칙 목록</h3>
              <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-3 h-3 mr-1" />
                    새 규칙 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>새 추천 규칙 추가</DialogTitle>
                    <DialogDescription>
                      고객 세그먼트와 구매 패턴을 기반으로 개인화된 추천 규칙을 설정하세요.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ruleName">규칙명 *</Label>
                        <Input
                          id="ruleName"
                          placeholder="예: 프리미엄 전자제품 추천"
                          value={newRuleForm.name}
                          onChange={(e) => setNewRuleForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">우선순위</Label>
                        <Select 
                          value={newRuleForm.priority.toString()} 
                          onValueChange={(value) => setNewRuleForm(prev => ({ ...prev, priority: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">높음 (10)</SelectItem>
                            <SelectItem value="5">보통 (5)</SelectItem>
                            <SelectItem value="1">낮음 (1)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">설명 *</Label>
                      <Textarea
                        id="description"
                        placeholder="규칙의 목적과 적용 조건을 설명하세요"
                        value={newRuleForm.description}
                        onChange={(e) => setNewRuleForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>추천 메시지</Label>
                      <Input
                        placeholder="고객에게 표시할 추천 메시지"
                        value={newRuleForm.recommendations.customMessage}
                        onChange={(e) => setNewRuleForm(prev => ({ 
                          ...prev, 
                          recommendations: { 
                            ...prev.recommendations, 
                            customMessage: e.target.value 
                          } 
                        }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={newRuleForm.enabled}
                        onCheckedChange={(checked) => setNewRuleForm(prev => ({ ...prev, enabled: checked }))}
                      />
                      <Label htmlFor="enabled">규칙 활성화</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddRule} disabled={isAddingRule}>
                      {isAddingRule ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                          추가 중...
                        </>
                      ) : (
                        '추가'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* 규칙 목록 */}
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {recommendationRules.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">설정된 추천 규칙이 없습니다</p>
                  </div>
                ) : (
                  recommendationRules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? '활성' : '비활성'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            우선순위: {rule.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                          />
                          <Button variant="ghost" size="sm">
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRule(rule.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{rule.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-medium text-muted-foreground">조건</p>
                          <div className="space-y-1 mt-1">
                            {rule.conditions.categories.length > 0 && (
                              <p>카테고리: {rule.conditions.categories.join(', ')}</p>
                            )}
                            <p>
                              가격대: ₩{rule.conditions.priceRange.min.toLocaleString()} - 
                              ₩{rule.conditions.priceRange.max === Infinity ? '∞' : rule.conditions.priceRange.max.toLocaleString()}
                            </p>
                            {rule.conditions.userSegment.length > 0 && (
                              <p>대상 고객: {rule.conditions.userSegment.join(', ')}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">추천 내용</p>
                          <div className="space-y-1 mt-1">
                            {rule.recommendations.suggestCategories.length > 0 && (
                              <p>추천 카테고리: {rule.recommendations.suggestCategories.join(', ')}</p>
                            )}
                            {rule.recommendations.customMessage && (
                              <p>메시지: {rule.recommendations.customMessage}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}