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
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-5 rounded-xl border border-amber-200 dark:border-amber-800/50 space-y-4">
          {/* 메인 팁 섹션 */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                스마트 쇼핑 팁
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                핫딜 가격을 미리 다른 통화로 확인해보고 더 현명한 쇼핑을 하세요
              </p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-amber-200 dark:border-amber-800"></div>

          {/* 업데이트 정보 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">실시간 환율 정보</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                30분마다 자동 업데이트
              </p>
              {lastUpdated && (
                <div className="bg-white/60 dark:bg-black/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">마지막 갱신</p>
                  <p className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200">
                    {lastUpdated.toLocaleString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* 새로고침 버튼 섹션 */}
            <div className="flex justify-center lg:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshRates}
                disabled={isLoading}
                className="gap-2 h-9 px-4 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-medium shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                수동 새로고침
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}