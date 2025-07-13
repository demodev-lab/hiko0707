'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  ExternalLink,
  DollarSign,
  Info,
  Loader2
} from 'lucide-react'
import { usePriceVerification, usePriceComparison } from '@/hooks/use-price-verification'
import { HotDeal } from '@/types/hotdeal'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PriceVerificationPanelProps {
  hotdeal: HotDeal
  quantity: number
  onPriceUpdate?: (newPrice: number, verification: any) => void
  className?: string
}

export function PriceVerificationPanel({ 
  hotdeal, 
  quantity, 
  onPriceUpdate,
  className = '' 
}: PriceVerificationPanelProps) {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  
  const {
    priceResult,
    priceChange,
    isLoading,
    error,
    refreshPrice,
    isPriceStale
  } = usePriceVerification(hotdeal, true)
  
  const { comparePrice } = usePriceComparison()

  // 가격 업데이트 콜백
  useEffect(() => {
    if (priceResult?.success && priceResult.currentPrice && onPriceUpdate) {
      onPriceUpdate(priceResult.currentPrice, priceResult)
    }
  }, [priceResult, onPriceUpdate])

  // 자동 새로고침 설정
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshPrice()
      }, 2 * 60 * 1000) // 2분마다 새로고침
      setRefreshInterval(interval)
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [autoRefresh, refreshPrice])

  const estimatedPrice = parseInt(String(hotdeal.price).replace(/[^0-9]/g, '')) || 0
  const currentPrice = priceResult?.currentPrice || estimatedPrice
  const comparison = comparePrice(estimatedPrice, currentPrice)

  const renderPriceStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">가격 확인 중...</span>
        </div>
      )
    }

    if (error || !priceResult?.success) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">가격 확인 실패</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm">가격 확인 완료</span>
        {isPriceStale && (
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            업데이트 필요
          </Badge>
        )}
      </div>
    )
  }

  const renderPriceTrend = () => {
    if (!comparison.isSignificant) {
      return (
        <div className="flex items-center gap-1 text-gray-600">
          <Minus className="w-4 h-4" />
          <span className="text-sm">변동 없음</span>
        </div>
      )
    }

    const isIncrease = comparison.trend === 'higher'
    const color = isIncrease ? 'text-red-600' : 'text-green-600'
    const icon = isIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />

    return (
      <div className={`flex items-center gap-1 ${color}`}>
        {icon}
        <span className="text-sm font-medium">
          {Math.abs(comparison.percentage).toFixed(1)}%
        </span>
      </div>
    )
  }

  const renderAvailabilityBadge = () => {
    if (!priceResult?.availability) return null

    const availabilityConfig = {
      in_stock: { label: '재고 있음', variant: 'default' as const, color: 'text-green-700' },
      limited: { label: '재고 부족', variant: 'secondary' as const, color: 'text-yellow-700' },
      out_of_stock: { label: '품절', variant: 'destructive' as const, color: 'text-red-700' },
      unknown: { label: '재고 확인 불가', variant: 'outline' as const, color: 'text-gray-700' }
    }

    const config = availabilityConfig[priceResult.availability]
    
    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            실시간 가격 확인
          </CardTitle>
          <div className="flex items-center gap-2">
            {renderAvailabilityBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPrice}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 가격 확인 상태 */}
        <div className="flex items-center justify-between">
          {renderPriceStatus()}
          {priceResult?.lastChecked && (
            <span className="text-xs text-muted-foreground">
              마지막 확인: {format(priceResult.lastChecked, 'HH:mm:ss', { locale: ko })}
            </span>
          )}
        </div>

        {/* 가격 정보 */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">예상 가격</p>
              <p className="text-sm font-medium">₩{estimatedPrice.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">실제 가격</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">₩{currentPrice.toLocaleString()}</p>
                {renderPriceTrend()}
              </div>
            </div>
          </div>

          {/* 가격 변동 표시 */}
          {comparison.isSignificant && (
            <Alert className={comparison.trend === 'higher' ? 'border-red-200' : 'border-green-200'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm">가격 변동 감지</AlertTitle>
              <AlertDescription className="text-xs">
                {comparison.message}
                <br />
                차액: ₩{Math.abs(comparison.difference).toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* 총 예상 금액 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>상품 금액 (수량 {quantity}개)</span>
              <span className="font-medium">₩{(currentPrice * quantity).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>예상 서비스 수수료 (8%)</span>
              <span>₩{Math.round(currentPrice * quantity * 0.08).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>배송비</span>
              <span>견적서에서 확정</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>예상 총액</span>
              <span className="text-blue-600">
                ₩{(currentPrice * quantity + Math.round(currentPrice * quantity * 0.08) + 3000).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 추가 정보 */}
          {priceResult?.success && (
            <div className="space-y-2">
              {priceResult.originalPrice && priceResult.originalPrice !== currentPrice && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>정가</span>
                  <span className="line-through">₩{priceResult.originalPrice.toLocaleString()}</span>
                </div>
              )}
              
              {priceResult.discountRate && (
                <div className="flex justify-between text-xs">
                  <span>할인율</span>
                  <span className="text-red-600 font-medium">{priceResult.discountRate}% 할인</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>판매처</span>
                <span>{priceResult.source}</span>
              </div>
            </div>
          )}

          {/* 가격 확인 실패 시 안내 */}
          {(error || !priceResult?.success) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle className="text-sm">가격 확인 안내</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <p>• 실시간 가격 확인에 실패했습니다</p>
                <p>• 예상 가격으로 견적서를 작성합니다</p>
                <p>• 관리자가 실제 쇼핑몰에서 정확한 가격을 확인합니다</p>
              </AlertDescription>
            </Alert>
          )}

          {/* 자동 새로고침 옵션 */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">자동 새로고침</span>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="text-xs h-6"
              >
                {autoRefresh ? '켜짐' : '꺼짐'}
              </Button>
            </div>
            
            {hotdeal.originalUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(hotdeal.originalUrl, '_blank')}
                className="text-xs h-6"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                원본 확인
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}