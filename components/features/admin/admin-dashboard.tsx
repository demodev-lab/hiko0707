'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  Clock,
  Database,
  BarChart3,
  Users,
  Zap,
  Brain,
  Settings,
  Activity,
  Calendar,
  Target,
  CheckCircle2,
  Bell,
  Eye,
  ArrowUp,
  ArrowDown,
  Percent
} from 'lucide-react'
import { Order } from '@/types/order'
import { StatsCard } from '@/components/features/admin/stats-card'
import { useBuyForMeAdmin } from '@/hooks/use-buy-for-me'
import { getCrawlerProgress } from '@/actions/crawler-actions'
import { useQuoteAutomation } from '@/hooks/use-quote-automation'
import { useShippingAutomation } from '@/hooks/use-shipping-automation'
import { useInventoryAutomation } from '@/hooks/use-inventory-automation'
import { usePurchaseAnalytics, useAnalyticsDashboard } from '@/hooks/use-purchase-analytics'
import { useRecommendationDashboard } from '@/hooks/use-recommendation-engine'
import { QuoteAutomationManager } from './quote-automation-manager'
import { ShippingAutomationManager } from './shipping-automation-manager'
import { InventoryAutomationManager } from './inventory-automation-manager'
import { PurchaseAnalyticsManager } from './purchase-analytics-manager'
import { RecommendationManager } from './recommendation-manager'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

interface AdminDashboardProps {
  stats: {
    totalUsers: number
    activeUsers: number
    totalOrders: number
    pendingOrders: number
    totalRevenue: number
    totalHotdeals: number
    activeHotdeals: number
  }
  recentOrders: Order[]
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

export function AdminDashboard({ stats, recentOrders }: AdminDashboardProps) {
  const { allRequests } = useBuyForMeAdmin()
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'shipping' | 'inventory' | 'analytics' | 'recommendations'>('overview')
  const [isClient, setIsClient] = useState(false)
  const [crawlerProgress, setCrawlerProgress] = useState<CrawlerProgress>({
    isRunning: false,
    currentStep: '',
    progress: 0,
    currentPost: 0,
    totalPosts: 0,
    source: ''
  })

  // 각 시스템의 요약 데이터
  const { stats: quoteStats } = useQuoteAutomation()
  const { stats: shippingStats } = useShippingAutomation()
  const { inventoryStats, urgentAlerts } = useInventoryAutomation()
  const { analyticsOverview, trendAnalysis } = usePurchaseAnalytics()
  const { performanceMetrics: recommendationMetrics } = useRecommendationDashboard()
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 크롤링 진행도 폴링
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    const checkProgress = async () => {
      try {
        const progressData = await getCrawlerProgress()
        setCrawlerProgress(progressData)
        
        // 크롤링이 실행 중일 때만 지속적으로 폴링
        if (progressData.isRunning && !interval) {
          interval = setInterval(checkProgress, 1000)
        } else if (!progressData.isRunning && interval) {
          clearInterval(interval)
          interval = null
        }
      } catch (error) {
        console.error('진행도 조회 실패:', error)
      }
    }

    // 초기 체크
    checkProgress()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])
  
  const buyForMeStats = {
    total: allRequests.length,
    pending: allRequests.filter(r => r.status === 'pending_review').length,
    active: allRequests.filter(r => ['quote_sent', 'quote_approved', 'payment_pending', 'payment_completed', 'purchasing', 'shipping'].includes(r.status)).length
  }

  // 전체 시스템 상태 요약
  const systemOverview = {
    totalQuotes: 0,
    pendingQuotes: 0,
    totalShipments: shippingStats?.totalProcessed || 0,
    urgentShipments: 0,
    totalInventory: inventoryStats?.totalItems || 0,
    lowStockItems: inventoryStats?.lowStock || 0,
    totalOrders: analyticsOverview?.totalOrders || 0,
    totalRevenue: analyticsOverview?.totalRevenue || 0,
    totalRecommendations: recommendationMetrics?.totalRecommendations || 0,
    recommendationClickRate: recommendationMetrics?.clickRate || 0
  }

  // 주간 성장률 계산
  const weeklyGrowth = {
    orders: trendAnalysis?.recentGrowth || 0,
    revenue: trendAnalysis?.recentGrowth || 0,
    orderVelocity: trendAnalysis?.orderVelocity || 0
  }

  // 알림 항목들
  const alertItems = [
    ...(urgentAlerts?.length > 0 ? [{
      type: 'inventory',
      title: '재고 알림',
      count: urgentAlerts.length,
      severity: 'high' as const,
      description: '재고 확인이 필요한 상품이 있습니다'
    }] : [])
  ]

  // 안전한 포맷팅 함수들
  const formatCurrency = (amount: number) => {
    if (!isClient) return `₩${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    return `₩${amount.toLocaleString('ko-KR')}`
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (!isClient) return dateObj.toISOString().split('T')[0]
    return dateObj.toLocaleDateString('ko-KR')
  }

  const statsCards = [
    {
      title: '대리 구매 요청',
      value: buyForMeStats.total,
      subtitle: `검토 대기: ${buyForMeStats.pending}`,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: '진행중 주문',
      value: buyForMeStats.active,
      subtitle: '처리 중인 주문',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: '활성 핫딜',
      value: stats.activeHotdeals,
      subtitle: `전체: ${stats.totalHotdeals}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: '오늘 매출',
      value: formatCurrency(stats.totalRevenue),
      subtitle: '수수료 수익',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">관리자 대시보드</h1>
              <p className="text-gray-600 mt-1">대리구매 서비스의 전체 시스템을 관리하고 모니터링합니다</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                전체 새로고침
              </Button>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(), 'MM월 dd일', { locale: ko })}
              </Button>
            </div>
          </div>
        </div>

        {/* 알림 */}
        {alertItems.length > 0 && (
          <div className="space-y-2 mb-8">
            {alertItems.map((alert, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  alert.severity === 'high' ? 'border-red-200 bg-red-50' :
                  alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className={`h-5 w-5 ${
                    alert.severity === 'high' ? 'text-red-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={
                    alert.severity === 'high' ? 'destructive' :
                    alert.severity === 'medium' ? 'secondary' : 'outline'
                  }>
                    {alert.count}개
                  </Badge>
                  <Button 
                    size="sm"
                    onClick={() => setActiveTab(alert.type as any)}
                  >
                    확인
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              전체 현황
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2">
              <DollarSign className="h-4 w-4" />
              견적 관리
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2">
              <Package className="h-4 w-4" />
              배송 관리
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Activity className="h-4 w-4" />
              재고 관리
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              분석
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-2">
              <Brain className="h-4 w-4" />
              추천
            </TabsTrigger>
          </TabsList>

          {/* 전체 현황 탭 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 핵심 지표 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 주문수</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemOverview.totalOrders.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {weeklyGrowth.orders > 0 ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">+{weeklyGrowth.orders.toFixed(1)}%</span>
                      </>
                    ) : weeklyGrowth.orders < 0 ? (
                      <>
                        <ArrowDown className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">{weeklyGrowth.orders.toFixed(1)}%</span>
                      </>
                    ) : (
                      <span>변화 없음</span>
                    )}
                    주간 성장률
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 매출</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₩{systemOverview.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {weeklyGrowth.revenue > 0 ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">+{weeklyGrowth.revenue.toFixed(1)}%</span>
                      </>
                    ) : weeklyGrowth.revenue < 0 ? (
                      <>
                        <ArrowDown className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">{weeklyGrowth.revenue.toFixed(1)}%</span>
                      </>
                    ) : (
                      <span>변화 없음</span>
                    )}
                    주간 성장률
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">주문 속도</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weeklyGrowth.orderVelocity.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">주문/일</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">추천 성과</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemOverview.recommendationClickRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {systemOverview.totalRecommendations}개 추천 중
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 기존 대리구매 관련 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat) => (
                <StatsCard key={stat.title} {...stat} />
              ))}
            </div>

            {/* 크롤링 진행도 카드 */}
            {crawlerProgress.isRunning && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    크롤링 진행 중
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">{crawlerProgress.currentStep}</span>
                      <span className="font-medium text-blue-900">{crawlerProgress.progress}%</span>
                    </div>
                    <Progress value={crawlerProgress.progress} className="h-2" />
                    
                    {crawlerProgress.totalPosts > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-blue-600">진행 상황</p>
                          <p className="font-medium text-blue-900">
                            {crawlerProgress.currentPost} / {crawlerProgress.totalPosts}
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-600">소스</p>
                          <p className="font-medium text-blue-900 capitalize">{crawlerProgress.source}</p>
                        </div>
                        {crawlerProgress.estimatedTimeLeft && (
                          <div>
                            <p className="text-blue-600">예상 완료</p>
                            <p className="font-medium text-blue-900 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(crawlerProgress.estimatedTimeLeft / 60)}분 {crawlerProgress.estimatedTimeLeft % 60}초
                            </p>
                          </div>
                        )}
                        <div>
                          <Link href="/admin/crawler">
                            <Button size="sm" variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-100">
                              <Database className="w-4 h-4 mr-2" />
                              크롤러 페이지
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* 대리 구매 알림 카드 */}
            {isClient && buyForMeStats.pending > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-900">
                          새로운 대리 구매 요청이 {buyForMeStats.pending}건 있습니다
                        </p>
                        <p className="text-sm text-yellow-700">
                          검토가 필요한 구매 대행 요청을 확인해주세요
                        </p>
                      </div>
                    </div>
                    <Link href="/admin/buy-for-me">
                      <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        요청 확인
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 기존 대리구매 탭 */}
            <Tabs defaultValue="buy-for-me" className="space-y-4">
              <TabsList>
                <TabsTrigger value="buy-for-me">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  대리 구매 ({buyForMeStats.total})
                </TabsTrigger>
                <TabsTrigger value="hotdeals">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  핫딜 관리
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="buy-for-me" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>대리 구매 요청 현황</span>
                      <Link href="/admin/buy-for-me">
                        <Button variant="outline" size="sm">
                          전체 보기
                        </Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-700">{buyForMeStats.pending}</p>
                        <p className="text-sm text-gray-600 mt-1">검토 대기</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{buyForMeStats.active}</p>
                        <p className="text-sm text-gray-600 mt-1">진행 중</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{buyForMeStats.total}</p>
                        <p className="text-sm text-gray-600 mt-1">전체 요청</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {allRequests.slice(0, 5).map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{request.productInfo.title}</p>
                            <p className="text-xs text-gray-500">
                              {request.shippingInfo.name} · {formatDate(request.requestDate)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {request.status === 'pending_review' ? '검토 대기' : 
                             request.status === 'quote_sent' ? '견적 발송' :
                             request.status === 'purchasing' ? '구매 진행' : '기타'}
                          </Badge>
                        </div>
                      ))}
                      {allRequests.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          아직 대리 구매 요청이 없습니다.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hotdeals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>핫딜 관리</span>
                      <Link href="/admin/hotdeals">
                        <Button variant="outline" size="sm">
                          전체 보기
                        </Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-700">{stats.activeHotdeals}</p>
                          <p className="text-sm text-gray-600 mt-1">활성 핫딜</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-700">{stats.totalHotdeals - stats.activeHotdeals}</p>
                          <p className="text-sm text-gray-600 mt-1">종료된 핫딜</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <Link href="/admin/hotdeals">
                          <Button className="w-full">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            핫딜 관리 페이지로 이동
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* 개별 시스템 관리 탭들 */}
          <TabsContent value="quotes">
            <QuoteAutomationManager />
          </TabsContent>

          <TabsContent value="shipping">
            <ShippingAutomationManager />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryAutomationManager />
          </TabsContent>

          <TabsContent value="analytics">
            <PurchaseAnalyticsManager />
          </TabsContent>

          <TabsContent value="recommendations">
            <RecommendationManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}