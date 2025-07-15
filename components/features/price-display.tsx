'use client'

import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'

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
  const { format, formatWithDecimals, convert, getRate, selectedCurrency } = useCurrency()

  // 선택된 통화와 원래 통화가 같으면 그대로 표시
  if (selectedCurrency === originalCurrency) {
    return (
      <span className={className}>
        {format(price, originalCurrency)}
      </span>
    )
  }

  // 변환된 가격
  const convertedPrice = convert(price, originalCurrency, selectedCurrency)
  if (convertedPrice === null) {
    return <span className={className}>{format(price, originalCurrency)}</span>
  }

  const exchangeRate = getRate(originalCurrency, selectedCurrency)

  return (
    <div className="inline-flex flex-col gap-0.5">
      <span className={className}>
        {selectedCurrency === 'KRW' ? format(convertedPrice, selectedCurrency) : formatWithDecimals(convertedPrice, selectedCurrency)}
      </span>
      {showOriginal && (
        <span className={cn('text-xs text-muted-foreground', originalClassName)}>
          ({format(price, originalCurrency)})
        </span>
      )}
      {showRate && exchangeRate && (
        <span className="text-xs text-muted-foreground">
          1 {originalCurrency} = {exchangeRate.toFixed(2)} {selectedCurrency}
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
  const { format, formatWithDecimals, convert, selectedCurrency } = useCurrency()

  const convertedPrice = selectedCurrency === originalCurrency 
    ? price 
    : convert(price, originalCurrency, selectedCurrency)
  
  const convertedOriginalPrice = selectedCurrency === originalCurrency
    ? originalPrice
    : convert(originalPrice, originalCurrency, selectedCurrency)

  if (convertedPrice === null || convertedOriginalPrice === null) {
    return <PriceDisplay price={price} originalCurrency={originalCurrency} className={className} />
  }

  const calculatedDiscountRate = discountRate || Math.round((1 - price / originalPrice) * 100)

  return (
    <div className="inline-flex items-center gap-2">
      <span className={cn('font-bold text-red-600', className)}>
        {selectedCurrency === 'KRW' ? format(convertedPrice, selectedCurrency) : formatWithDecimals(convertedPrice, selectedCurrency)}
      </span>
      <span className="text-sm text-muted-foreground line-through">
        {selectedCurrency === 'KRW' ? format(convertedOriginalPrice, selectedCurrency) : formatWithDecimals(convertedOriginalPrice, selectedCurrency)}
      </span>
      {calculatedDiscountRate > 0 && (
        <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
          {calculatedDiscountRate}%
        </span>
      )}
      {showOriginal && selectedCurrency !== originalCurrency && (
        <span className={cn('text-xs text-muted-foreground', originalClassName)}>
          ({format(price, originalCurrency)})
        </span>
      )}
    </div>
  )
}