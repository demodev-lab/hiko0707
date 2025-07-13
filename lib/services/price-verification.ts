/**
 * Price Verification Service
 * 실시간 가격 확인 및 검증 서비스
 */

import { HotDeal } from '@/types/hot-deal'
import { extractProductInfo } from '@/lib/utils/product-extraction'

export interface PriceCheckResult {
  success: boolean
  currentPrice?: number
  originalPrice?: number
  discountRate?: number
  currency?: string
  priceHistory?: PricePoint[]
  lastChecked: Date
  source: string
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown'
  error?: string
}

export interface PricePoint {
  price: number
  timestamp: Date
  source: string
}

export interface PriceTrackingData {
  productUrl: string
  hotdealId: string
  initialPrice: number
  currentPrice: number
  lowestPrice: number
  highestPrice: number
  priceHistory: PricePoint[]
  lastChecked: Date
  priceChangePercent: number
  alerts: PriceAlert[]
}

export interface PriceAlert {
  id: string
  type: 'price_drop' | 'price_increase' | 'back_in_stock' | 'out_of_stock'
  threshold?: number
  triggered: boolean
  createdAt: Date
  triggeredAt?: Date
}

/**
 * 상품 URL에서 실시간 가격 정보를 확인합니다
 */
export async function verifyProductPrice(
  productUrl: string,
  hotdeal: HotDeal
): Promise<PriceCheckResult> {
  const result: PriceCheckResult = {
    success: false,
    lastChecked: new Date(),
    source: hotdeal.seller || 'unknown',
    availability: 'unknown'
  }

  try {
    // 기존 핫딜 정보에서 예상 가격 추출
    const extractedInfo = extractProductInfo(hotdeal)
    const estimatedPrice = extractedInfo.priceInfo.price

    // URL 도메인별 가격 확인 전략
    const domain = extractDomain(productUrl)
    
    // 실제 구현에서는 각 쇼핑몰별 API나 스크래핑 로직을 사용
    // 현재는 시뮬레이션된 가격 확인 로직
    const priceData = await checkPriceByDomain(domain, productUrl, estimatedPrice)
    
    if (priceData) {
      result.success = true
      result.currentPrice = priceData.currentPrice
      result.originalPrice = priceData.originalPrice
      result.discountRate = priceData.discountRate
      result.currency = 'KRW'
      result.availability = priceData.availability
      
      // 가격 변동 감지
      const priceChange = estimatedPrice - priceData.currentPrice
      const changePercent = (priceChange / estimatedPrice) * 100
      
      // 가격 히스토리 추가
      result.priceHistory = [
        {
          price: priceData.currentPrice,
          timestamp: new Date(),
          source: domain
        }
      ]
    } else {
      result.error = '가격 정보를 확인할 수 없습니다'
    }
  } catch (error) {
    console.error('Price verification failed:', error)
    result.error = error instanceof Error ? error.message : '가격 확인 중 오류가 발생했습니다'
  }

  return result
}

/**
 * URL에서 도메인 추출
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

/**
 * 도메인별 가격 확인 로직
 */
async function checkPriceByDomain(
  domain: string,
  url: string,
  estimatedPrice: number
): Promise<{
  currentPrice: number
  originalPrice?: number
  discountRate?: number
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown'
} | null> {
  
  // 시뮬레이션된 가격 확인 (실제 환경에서는 각 쇼핑몰 API 사용)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // 도메인별 처리 로직
  switch (domain) {
    case 'coupang.com':
      return await checkCoupangPrice(url, estimatedPrice)
    case '11st.co.kr':
      return await check11stPrice(url, estimatedPrice)
    case 'gmarket.co.kr':
      return await checkGmarketPrice(url, estimatedPrice)
    case 'auction.co.kr':
      return await checkAuctionPrice(url, estimatedPrice)
    case 'interpark.com':
      return await checkInterparkPrice(url, estimatedPrice)
    default:
      return await checkGenericPrice(url, estimatedPrice)
  }
}

/**
 * 쿠팡 가격 확인 (시뮬레이션)
 */
async function checkCoupangPrice(url: string, estimatedPrice: number) {
  // 실제로는 쿠팡 API나 스크래핑 로직
  const variation = 0.95 + Math.random() * 0.1 // ±5% 변동
  const currentPrice = Math.round(estimatedPrice * variation)
  const originalPrice = Math.round(currentPrice * (1.1 + Math.random() * 0.2))
  
  return {
    currentPrice,
    originalPrice,
    discountRate: Math.round(((originalPrice - currentPrice) / originalPrice) * 100),
    availability: Math.random() > 0.1 ? 'in_stock' as const : 'limited' as const
  }
}

/**
 * 11번가 가격 확인 (시뮬레이션)
 */
async function check11stPrice(url: string, estimatedPrice: number) {
  const variation = 0.92 + Math.random() * 0.16 // ±8% 변동
  const currentPrice = Math.round(estimatedPrice * variation)
  
  return {
    currentPrice,
    availability: Math.random() > 0.05 ? 'in_stock' as const : 'out_of_stock' as const
  }
}

/**
 * G마켓 가격 확인 (시뮬레이션)
 */
async function checkGmarketPrice(url: string, estimatedPrice: number) {
  const variation = 0.94 + Math.random() * 0.12 // ±6% 변동
  const currentPrice = Math.round(estimatedPrice * variation)
  
  return {
    currentPrice,
    availability: 'in_stock' as const
  }
}

/**
 * 옥션 가격 확인 (시뮬레이션)
 */
async function checkAuctionPrice(url: string, estimatedPrice: number) {
  const variation = 0.9 + Math.random() * 0.2 // ±10% 변동
  const currentPrice = Math.round(estimatedPrice * variation)
  
  return {
    currentPrice,
    availability: Math.random() > 0.15 ? 'in_stock' as const : 'limited' as const
  }
}

/**
 * 인터파크 가격 확인 (시뮬레이션)
 */
async function checkInterparkPrice(url: string, estimatedPrice: number) {
  const variation = 0.93 + Math.random() * 0.14 // ±7% 변동
  const currentPrice = Math.round(estimatedPrice * variation)
  
  return {
    currentPrice,
    availability: 'in_stock' as const
  }
}

/**
 * 일반 쇼핑몰 가격 확인 (시뮬레이션)
 */
async function checkGenericPrice(url: string, estimatedPrice: number) {
  const variation = 0.85 + Math.random() * 0.3 // ±15% 변동
  const currentPrice = Math.round(estimatedPrice * variation)
  
  return {
    currentPrice,
    availability: Math.random() > 0.2 ? 'in_stock' as const : 'unknown' as const
  }
}

/**
 * 여러 상품의 가격을 배치로 확인
 */
export async function batchVerifyPrices(
  items: Array<{ hotdeal: HotDeal; productUrl: string }>
): Promise<Map<string, PriceCheckResult>> {
  const results = new Map<string, PriceCheckResult>()
  
  // 동시에 너무 많은 요청을 보내지 않도록 배치 처리
  const batchSize = 5
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchPromises = batch.map(async item => {
      const result = await verifyProductPrice(item.productUrl, item.hotdeal)
      return { hotdealId: item.hotdeal.id, result }
    })
    
    const batchResults = await Promise.allSettled(batchPromises)
    batchResults.forEach(promiseResult => {
      if (promiseResult.status === 'fulfilled') {
        results.set(promiseResult.value.hotdealId, promiseResult.value.result)
      }
    })
    
    // 배치 간 짧은 대기
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return results
}

/**
 * 가격 변동률 계산
 */
export function calculatePriceChange(
  originalPrice: number,
  currentPrice: number
): {
  changeAmount: number
  changePercent: number
  trend: 'increase' | 'decrease' | 'stable'
} {
  const changeAmount = currentPrice - originalPrice
  const changePercent = Math.round((changeAmount / originalPrice) * 100 * 100) / 100
  
  let trend: 'increase' | 'decrease' | 'stable' = 'stable'
  if (Math.abs(changePercent) > 1) {
    trend = changePercent > 0 ? 'increase' : 'decrease'
  }
  
  return {
    changeAmount,
    changePercent,
    trend
  }
}

/**
 * 가격 추적 데이터 업데이트
 */
export function updatePriceTracking(
  existing: PriceTrackingData | null,
  newPrice: number,
  source: string
): PriceTrackingData {
  const now = new Date()
  
  if (!existing) {
    return {
      productUrl: '',
      hotdealId: '',
      initialPrice: newPrice,
      currentPrice: newPrice,
      lowestPrice: newPrice,
      highestPrice: newPrice,
      priceHistory: [{
        price: newPrice,
        timestamp: now,
        source
      }],
      lastChecked: now,
      priceChangePercent: 0,
      alerts: []
    }
  }
  
  const updated = { ...existing }
  updated.currentPrice = newPrice
  updated.lowestPrice = Math.min(updated.lowestPrice, newPrice)
  updated.highestPrice = Math.max(updated.highestPrice, newPrice)
  updated.lastChecked = now
  updated.priceChangePercent = ((newPrice - updated.initialPrice) / updated.initialPrice) * 100
  
  // 가격 히스토리 추가 (최근 100개 항목만 유지)
  updated.priceHistory.push({
    price: newPrice,
    timestamp: now,
    source
  })
  
  if (updated.priceHistory.length > 100) {
    updated.priceHistory = updated.priceHistory.slice(-100)
  }
  
  return updated
}