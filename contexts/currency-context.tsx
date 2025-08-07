'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useCurrency } from '@/hooks/use-currency'
import { Currency } from '@/lib/services/currency-service'

interface CurrencyContextType {
  selectedCurrency: string
  currencies: Currency[]
  lastUpdated: Date | null
  isLoading: boolean
  convert: (amount: number, from: string, to?: string) => number | null
  format: (amount: number, currencyCode?: string, locale?: string) => string
  formatWithDecimals: (amount: number, currencyCode?: string, locale?: string, decimals?: number) => string
  getRate: (from: string, to?: string) => number | null
  changeCurrency: (currencyCode: string) => void
  refreshRates: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currencyHook = useCurrency({
    defaultCurrency: 'KRW',
    autoRefresh: true,
    refreshInterval: 30 * 60 * 1000 // 30분
  })

  const contextValue: CurrencyContextType = {
    ...currencyHook,
    // 전역 이벤트 발생을 포함한 changeCurrency 래퍼
    changeCurrency: (currencyCode: string) => {
      currencyHook.changeCurrency(currencyCode)
      // 전역 이벤트 발생시켜 모든 컴포넌트가 업데이트되도록 함
      window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: currencyCode } }))
    }
  }

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrencyContext() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider')
  }
  return context
}