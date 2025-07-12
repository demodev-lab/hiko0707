'use client'

import { useState, useEffect } from 'react'
import { Calculator, Info, TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

export interface FeeCalculatorProps {
  amount?: number
  onAmountChange?: (amount: number) => void
  showDetailBreakdown?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'inline'
}

const SERVICE_FEE_RATE = 0.08 // 8% 서비스 수수료
const DOMESTIC_SHIPPING_FEE = 3000 // 국내 배송비
const MIN_SERVICE_FEE = 1000 // 최소 서비스 수수료

export function FeeCalculator({
  amount = 0,
  onAmountChange,
  showDetailBreakdown = true,
  className,
  variant = 'default'
}: FeeCalculatorProps) {
  const { t } = useLanguage()
  const [inputAmount, setInputAmount] = useState(amount.toString())
  const [isCalculating, setIsCalculating] = useState(false)

  // 수수료 계산
  const calculateFees = (productAmount: number) => {
    const serviceFee = Math.max(Math.round(productAmount * SERVICE_FEE_RATE), productAmount > 0 ? MIN_SERVICE_FEE : 0)
    const domesticShipping = productAmount > 0 ? DOMESTIC_SHIPPING_FEE : 0
    const totalAmount = productAmount + serviceFee + domesticShipping
    
    return {
      productAmount,
      serviceFee,
      serviceFeeRate: SERVICE_FEE_RATE * 100,
      domesticShipping,
      totalAmount,
      savingsAmount: Math.round(productAmount * 0.02) // 2% 예상 절약액
    }
  }

  const fees = calculateFees(amount)

  // 금액 입력 처리
  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setInputAmount(numericValue)
    
    if (onAmountChange) {
      const parsedAmount = parseInt(numericValue) || 0
      setIsCalculating(true)
      onAmountChange(parsedAmount)
      setTimeout(() => setIsCalculating(false), 300)
    }
  }

  // 금액 포맷팅
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(value)
  }

  // 금액 변경 시 입력값 동기화
  useEffect(() => {
    setInputAmount(amount.toString())
  }, [amount])

  // Compact 버전
  if (variant === 'compact') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">상품 금액</span>
          <span className="font-medium">{formatCurrency(fees.productAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">서비스 수수료 (8%)</span>
          <span className="font-medium text-orange-600">{formatCurrency(fees.serviceFee)}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <span className="font-medium">총 예상 금액</span>
          <span className="font-bold text-lg">{formatCurrency(fees.totalAmount)}</span>
        </div>
      </div>
    )
  }

  // Inline 버전
  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Badge variant="secondary" className="font-normal">
          수수료 {formatCurrency(fees.serviceFee)}
        </Badge>
        <span className="text-muted-foreground">→</span>
        <span className="font-semibold">
          총 {formatCurrency(fees.totalAmount)}
        </span>
      </div>
    )
  }

  // Default 버전
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          수수료 계산기
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 금액 입력 */}
        {onAmountChange && (
          <div>
            <Label htmlFor="amount">상품 금액 입력</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="amount"
                type="text"
                value={inputAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="pl-10 pr-12"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                원
              </span>
            </div>
          </div>
        )}

        {/* 계산 결과 */}
        <div className={cn(
          "space-y-3 transition-all duration-300",
          isCalculating && "opacity-50"
        )}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">상품 금액</span>
              <span className="font-medium">{formatCurrency(fees.productAmount)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">서비스 수수료</span>
                <Badge variant="secondary" className="text-xs">
                  {fees.serviceFeeRate}%
                </Badge>
              </div>
              <span className="font-medium text-orange-600">
                {formatCurrency(fees.serviceFee)}
              </span>
            </div>

            {showDetailBreakdown && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">국내 배송비</span>
                  <span className="font-medium">{formatCurrency(fees.domesticShipping)}</span>
                </div>

                {fees.savingsAmount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">예상 절약액</span>
                    </div>
                    <span className="font-medium">
                      -{formatCurrency(fees.savingsAmount)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-semibold">총 예상 금액</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(fees.totalAmount)}
            </span>
          </div>
        </div>

        {/* 안내 메시지 */}
        {showDetailBreakdown && (
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
              <ul className="space-y-1 mt-1">
                <li>• 실제 구매 시 환율 변동에 따라 금액이 달라질 수 있습니다</li>
                <li>• 일부 상품은 추가 관세가 발생할 수 있습니다</li>
                <li>• 최종 견적은 관리자 확인 후 제공됩니다</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// 수수료 계산 유틸리티 함수 export
export function calculateServiceFee(amount: number): number {
  return Math.max(Math.round(amount * SERVICE_FEE_RATE), amount > 0 ? MIN_SERVICE_FEE : 0)
}

export function calculateTotalAmount(productAmount: number): {
  productAmount: number
  serviceFee: number
  domesticShipping: number
  totalAmount: number
} {
  const serviceFee = calculateServiceFee(productAmount)
  const domesticShipping = productAmount > 0 ? DOMESTIC_SHIPPING_FEE : 0
  const totalAmount = productAmount + serviceFee + domesticShipping
  
  return {
    productAmount,
    serviceFee,
    domesticShipping,
    totalAmount
  }
}