'use client'

import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'
import { useCurrencyContext } from '@/contexts/currency-context'
import { useEffect, useState } from 'react'

interface PriceDisplayProps {
  price: number
  originalCurrency?: string
  showOriginal?: boolean
  showRate?: boolean
  className?: string
  originalClassName?: string
}

export function PriceDisplay({
  price,
  originalCurrency = 'KRW',
  showOriginal = false,
  showRate = false,
  className,
  originalClassName,
}: PriceDisplayProps) {
  const { format, convert, getRate } = useCurrency()
  const { selectedCurrency } = useCurrencyContext()
  const [currentCurrency, setCurrentCurrency] = useState(selectedCurrency)
  
  // 통화 변경 이벤트 감지
  useEffect(() => {
    const handleCurrencyChange = (e: CustomEvent) => {
      setCurrentCurrency(e.detail.currency)
    }
    
    window.addEventListener('currencyChanged', handleCurrencyChange as any)
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as any)
    }
  }, [])
  
  useEffect(() => {
    setCurrentCurrency(selectedCurrency)
  }, [selectedCurrency])

  // 선택된 통화와 원래 통화가 같으면 그대로 표시
  if (currentCurrency === originalCurrency) {
    return (
      <span className={className}>
        {format(price, originalCurrency)}
      </span>
    )
  }

  // 변환된 가격
  const convertedPrice = convert(price, originalCurrency)
  if (convertedPrice === null) {
    return <span className={className}>{format(price, originalCurrency)}</span>
  }

  const exchangeRate = getRate(originalCurrency)

  return (
    <div className="inline-flex flex-col gap-0.5">
      <span className={className}>
        {format(convertedPrice, currentCurrency)}
      </span>
      {showOriginal && (
        <span className={cn('text-xs text-muted-foreground', originalClassName)}>
          ({format(price, originalCurrency)})
        </span>
      )}
      {showRate && exchangeRate && (
        <span className="text-xs text-muted-foreground">
          1 {originalCurrency} = {exchangeRate.toFixed(2)} {currentCurrency}
        </span>
      )}
    </div>
  )
}

// 할인율과 함께 가격을 표시하는 컴포넌트
interface DiscountPriceDisplayProps extends PriceDisplayProps {
  originalPrice: number
  discountRate?: number
}

export function DiscountPriceDisplay({
  price,
  originalPrice,
  discountRate,
  originalCurrency = 'KRW',
  showOriginal = false,
  className,
  originalClassName,
}: DiscountPriceDisplayProps) {
  const { format, convert } = useCurrency()
  const { selectedCurrency } = useCurrencyContext()
  const [currentCurrency, setCurrentCurrency] = useState(selectedCurrency)
  
  // 통화 변경 이벤트 감지
  useEffect(() => {
    const handleCurrencyChange = (e: CustomEvent) => {
      setCurrentCurrency(e.detail.currency)
    }
    
    window.addEventListener('currencyChanged', handleCurrencyChange as any)
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as any)
    }
  }, [])
  
  useEffect(() => {
    setCurrentCurrency(selectedCurrency)
  }, [selectedCurrency])

  const convertedPrice = currentCurrency === originalCurrency 
    ? price 
    : convert(price, originalCurrency)
  
  const convertedOriginalPrice = currentCurrency === originalCurrency
    ? originalPrice
    : convert(originalPrice, originalCurrency)

  if (convertedPrice === null || convertedOriginalPrice === null) {
    return <PriceDisplay price={price} originalCurrency={originalCurrency} className={className} />
  }

  const calculatedDiscountRate = discountRate || Math.round((1 - price / originalPrice) * 100)

  return (
    <div className="inline-flex items-center gap-2">
      <span className={cn('font-bold text-red-600', className)}>
        {format(convertedPrice, currentCurrency)}
      </span>
      <span className="text-sm text-muted-foreground line-through">
        {format(convertedOriginalPrice, currentCurrency)}
      </span>
      {calculatedDiscountRate > 0 && (
        <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
          {calculatedDiscountRate}%
        </span>
      )}
      {showOriginal && currentCurrency !== originalCurrency && (
        <span className={cn('text-xs text-muted-foreground', originalClassName)}>
          ({format(price, originalCurrency)})
        </span>
      )}
    </div>
  )
}