'use client'

import { useState, useEffect, useCallback } from 'react'
import { currencyService, Currency, convertPrice, formatPrice } from '@/lib/services/currency-service'
import { useLocalStorage } from './use-local-storage'

export interface UseCurrencyOptions {
  defaultCurrency?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useCurrency(options: UseCurrencyOptions = {}) {
  const {
    defaultCurrency = 'KRW',
    autoRefresh = true,
    refreshInterval = 30 * 60 * 1000, // 30분
  } = options

  const [selectedCurrency, setSelectedCurrency] = useLocalStorage<string>('preferred-currency', defaultCurrency)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 환율 새로고침
  const refreshRates = useCallback(async () => {
    setIsLoading(true)
    try {
      await currencyService.refreshRates()
      setLastUpdated(currencyService.getLastUpdateTime())
    } catch (error) {
      console.error('Failed to refresh exchange rates:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 초기 로드 및 자동 새로고침
  useEffect(() => {
    setCurrencies(currencyService.getAllCurrencies())
    setLastUpdated(currencyService.getLastUpdateTime())

    if (autoRefresh) {
      const interval = setInterval(refreshRates, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, refreshRates])

  // 가격 변환
  const convert = useCallback((amount: number, from: string, to?: string): number | null => {
    const targetCurrency = to || selectedCurrency
    return convertPrice(amount, from, targetCurrency)
  }, [selectedCurrency])

  // 가격 포맷팅
  const format = useCallback((amount: number, currencyCode?: string, locale?: string): string => {
    const code = currencyCode || selectedCurrency
    return formatPrice(amount, code, locale)
  }, [selectedCurrency])

  // 환율 가져오기
  const getRate = useCallback((from: string, to?: string): number | null => {
    const targetCurrency = to || selectedCurrency
    return currencyService.getExchangeRate(from, targetCurrency)
  }, [selectedCurrency])

  // 선택된 통화 변경
  const changeCurrency = useCallback((currencyCode: string) => {
    setSelectedCurrency(currencyCode)
  }, [setSelectedCurrency])

  return {
    selectedCurrency,
    currencies,
    lastUpdated,
    isLoading,
    convert,
    format,
    getRate,
    changeCurrency,
    refreshRates,
  }
}

// 환율 계산기 전용 hook
export function useCurrencyCalculator() {
  const [amount, setAmount] = useState<string>('10000')
  const [fromCurrency, setFromCurrency] = useState<string>('KRW')
  const [toCurrency, setToCurrency] = useState<string>('USD')
  const { currencies, convert, format, getRate } = useCurrency()

  const convertedAmount = useCallback(() => {
    const numAmount = parseFloat(amount) || 0
    return convert(numAmount, fromCurrency, toCurrency)
  }, [amount, fromCurrency, toCurrency, convert])

  const formattedResult = useCallback(() => {
    const result = convertedAmount()
    if (result === null) return 'N/A'
    return format(result, toCurrency)
  }, [convertedAmount, format, toCurrency])

  const exchangeRate = useCallback(() => {
    return getRate(fromCurrency, toCurrency)
  }, [fromCurrency, toCurrency, getRate])

  const swapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }, [fromCurrency, toCurrency])

  return {
    amount,
    setAmount,
    fromCurrency,
    setFromCurrency,
    toCurrency,
    setToCurrency,
    convertedAmount: convertedAmount(),
    formattedResult: formattedResult(),
    exchangeRate: exchangeRate(),
    currencies,
    swapCurrencies,
  }
}