'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  DollarSign,
  BarChart3,
  Activity
} from 'lucide-react'
import { PriceTrackingData, PricePoint } from '@/lib/services/price-verification'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PriceTrackingChartProps {
  trackingData: PriceTrackingData
  className?: string
}

export function PriceTrackingChart({ trackingData, className = '' }: PriceTrackingChartProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h')
  
  // 시간 범위에 따른 데이터 필터링
  const filteredData = useMemo(() => {
    const now = new Date()
    const ranges = {
      '1h': 1 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }
    
    const cutoff = now.getTime() - ranges[timeRange]
    return trackingData.priceHistory.filter(point => 
      point.timestamp.getTime() >= cutoff
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }, [trackingData.priceHistory, timeRange])

  // 가격 통계 계산
  const priceStats = useMemo(() => {
    if (filteredData.length === 0) return null
    
    const prices = filteredData.map(point => point.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const latest = prices[prices.length - 1]
    const initial = prices[0]
    const change = latest - initial
    const changePercent = initial !== 0 ? (change / initial) * 100 : 0
    
    return {
      min,
      max,
      latest,
      initial,
      change,
      changePercent,
      trend: changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable'
    }
  }, [filteredData])

  // 간단한 라인 차트를 위한 SVG 경로 생성
  const generateChartPath = () => {
    if (filteredData.length < 2) return ''
    
    const width = 300
    const height = 100
    const padding = 10
    
    const xScale = (width - 2 * padding) / (filteredData.length - 1)
    const prices = filteredData.map(point => point.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1
    
    const points = filteredData.map((point, index) => {
      const x = padding + index * xScale
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding)
      return `${x},${y}`
    })
    
    return `M ${points.join(' L ')}`
  }

  const chartPath = generateChartPath()

  const renderTrendIcon = () => {
    if (!priceStats) return null
    
    switch (priceStats.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const renderTrendBadge = () => {
    if (!priceStats) return null
    
    const config = {
      up: { variant: 'destructive' as const, label: '상승', color: 'text-red-600' },
      down: { variant: 'default' as const, label: '하락', color: 'text-green-600' },
      stable: { variant: 'secondary' as const, label: '안정', color: 'text-gray-600' }
    }
    
    const { variant, label, color } = config[priceStats.trend as keyof typeof config]
    
    return (
      <Badge variant={variant} className="text-xs">
        <span className={color}>
          {label} {Math.abs(priceStats.changePercent).toFixed(1)}%
        </span>
      </Badge>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            가격 추이
          </CardTitle>
          <div className="flex items-center gap-1">
            {['1h', '6h', '24h', '7d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range as any)}
                className="text-xs h-6 px-2"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 현재 가격 및 변동 정보 */}
        {priceStats && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">₩{priceStats.latest.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-sm">
                {renderTrendIcon()}
                <span className={priceStats.change >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {priceStats.change >= 0 ? '+' : ''}₩{priceStats.change.toLocaleString()}
                </span>
                {renderTrendBadge()}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                마지막 업데이트: {format(trackingData.lastChecked, 'HH:mm', { locale: ko })}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="w-3 h-3" />
                {filteredData.length}개 데이터 포인트
              </div>
            </div>
          </div>
        )}

        {/* 간단한 라인 차트 */}
        {filteredData.length >= 2 && (
          <div className="relative">
            <svg width="100%" height="100" viewBox="0 0 300 100" className="border rounded">
              {/* 그리드 라인 */}
              <defs>
                <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="300" height="100" fill="url(#grid)" />
              
              {/* 가격 라인 */}
              {chartPath && (
                <path
                  d={chartPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {/* 데이터 포인트 */}
              {filteredData.map((point, index) => {
                const width = 300
                const height = 100
                const padding = 10
                const xScale = (width - 2 * padding) / (filteredData.length - 1)
                const prices = filteredData.map(p => p.price)
                const minPrice = Math.min(...prices)
                const maxPrice = Math.max(...prices)
                const priceRange = maxPrice - minPrice || 1
                
                const x = padding + index * xScale
                const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding)
                
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="2"
                    fill="#3b82f6"
                    className="hover:r-3 transition-all"
                  >
                    <title>
                      ₩{point.price.toLocaleString()} - {format(point.timestamp, 'MM/dd HH:mm', { locale: ko })}
                    </title>
                  </circle>
                )
              })}
            </svg>
          </div>
        )}

        {/* 가격 범위 정보 */}
        {priceStats && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">최저가</p>
              <p className="font-medium text-green-600">₩{priceStats.min.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">최고가</p>
              <p className="font-medium text-red-600">₩{priceStats.max.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">변동폭</p>
              <p className="font-medium">₩{(priceStats.max - priceStats.min).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* 최근 가격 변동 이력 */}
        {filteredData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              최근 변동 이력
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {filteredData.slice(-5).reverse().map((point, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {format(point.timestamp, 'MM/dd HH:mm', { locale: ko })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">₩{point.price.toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs">
                      {point.source}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 데이터 없음 메시지 */}
        {filteredData.length === 0 && (
          <div className="text-center py-6">
            <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              선택한 기간에 가격 데이터가 없습니다
            </p>
          </div>
        )}

        {/* 알림 설정 */}
        {trackingData.alerts.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">가격 알림</h4>
            <div className="space-y-1">
              {trackingData.alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between text-xs">
                  <span className={alert.triggered ? 'text-orange-600' : 'text-muted-foreground'}>
                    {alert.type === 'price_drop' && '가격 하락 알림'}
                    {alert.type === 'price_increase' && '가격 상승 알림'}
                    {alert.type === 'back_in_stock' && '재입고 알림'}
                    {alert.type === 'out_of_stock' && '품절 알림'}
                  </span>
                  <Badge variant={alert.triggered ? "default" : "outline"} className="text-xs">
                    {alert.triggered ? '발생' : '대기'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}