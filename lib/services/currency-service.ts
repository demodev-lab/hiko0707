export interface Currency {
  code: string
  symbol: string
  name: string
  country: string
  flag: string
}

export interface ExchangeRate {
  from: string
  to: string
  rate: number
  lastUpdated: Date
}

// 지원하는 통화 목록
export const currencies: Currency[] = [
  { code: 'KRW', symbol: '₩', name: '대한민국 원', country: 'Korea', flag: '🇰🇷' },
  { code: 'USD', symbol: '$', name: '미국 달러', country: 'USA', flag: '🇺🇸' },
  { code: 'CNY', symbol: '¥', name: '중국 위안', country: 'China', flag: '🇨🇳' },
  { code: 'JPY', symbol: '¥', name: '일본 엔', country: 'Japan', flag: '🇯🇵' },
  { code: 'VND', symbol: '₫', name: '베트남 동', country: 'Vietnam', flag: '🇻🇳' },
  { code: 'THB', symbol: '฿', name: '태국 바트', country: 'Thailand', flag: '🇹🇭' },
  { code: 'MNT', symbol: '₮', name: '몽골 투그릭', country: 'Mongolia', flag: '🇲🇳' },
  { code: 'RUB', symbol: '₽', name: '러시아 루블', country: 'Russia', flag: '🇷🇺' },
  { code: 'EUR', symbol: '€', name: '유로', country: 'Europe', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: '영국 파운드', country: 'UK', flag: '🇬🇧' },
]

// 모의 환율 데이터 (실제로는 API 호출)
const mockExchangeRates: Record<string, number> = {
  'USD': 1333.50,    // 1 USD = 1333.50 KRW
  'CNY': 184.87,     // 1 CNY = 184.87 KRW
  'JPY': 8.84,       // 1 JPY = 8.84 KRW
  'VND': 0.053,      // 1 VND = 0.053 KRW
  'THB': 37.25,      // 1 THB = 37.25 KRW
  'MNT': 0.39,       // 1 MNT = 0.39 KRW
  'RUB': 13.45,      // 1 RUB = 13.45 KRW
  'EUR': 1435.23,    // 1 EUR = 1435.23 KRW
  'GBP': 1683.45,    // 1 GBP = 1683.45 KRW
}

class CurrencyService {
  private static instance: CurrencyService
  private exchangeRates: Map<string, ExchangeRate> = new Map()
  private lastFetchTime: Date | null = null
  private fetchInterval = 30 * 60 * 1000 // 30분

  private constructor() {
    // 초기 환율 데이터 로드
    this.loadExchangeRates()
  }

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService()
    }
    return CurrencyService.instance
  }

  private async loadExchangeRates() {
    // 실제로는 API 호출, 지금은 모의 데이터 사용
    const now = new Date()
    
    Object.entries(mockExchangeRates).forEach(([currency, rate]) => {
      const key = `${currency}_KRW`
      this.exchangeRates.set(key, {
        from: currency,
        to: 'KRW',
        rate,
        lastUpdated: now,
      })
      
      // 역방향 환율도 저장
      const reverseKey = `KRW_${currency}`
      this.exchangeRates.set(reverseKey, {
        from: 'KRW',
        to: currency,
        rate: 1 / rate,
        lastUpdated: now,
      })
    })
    
    this.lastFetchTime = now
  }

  async refreshRates(): Promise<void> {
    const now = new Date()
    if (!this.lastFetchTime || now.getTime() - this.lastFetchTime.getTime() > this.fetchInterval) {
      await this.loadExchangeRates()
    }
  }

  getExchangeRate(from: string, to: string): number | null {
    if (from === to) return 1

    const key = `${from}_${to}`
    const rate = this.exchangeRates.get(key)
    
    if (rate) {
      return rate.rate
    }

    // 간접 환율 계산 (KRW를 거쳐서)
    const fromToKRW = this.exchangeRates.get(`${from}_KRW`)
    const krwToTo = this.exchangeRates.get(`KRW_${to}`)
    
    if (fromToKRW && krwToTo) {
      return fromToKRW.rate * krwToTo.rate
    }

    return null
  }

  convertCurrency(amount: number, from: string, to: string): number | null {
    const rate = this.getExchangeRate(from, to)
    if (rate === null) return null
    return amount * rate
  }

  formatCurrency(amount: number, currencyCode: string, locale?: string): string {
    const currency = currencies.find(c => c.code === currencyCode)
    if (!currency) return `${amount} ${currencyCode}`

    try {
      // Intl.NumberFormat을 사용하여 각 통화에 맞는 형식으로 포맷
      return new Intl.NumberFormat(locale || 'ko-KR', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    } catch {
      // 지원하지 않는 통화의 경우 기본 포맷 사용 (콤마 포맷팅 적용)
      return `${currency.symbol}${amount.toLocaleString('ko-KR')}`
    }
  }

  formatCurrencyWithDecimals(amount: number, currencyCode: string, locale?: string, decimals: number = 2): string {
    const currency = currencies.find(c => c.code === currencyCode)
    if (!currency) return `${amount.toFixed(decimals)} ${currencyCode}`

    try {
      // Intl.NumberFormat을 사용하여 각 통화에 맞는 형식으로 포맷 (소수점 포함)
      return new Intl.NumberFormat(locale || 'ko-KR', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount)
    } catch {
      // 지원하지 않는 통화의 경우 기본 포맷 사용
      return `${currency.symbol}${amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    }
  }

  getCurrencyByCode(code: string): Currency | undefined {
    return currencies.find(c => c.code === code)
  }

  getAllCurrencies(): Currency[] {
    return currencies
  }

  getLastUpdateTime(): Date | null {
    return this.lastFetchTime
  }
}

export const currencyService = CurrencyService.getInstance()

// 유틸리티 함수들
export const convertPrice = (price: number, from: string, to: string): number | null => {
  return currencyService.convertCurrency(price, from, to)
}

export const formatPrice = (price: number, currencyCode: string, locale?: string): string => {
  return currencyService.formatCurrency(price, currencyCode, locale)
}

export const getExchangeRate = (from: string, to: string): number | null => {
  return currencyService.getExchangeRate(from, to)
}