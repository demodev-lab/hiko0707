'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Equal,
  AlertTriangle,
  CheckCircle2,
  Target,
  Calculator,
  ShoppingCart,
  ExternalLink
} from 'lucide-react'
import { PriceCheckResult } from '@/lib/services/price-verification'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PriceComparisonData {
  source: string
  estimatedPrice: number
  actualPrice: number
  accuracy: number
  lastChecked: Date
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown'
  confidence: number
  url?: string
}

interface PriceComparisonTableProps {
  comparisons: PriceComparisonData[]
  title?: string
  showAccuracy?: boolean
  className?: string
}

export function PriceComparisonTable({ 
  comparisons, 
  title = "가격 비교",
  showAccuracy = true,
  className = '' 
}: PriceComparisonTableProps) {
  const [sortBy, setSortBy] = useState<'price' | 'accuracy' | 'updated'>('price')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // 정렬된 데이터
  const sortedComparisons = useMemo(() => {
    return [...comparisons].sort((a, b) => {
      let aVal: number, bVal: number
      
      switch (sortBy) {
        case 'price':
          aVal = a.actualPrice
          bVal = b.actualPrice
          break
        case 'accuracy':
          aVal = a.accuracy
          bVal = b.accuracy
          break
        case 'updated':
          aVal = a.lastChecked.getTime()
          bVal = b.lastChecked.getTime()
          break
        default:
          return 0
      }
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [comparisons, sortBy, sortOrder])

  // 통계 계산
  const stats = useMemo(() => {
    if (comparisons.length === 0) return null
    
    const prices = comparisons.map(c => c.actualPrice)
    const accuracies = comparisons.map(c => c.accuracy)
    const availableCount = comparisons.filter(c => c.availability === 'in_stock').length
    
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      avgAccuracy: accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
      availableCount,
      totalCount: comparisons.length,
      priceDifference: Math.max(...prices) - Math.min(...prices)
    }
  }, [comparisons])

  const handleSort = (field: 'price' | 'accuracy' | 'updated') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const renderTrendIndicator = (comparison: PriceComparisonData) => {
    const difference = comparison.actualPrice - comparison.estimatedPrice
    const percentChange = (difference / comparison.estimatedPrice) * 100
    
    if (Math.abs(percentChange) < 1) {
      return (
        <div className="flex items-center gap-1 text-gray-600">
          <Equal className="w-3 h-3" />
          <span className="text-xs">±0%</span>
        </div>
      )
    }
    
    const isIncrease = percentChange > 0
    return (
      <div className={`flex items-center gap-1 ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
        {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span className="text-xs">
          {isIncrease ? '+' : ''}{percentChange.toFixed(1)}%
        </span>
      </div>
    )
  }

  const renderAvailabilityBadge = (availability: string) => {
    const config = {
      in_stock: { variant: 'default' as const, label: '재고 있음', color: 'bg-green-100 text-green-800' },
      limited: { variant: 'secondary' as const, label: '재고 부족', color: 'bg-yellow-100 text-yellow-800' },
      out_of_stock: { variant: 'destructive' as const, label: '품절', color: 'bg-red-100 text-red-800' },
      unknown: { variant: 'outline' as const, label: '확인 불가', color: 'bg-gray-100 text-gray-800' }
    }
    
    const { variant, label, color } = config[availability as keyof typeof config] || config.unknown
    
    return (
      <Badge variant={variant} className={`text-xs ${color} border-0`}>
        {label}
      </Badge>
    )
  }

  const renderAccuracyIndicator = (accuracy: number) => {
    let color = 'bg-red-500'
    let textColor = 'text-red-600'
    
    if (accuracy >= 90) {
      color = 'bg-green-500'
      textColor = 'text-green-600'
    } else if (accuracy >= 70) {
      color = 'bg-yellow-500'
      textColor = 'text-yellow-600'
    }
    
    return (
      <div className="flex items-center gap-2">
        <Progress value={accuracy} className="w-12 h-2" />
        <span className={`text-xs font-medium ${textColor}`}>
          {accuracy.toFixed(0)}%
        </span>
      </div>
    )
  }

  const getBestPrice = () => {
    const available = comparisons.filter(c => c.availability === 'in_stock')
    return available.length > 0 ? 
      Math.min(...available.map(c => c.actualPrice)) :
      Math.min(...comparisons.map(c => c.actualPrice))
  }

  const bestPrice = getBestPrice()

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            {title}
          </CardTitle>
          {stats && (
            <Badge variant="outline" className="text-xs">
              {stats.availableCount}/{stats.totalCount} 구매 가능
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 요약 통계 */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">최저가</p>
              <p className="text-sm font-bold text-green-600">₩{stats.minPrice.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">최고가</p>
              <p className="text-sm font-bold text-red-600">₩{stats.maxPrice.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">평균가</p>
              <p className="text-sm font-medium">₩{Math.round(stats.avgPrice).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">가격차</p>
              <p className="text-sm font-medium">₩{stats.priceDifference.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* 정렬 버튼 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">정렬:</span>
          <Button
            variant={sortBy === 'price' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('price')}
            className="text-xs h-6"
          >
            가격 {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          {showAccuracy && (
            <Button
              variant={sortBy === 'accuracy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('accuracy')}
              className="text-xs h-6"
            >
              정확도 {sortBy === 'accuracy' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
          )}
          <Button
            variant={sortBy === 'updated' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('updated')}
            className="text-xs h-6"
          >
            업데이트 {sortBy === 'updated' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
        </div>

        {/* 가격 비교 테이블 */}
        <div className="space-y-2">
          {sortedComparisons.map((comparison, index) => {
            const isBestPrice = comparison.actualPrice === bestPrice && comparison.availability === 'in_stock'
            
            return (
              <div 
                key={index} 
                className={`p-3 border rounded-lg transition-colors ${
                  isBestPrice ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium">{comparison.source}</h4>
                      {isBestPrice && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Target className="w-3 h-3 mr-1" />
                          최저가
                        </Badge>
                      )}
                      {renderAvailabilityBadge(comparison.availability)}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">예상가</p>
                        <p className="font-medium">₩{comparison.estimatedPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">실제가</p>
                        <p className="font-bold text-blue-600">₩{comparison.actualPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">변동</p>
                        {renderTrendIndicator(comparison)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {showAccuracy && renderAccuracyIndicator(comparison.accuracy)}
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(comparison.lastChecked, 'HH:mm', { locale: ko })}
                      </span>
                      {comparison.url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={comparison.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs h-6 px-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 신뢰도 표시 */}
                {comparison.confidence < 80 && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      신뢰도 낮음 ({comparison.confidence}%) - 가격 확인 필요
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )
          })}
        </div>

        {/* 전체 정확도 요약 */}
        {showAccuracy && stats && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">전체 가격 예측 정확도</span>
              <div className="flex items-center gap-2">
                {stats.avgAccuracy >= 90 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : stats.avgAccuracy >= 70 ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-bold">
                  {stats.avgAccuracy.toFixed(1)}%
                </span>
              </div>
            </div>
            <Progress value={stats.avgAccuracy} className="mt-2" />
          </div>
        )}

        {/* 구매 추천 */}
        {stats && stats.availableCount > 0 && (
          <Alert>
            <ShoppingCart className="h-4 w-4" />
            <AlertTitle className="text-sm">구매 추천</AlertTitle>
            <AlertDescription className="text-xs">
              현재 {stats.availableCount}개 쇼핑몰에서 구매 가능합니다. 
              최저가는 ₩{bestPrice.toLocaleString()}입니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 데이터 없음 */}
        {comparisons.length === 0 && (
          <div className="text-center py-6">
            <Calculator className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              비교할 가격 데이터가 없습니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}