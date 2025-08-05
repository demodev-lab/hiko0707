'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { currencyService, Currency, convertPrice, formatPrice } from '@/lib/services/currency-service'
import { supabaseSettingsService } from '@/lib/services/supabase-settings-service'

export interface UseSupabaseCurrencyOptions {
  defaultCurrency?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

const CURRENCY_QUERY_KEY = 'preferred-currency'

export function useSupabaseCurrency(options: UseSupabaseCurrencyOptions = {}) {
  const {
    defaultCurrency = 'KRW',
    autoRefresh = true,
    refreshInterval = 30 * 60 * 1000, // 30분
  } = options

  const { user } = useUser()
  const queryClient = useQueryClient()
  
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 선택된 통화 조회 (React Query + Supabase)
  const { data: selectedCurrency = defaultCurrency } = useQuery({
    queryKey: [CURRENCY_QUERY_KEY, user?.id],
    queryFn: async () => {
      const currency = await supabaseSettingsService.getSetting<string>('preferred-currency', defaultCurrency)
      return currency || defaultCurrency
    },
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 30, // 30분
    enabled: true, // 항상 활성화 (인증/비인증 사용자 모두 지원)
  })

  // 선택된 통화 변경 (React Query Mutation + Supabase)
  const currencyMutation = useMutation({
    mutationFn: async (currencyCode: string) => {
      const success = await supabaseSettingsService.setSetting('preferred-currency', currencyCode)
      if (!success) {
        throw new Error('통화 설정 저장에 실패했습니다')
      }
      return currencyCode
    },
    onSuccess: (currencyCode) => {
      // 캐시 업데이트
      queryClient.setQueryData([CURRENCY_QUERY_KEY, user?.id], currencyCode)
    },
    onError: (error) => {
      console.error('통화 변경 오류:', error)
    },
  })

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

  // 소수점 포함 가격 포맷팅
  const formatWithDecimals = useCallback((amount: number, currencyCode?: string, locale?: string, decimals: number = 2): string => {
    const code = currencyCode || selectedCurrency
    return currencyService.formatCurrencyWithDecimals(amount, code, locale, decimals)
  }, [selectedCurrency])

  // 환율 가져오기
  const getRate = useCallback((from: string, to?: string): number | null => {
    const targetCurrency = to || selectedCurrency
    return currencyService.getExchangeRate(from, targetCurrency)
  }, [selectedCurrency])

  // 선택된 통화 변경
  const changeCurrency = useCallback((currencyCode: string) => {
    currencyMutation.mutate(currencyCode)
  }, [currencyMutation])

  return {
    selectedCurrency,
    currencies,
    lastUpdated,
    isLoading: isLoading || currencyMutation.isPending,
    convert,
    format,
    formatWithDecimals,
    getRate,
    changeCurrency,
    refreshRates,
    // 추가 상태 정보
    isCurrencyChanging: currencyMutation.isPending,
    currencyChangeError: currencyMutation.error,
  }
}

// 환율 계산기 전용 hook (Supabase 버전)
export function useSupabaseCurrencyCalculator() {
  const [amount, setAmount] = useState<string>('10000')
  const [fromCurrency, setFromCurrency] = useState<string>('KRW')
  const [toCurrency, setToCurrency] = useState<string>('USD')
  const { currencies, convert, format, getRate } = useSupabaseCurrency()

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