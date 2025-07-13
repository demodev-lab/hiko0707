'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Truck, 
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Settings,
  Plus,
  Eye,
  ExternalLink,
  Target,
  Activity
} from 'lucide-react'
import { useShippingAutomation } from '@/hooks/use-shipping-automation'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ShippingAutomationManagerProps {
  className?: string
}

export function ShippingAutomationManager({ className = '' }: ShippingAutomationManagerProps) {
  const [activeTab, setActiveTab] = useState<'tracking' | 'analytics'>('tracking')
  const { trackings, stats, loading, error, refreshTracking } = useShippingAutomation()

  const renderStatusBadge = (status: string) => {
    const config = {
      pending_pickup: { variant: 'secondary' as const, label: '픽업 대기' },
      picked_up: { variant: 'default' as const, label: '수거 완료' },
      in_transit: { variant: 'default' as const, label: '배송중' },
      customs_processing: { variant: 'outline' as const, label: '통관중' },
      out_for_delivery: { variant: 'default' as const, label: '배송 출발' },
      delivered: { variant: 'default' as const, label: '배송 완료' },
      failed: { variant: 'destructive' as const, label: '배송 실패' }
    }

    const { variant, label } = config[status as keyof typeof config] || config.pending_pickup

    return <Badge variant={variant}>{label}</Badge>
  }

  const renderTrackingTimeline = (tracking: any) => {
    return (
      <div className="space-y-3">
        {tracking.events.map((event: any, index: number) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`w-3 h-3 rounded-full mt-1 ${
              index === 0 ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{event.description}</p>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.timestamp), 'MM/dd HH:mm', { locale: ko })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{event.location}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">배송 정보를 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            배송 자동화 관리
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-3 h-3 mr-1" />
            새로고침
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tracking">배송 추적</TabsTrigger>
            <TabsTrigger value="analytics">성능 분석</TabsTrigger>
          </TabsList>

          {/* 배송 추적 탭 */}
          <TabsContent value="tracking" className="space-y-4">
            {/* 요약 통계 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">활성 배송</p>
                <p className="text-lg font-bold text-blue-600">{stats.activeShipments}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">배송중</p>
                <p className="text-lg font-bold text-yellow-600">{stats.inTransit}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">오늘 배송완료</p>
                <p className="text-lg font-bold text-green-600">{stats.deliveredToday}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">통관중</p>
                <p className="text-lg font-bold text-purple-600">{stats.customsProcessing}</p>
              </div>
            </div>

            {/* 지연 배송 알림 */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 추적 목록 */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {trackings.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">활성 배송이 없습니다</p>
                  </div>
                ) : (
                  trackings.map((tracking) => (
                    <div key={tracking.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{tracking.domesticTrackingNumber}</h4>
                          {renderStatusBadge(tracking.status)}
                          <Badge variant="outline" className="text-xs">
                            {tracking.domesticCarrier}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refreshTracking(tracking.id)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a 
                              href={`#`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">주문번호</p>
                          <p className="font-medium">{tracking.orderId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">국제 운송장</p>
                          <p className="font-medium">{tracking.internationalTrackingNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">마지막 업데이트</p>
                          <p className="font-medium">
                            {formatDistanceToNow(new Date(tracking.lastUpdated), { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </p>
                        </div>
                      </div>

                      {/* 최근 이벤트 */}
                      {tracking.events.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs font-medium mb-1">최근 상태</p>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            <span className="text-xs">
                              {tracking.events[0].location} - {tracking.events[0].description}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 예상 배송일 */}
                      {tracking.estimatedDelivery && tracking.status !== 'delivered' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            예상 배송일: {format(new Date(tracking.estimatedDelivery), 'MM월 dd일', { locale: ko })}
                            {new Date() > new Date(tracking.estimatedDelivery) && (
                              <span className="text-red-600 ml-1">(지연)</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 성능 분석 탭 */}
          <TabsContent value="analytics" className="space-y-4">
            {/* 핵심 지표 */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">평균 배송 시간</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-bold">{stats.avgDeliveryTime.toFixed(1)}일</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    총 {stats.totalProcessed}건 기준
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">정시 배송률</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-lg font-bold">{stats.onTimeDeliveryRate}%</span>
                  </div>
                  <Progress value={stats.onTimeDeliveryRate} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* 배송 상태 분포 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">배송 상태 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">픽업 대기</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(stats.pendingPickup / stats.activeShipments) * 100} className="w-32" />
                      <span className="text-xs text-muted-foreground w-10 text-right">{stats.pendingPickup}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">배송중</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(stats.inTransit / stats.activeShipments) * 100} className="w-32" />
                      <span className="text-xs text-muted-foreground w-10 text-right">{stats.inTransit}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">통관중</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(stats.customsProcessing / stats.activeShipments) * 100} className="w-32" />
                      <span className="text-xs text-muted-foreground w-10 text-right">{stats.customsProcessing}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}