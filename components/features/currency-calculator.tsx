'use client'

import { useState } from 'react'
import { Calculator, ArrowUpDown, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrencyCalculator, useCurrency } from '@/hooks/use-currency'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CurrencyCalculatorProps {
  isEmbedded?: boolean  // 모달이나 다른 컨테이너에 포함되어 있는지 여부
}

export function CurrencyCalculator({ isEmbedded = false }: CurrencyCalculatorProps) {
  const [isOpen, setIsOpen] = useState(isEmbedded)  // 임베디드면 기본적으로 열림
  const { lastUpdated, isLoading, refreshRates } = useCurrency()
  const {
    amount,
    setAmount,
    fromCurrency,
    setFromCurrency,
    toCurrency,
    setToCurrency,
    formattedResult,
    exchangeRate,
    currencies,
    swapCurrencies,
  } = useCurrencyCalculator()

  if (!isOpen && !isEmbedded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Calculator className="h-4 w-4" />
        환율 계산기
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            환율 계산기
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            닫기
          </Button>
        </div>
        <CardDescription>
          실시간 환율로 통화를 변환하세요
          {lastUpdated && (
            <span className="block text-xs mt-1">
              마지막 업데이트: {formatDistanceToNow(lastUpdated, { locale: ko, addSuffix: true })}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">보내는 금액</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
              placeholder="금액 입력"
            />
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={swapCurrencies}
            className="rounded-full"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">받는 금액</label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-md">
              <span className="text-lg font-semibold">{formattedResult}</span>
            </div>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Exchange Rate Info */}
        {exchangeRate && (
          <div className="text-sm text-muted-foreground text-center">
            1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshRates}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            환율 새로고침
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}