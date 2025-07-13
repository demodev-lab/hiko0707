'use client'

import { useState, useEffect } from 'react'
import { Calculator, ArrowUpDown, RefreshCw, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrencyCalculator, useCurrency } from '@/hooks/use-currency'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

interface CurrencyCalculatorProps {
  isEmbedded?: boolean  // 모달이나 다른 컨테이너에 포함되어 있는지 여부
}

export function CurrencyCalculator({ isEmbedded = false }: CurrencyCalculatorProps) {
  const [isOpen, setIsOpen] = useState(isEmbedded)  // 임베디드면 기본적으로 열림
  const { lastUpdated, isLoading, refreshRates, selectedCurrency } = useCurrency()
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
  
  // 사용자가 선택한 통화를 기본값으로 설정
  useEffect(() => {
    if (selectedCurrency && selectedCurrency !== 'KRW') {
      setToCurrency(selectedCurrency)
    }
  }, [selectedCurrency, setToCurrency])
  
  // 빠른 금액 선택 버튼
  const quickAmounts = [10000, 50000, 100000, 500000, 1000000]

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
    <Card className="w-full">
      {!isEmbedded && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5" />
              환율 계산기
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 px-2"
            >
              닫기
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-4 pt-4">
        {/* 환율 정보 및 업데이트 시간 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  현재 환율
                </p>
                {lastUpdated && (
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {formatDistanceToNow(lastUpdated, { locale: ko, addSuffix: true })} 업데이트
                  </p>
                )}
              </div>
            </div>
            {exchangeRate && (
              <Badge variant="secondary" className="text-sm font-bold px-3 py-1.5 self-start sm:self-auto">
                1 {fromCurrency} = {exchangeRate.toFixed(2)} {toCurrency}
              </Badge>
            )}
          </div>
        </div>
        
        {/* From Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">한국 원화 (KRW)</label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 text-lg"
                placeholder="금액을 입력하세요"
              />
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="w-28">
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
            
            {/* 빠른 금액 선택 */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="text-xs"
                >
                  {quickAmount.toLocaleString()}원
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={swapCurrencies}
            className="rounded-full px-4 gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="text-xs">통화 바꾸기</span>
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">변환된 금액</label>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formattedResult}
              </p>
            </div>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-28">
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

        {/* 추가 정보 */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg shrink-0">
              <span className="text-lg">💡</span>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                팁: 핫딜 가격을 다른 통화로 미리 확인해보세요
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  • 실시간 환율이 30분마다 자동 업데이트됩니다
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshRates}
                  disabled={isLoading}
                  className="gap-1.5 h-8"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  지금 새로고침
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}