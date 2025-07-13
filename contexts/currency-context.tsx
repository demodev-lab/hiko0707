'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { currencyService } from '@/lib/services/currency-service'
import { useLocalStorage } from '@/hooks/use-local-storage'

interface CurrencyContextType {
  selectedCurrency: string
  changeCurrency: (currency: string) => void
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useLocalStorage<string>('preferred-currency', 'KRW')

  const changeCurrency = (currency: string) => {
    setSelectedCurrency(currency)
    // 전역 이벤트 발생시켜 모든 컴포넌트가 업데이트되도록 함
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency } }))
  }

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, changeCurrency }}>
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