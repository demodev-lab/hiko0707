'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { LanguageCode, defaultLanguage, translations } from './config'
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  formatTimeRemaining,
  getCurrencySymbol,
  getLocale
} from './format'

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: string) => string
  formatCurrency: (amount: number, showSymbol?: boolean) => string
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string
  formatRelativeTime: (date: Date | string) => string
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string
  formatPercentage: (value: number, decimals?: number) => string
  formatTimeRemaining: (endDate: Date | string) => string
  getCurrencySymbol: () => string
  getLocale: () => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(defaultLanguage)

  useEffect(() => {
    // 로컬 스토리지에서 언어 설정 가져오기
    const savedLang = localStorage.getItem('language') as LanguageCode
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang)
    }
  }, [])

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language] || translations[defaultLanguage]
    
    for (const k of keys) {
      value = value?.[k]
      if (!value) break
    }
    
    if (typeof value === 'string') {
      return value
    }
    
    // Fallback to default language
    value = translations[defaultLanguage]
    for (const k of keys) {
      value = value?.[k]
      if (!value) break
    }
    
    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t,
      formatCurrency: (amount, showSymbol) => formatCurrency(amount, language, showSymbol),
      formatDate: (date, options) => formatDate(date, language, options),
      formatRelativeTime: (date) => formatRelativeTime(date, language),
      formatNumber: (number, options) => formatNumber(number, language, options),
      formatPercentage: (value, decimals) => formatPercentage(value, language, decimals),
      formatTimeRemaining: (endDate) => formatTimeRemaining(endDate, language),
      getCurrencySymbol: () => getCurrencySymbol(language),
      getLocale: () => getLocale(language),
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}