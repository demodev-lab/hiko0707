/**
 * Purchase Analytics Service
 * 구매 패턴 분석 서비스
 */

import { BuyForMeRequest } from '@/types/buy-for-me'
import { HotDeal } from '@/types/hotdeal'
import { User } from '@/types/user'

export interface PurchasePattern {
  id: string
  userId: string
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  patterns: {
    frequentCategories: CategoryFrequency[]
    priceRanges: PriceRangeFrequency[]
    shoppingSites: SiteFrequency[]
    purchaseTiming: TimingPattern[]
    seasonalTrends: SeasonalTrend[]
  }
  insights: PurchaseInsight[]
  recommendations: RecommendationRule[]
  lastUpdated: Date
  createdAt: Date
}

export interface CategoryFrequency {
  category: string
  frequency: number
  totalAmount: number
  averageAmount: number
  lastPurchase: Date
  growth: number // 이전 기간 대비 증감률
}

export interface PriceRangeFrequency {
  range: string // "0-50000", "50000-100000", etc.
  minPrice: number
  maxPrice: number
  frequency: number
  percentage: number
}

export interface SiteFrequency {
  site: string
  frequency: number
  totalAmount: number
  averageOrderValue: number
  satisfactionScore: number
  lastPurchase: Date
}

export interface TimingPattern {
  type: 'hourly' | 'daily' | 'monthly'
  period: string // "0-6", "Monday", "January", etc.
  frequency: number
  percentage: number
  averageAmount: number
}

export interface SeasonalTrend {
  season: 'spring' | 'summer' | 'fall' | 'winter'
  totalOrders: number
  totalAmount: number
  popularCategories: string[]
  averageOrderValue: number
  yearOverYearGrowth: number
}

export interface PurchaseInsight {
  id: string
  type: 'spending_trend' | 'category_shift' | 'timing_pattern' | 'price_sensitivity' | 'site_preference'
  title: string
  description: string
  confidence: number // 0-100
  importance: 'low' | 'medium' | 'high' | 'critical'
  data: any
  actionable: boolean
  generatedAt: Date
}

export interface RecommendationRule {
  id: string
  name: string
  description: string
  conditions: {
    categories: string[]
    priceRange: { min: number, max: number }
    timing: string[]
    userSegment: string[]
  }
  recommendations: {
    suggestCategories: string[]
    suggestPriceRange: { min: number, max: number }
    suggestTiming: string[]
    customMessage: string
  }
  priority: number
  enabled: boolean
}

export interface UserSegment {
  id: string
  name: string
  description: string
  criteria: {
    totalSpending: { min: number, max: number }
    orderFrequency: { min: number, max: number }
    averageOrderValue: { min: number, max: number }
    preferredCategories: string[]
    loyaltyScore: { min: number, max: number }
  }
  characteristics: string[]
  size: number
  trends: {
    growth: number
    retention: number
    churn: number
  }
}

export interface AnalyticsMetrics {
  overview: {
    totalUsers: number
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    conversionRate: number
    customerLifetimeValue: number
  }
  trends: {
    daily: MetricTrend[]
    weekly: MetricTrend[]
    monthly: MetricTrend[]
  }
  segments: UserSegment[]
  topPerformers: {
    categories: CategoryFrequency[]
    sites: SiteFrequency[]
    products: ProductPerformance[]
  }
}

export interface MetricTrend {
  period: string
  orders: number
  revenue: number
  users: number
  averageOrderValue: number
  conversionRate: number
}

export interface ProductPerformance {
  productId: string
  title: string
  category: string
  site: string
  totalOrders: number
  totalRevenue: number
  averagePrice: number
  conversionRate: number
  customerSatisfaction: number
  lastOrderDate: Date
}

/**
 * 구매 패턴 분석 서비스
 */
export class PurchaseAnalyticsService {
  private userPatterns: Map<string, PurchasePattern> = new Map()
  private userSegments: UserSegment[] = []
  private recommendationRules: RecommendationRule[] = []
  private analyticsMetrics: AnalyticsMetrics | null = null

  constructor() {
    this.initializeDefaultSegments()
    this.initializeDefaultRules()
    this.startPeriodicAnalysis()
  }

  /**
   * 사용자 구매 패턴 분석
   */
  async analyzeUserPurchases(
    userId: string,
    purchases: BuyForMeRequest[],
    timeframe: PurchasePattern['timeframe'] = 'monthly'
  ): Promise<PurchasePattern> {
    const now = new Date()
    const startDate = this.getTimeframeStartDate(timeframe)
    
    // 기간 내 구매 데이터 필터링
    const filteredPurchases = purchases.filter(purchase => 
      new Date(purchase.createdAt) >= startDate
    )

    const pattern: PurchasePattern = {
      id: this.generatePatternId(userId, timeframe),
      userId,
      timeframe,
      patterns: {
        frequentCategories: this.analyzeCategories(filteredPurchases),
        priceRanges: this.analyzePriceRanges(filteredPurchases),
        shoppingSites: this.analyzeShoppingSites(filteredPurchases),
        purchaseTiming: this.analyzePurchaseTiming(filteredPurchases),
        seasonalTrends: this.analyzeSeasonalTrends(filteredPurchases)
      },
      insights: await this.generateInsights(userId, filteredPurchases),
      recommendations: this.generateRecommendations(userId, filteredPurchases),
      lastUpdated: now,
      createdAt: this.userPatterns.get(`${userId}-${timeframe}`)?.createdAt || now
    }

    this.userPatterns.set(`${userId}-${timeframe}`, pattern)
    await this.savePatternToStorage(pattern)

    return pattern
  }

  /**
   * 카테고리 분석
   */
  private analyzeCategories(purchases: BuyForMeRequest[]): CategoryFrequency[] {
    const categoryMap = new Map<string, {
      count: number
      totalAmount: number
      lastPurchase: Date
    }>()

    purchases.forEach(purchase => {
      const category = this.extractCategory(purchase)
      const amount = purchase.productInfo.discountedPrice * purchase.quantity
      const existing = categoryMap.get(category)

      if (existing) {
        existing.count++
        existing.totalAmount += amount
        if (new Date(purchase.createdAt) > existing.lastPurchase) {
          existing.lastPurchase = new Date(purchase.createdAt)
        }
      } else {
        categoryMap.set(category, {
          count: 1,
          totalAmount: amount,
          lastPurchase: new Date(purchase.createdAt)
        })
      }
    })

    const categories: CategoryFrequency[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      frequency: data.count,
      totalAmount: data.totalAmount,
      averageAmount: data.totalAmount / data.count,
      lastPurchase: data.lastPurchase,
      growth: this.calculateCategoryGrowth(category, purchases) // 이전 기간과 비교
    }))

    return categories.sort((a, b) => b.frequency - a.frequency)
  }

  /**
   * 가격 범위 분석
   */
  private analyzePriceRanges(purchases: BuyForMeRequest[]): PriceRangeFrequency[] {
    const ranges = [
      { range: '0-50000', min: 0, max: 50000 },
      { range: '50000-100000', min: 50000, max: 100000 },
      { range: '100000-300000', min: 100000, max: 300000 },
      { range: '300000-500000', min: 300000, max: 500000 },
      { range: '500000+', min: 500000, max: Infinity }
    ]

    const rangeCounts = ranges.map(range => {
      const count = purchases.filter(purchase => {
        const totalPrice = purchase.productInfo.discountedPrice * purchase.quantity
        return totalPrice >= range.min && totalPrice < range.max
      }).length

      return {
        ...range,
        frequency: count,
        percentage: purchases.length > 0 ? (count / purchases.length) * 100 : 0
      }
    })

    return rangeCounts
  }

  /**
   * 쇼핑 사이트 분석
   */
  private analyzeShoppingSites(purchases: BuyForMeRequest[]): SiteFrequency[] {
    const siteMap = new Map<string, {
      count: number
      totalAmount: number
      lastPurchase: Date
      orders: BuyForMeRequest[]
    }>()

    purchases.forEach(purchase => {
      const site = purchase.productInfo.siteName
      const amount = purchase.productInfo.discountedPrice * purchase.quantity
      const existing = siteMap.get(site)

      if (existing) {
        existing.count++
        existing.totalAmount += amount
        existing.orders.push(purchase)
        if (new Date(purchase.createdAt) > existing.lastPurchase) {
          existing.lastPurchase = new Date(purchase.createdAt)
        }
      } else {
        siteMap.set(site, {
          count: 1,
          totalAmount: amount,
          lastPurchase: new Date(purchase.createdAt),
          orders: [purchase]
        })
      }
    })

    const sites: SiteFrequency[] = Array.from(siteMap.entries()).map(([site, data]) => ({
      site,
      frequency: data.count,
      totalAmount: data.totalAmount,
      averageOrderValue: data.totalAmount / data.count,
      satisfactionScore: this.calculateSiteSatisfaction(data.orders),
      lastPurchase: data.lastPurchase
    }))

    return sites.sort((a, b) => b.frequency - a.frequency)
  }

  /**
   * 구매 타이밍 분석
   */
  private analyzePurchaseTiming(purchases: BuyForMeRequest[]): TimingPattern[] {
    const patterns: TimingPattern[] = []

    // 시간대별 분석
    const hourlyData = this.analyzeHourlyPattern(purchases)
    patterns.push(...hourlyData)

    // 요일별 분석
    const dailyData = this.analyzeDailyPattern(purchases)
    patterns.push(...dailyData)

    // 월별 분석
    const monthlyData = this.analyzeMonthlyPattern(purchases)
    patterns.push(...monthlyData)

    return patterns
  }

  /**
   * 계절별 트렌드 분석
   */
  private analyzeSeasonalTrends(purchases: BuyForMeRequest[]): SeasonalTrend[] {
    const seasons = ['spring', 'summer', 'fall', 'winter'] as const
    
    return seasons.map(season => {
      const seasonPurchases = purchases.filter(purchase => {
        const month = new Date(purchase.createdAt).getMonth()
        return this.getSeasonFromMonth(month) === season
      })

      const totalAmount = seasonPurchases.reduce((sum, purchase) => 
        sum + (purchase.productInfo.discountedPrice * purchase.quantity), 0
      )

      const categories = this.analyzeCategories(seasonPurchases)

      return {
        season,
        totalOrders: seasonPurchases.length,
        totalAmount,
        popularCategories: categories.slice(0, 3).map(cat => cat.category),
        averageOrderValue: seasonPurchases.length > 0 ? totalAmount / seasonPurchases.length : 0,
        yearOverYearGrowth: this.calculateSeasonalGrowth(season, purchases)
      }
    })
  }

  /**
   * 인사이트 생성
   */
  private async generateInsights(userId: string, purchases: BuyForMeRequest[]): Promise<PurchaseInsight[]> {
    const insights: PurchaseInsight[] = []

    // 지출 트렌드 분석
    const spendingTrend = this.analyzeSpendingTrend(purchases)
    if (spendingTrend) {
      insights.push(spendingTrend)
    }

    // 카테고리 변화 분석
    const categoryShift = this.analyzeCategoryShift(purchases)
    if (categoryShift) {
      insights.push(categoryShift)
    }

    // 가격 민감도 분석
    const priceSensitivity = this.analyzePriceSensitivity(purchases)
    if (priceSensitivity) {
      insights.push(priceSensitivity)
    }

    // 구매 패턴 변화
    const timingPattern = this.analyzeTimingChanges(purchases)
    if (timingPattern) {
      insights.push(timingPattern)
    }

    return insights
  }

  /**
   * 추천 규칙 생성
   */
  private generateRecommendations(userId: string, purchases: BuyForMeRequest[]): RecommendationRule[] {
    const userSegment = this.getUserSegment(userId, purchases)
    
    return this.recommendationRules.filter(rule => 
      rule.enabled && this.matchesSegment(userSegment, rule.conditions.userSegment)
    )
  }

  /**
   * 전체 분석 메트릭 계산
   */
  async calculateAnalyticsMetrics(
    allPurchases: BuyForMeRequest[],
    allUsers: User[]
  ): Promise<AnalyticsMetrics> {
    const totalRevenue = allPurchases.reduce((sum, purchase) => 
      sum + (purchase.productInfo.discountedPrice * purchase.quantity), 0
    )

    const overview = {
      totalUsers: allUsers.length,
      totalOrders: allPurchases.length,
      totalRevenue,
      averageOrderValue: allPurchases.length > 0 ? totalRevenue / allPurchases.length : 0,
      conversionRate: this.calculateConversionRate(allPurchases, allUsers),
      customerLifetimeValue: this.calculateCLV(allPurchases, allUsers)
    }

    const trends = {
      daily: this.calculateDailyTrends(allPurchases),
      weekly: this.calculateWeeklyTrends(allPurchases),
      monthly: this.calculateMonthlyTrends(allPurchases)
    }

    const segments = await this.updateUserSegments(allPurchases, allUsers)

    const topPerformers = {
      categories: this.analyzeCategories(allPurchases).slice(0, 10),
      sites: this.analyzeShoppingSites(allPurchases).slice(0, 10),
      products: this.analyzeTopProducts(allPurchases).slice(0, 20)
    }

    this.analyticsMetrics = {
      overview,
      trends,
      segments,
      topPerformers
    }

    await this.saveMetricsToStorage(this.analyticsMetrics)
    return this.analyticsMetrics
  }

  /**
   * 유틸리티 메서드들
   */
  private getTimeframeStartDate(timeframe: PurchasePattern['timeframe']): Date {
    const now = new Date()
    const startDate = new Date(now)

    switch (timeframe) {
      case 'daily':
        startDate.setDate(now.getDate() - 1)
        break
      case 'weekly':
        startDate.setDate(now.getDate() - 7)
        break
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    return startDate
  }

  private extractCategory(purchase: BuyForMeRequest): string {
    // 실제 구현에서는 상품 제목이나 URL에서 카테고리 추출
    // 현재는 사이트명을 기반으로 모의 카테고리 생성
    const title = purchase.productInfo.title.toLowerCase()
    
    if (title.includes('전자') || title.includes('핸드폰') || title.includes('컴퓨터')) {
      return 'electronics'
    } else if (title.includes('의류') || title.includes('패션') || title.includes('옷')) {
      return 'fashion'
    } else if (title.includes('뷰티') || title.includes('화장품') || title.includes('미용')) {
      return 'beauty'
    } else if (title.includes('식품') || title.includes('음식') || title.includes('건강')) {
      return 'food'
    } else if (title.includes('가구') || title.includes('홈') || title.includes('인테리어')) {
      return 'home'
    } else {
      return 'other'
    }
  }

  private calculateCategoryGrowth(category: string, purchases: BuyForMeRequest[]): number {
    // 이전 기간과 비교하여 성장률 계산 (모의 데이터)
    return Math.random() * 40 - 20 // -20% ~ +20%
  }

  private calculateSiteSatisfaction(orders: BuyForMeRequest[]): number {
    // 완료된 주문 비율을 기반으로 만족도 계산 (모의 데이터)
    const completedOrders = orders.filter(order => order.status === 'completed').length
    return orders.length > 0 ? (completedOrders / orders.length) * 100 : 0
  }

  private analyzeHourlyPattern(purchases: BuyForMeRequest[]): TimingPattern[] {
    const hourlyBuckets = Array(24).fill(0)
    const hourlyAmounts = Array(24).fill(0)

    purchases.forEach(purchase => {
      const hour = new Date(purchase.createdAt).getHours()
      const amount = purchase.productInfo.discountedPrice * purchase.quantity
      hourlyBuckets[hour]++
      hourlyAmounts[hour] += amount
    })

    return hourlyBuckets.map((count, hour) => ({
      type: 'hourly' as const,
      period: `${hour}-${hour + 1}`,
      frequency: count,
      percentage: purchases.length > 0 ? (count / purchases.length) * 100 : 0,
      averageAmount: count > 0 ? hourlyAmounts[hour] / count : 0
    })).filter(pattern => pattern.frequency > 0)
  }

  private analyzeDailyPattern(purchases: BuyForMeRequest[]): TimingPattern[] {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dailyBuckets = Array(7).fill(0)
    const dailyAmounts = Array(7).fill(0)

    purchases.forEach(purchase => {
      const day = new Date(purchase.createdAt).getDay()
      const amount = purchase.productInfo.discountedPrice * purchase.quantity
      dailyBuckets[day]++
      dailyAmounts[day] += amount
    })

    return dailyBuckets.map((count, day) => ({
      type: 'daily' as const,
      period: dayNames[day],
      frequency: count,
      percentage: purchases.length > 0 ? (count / purchases.length) * 100 : 0,
      averageAmount: count > 0 ? dailyAmounts[day] / count : 0
    })).filter(pattern => pattern.frequency > 0)
  }

  private analyzeMonthlyPattern(purchases: BuyForMeRequest[]): TimingPattern[] {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthlyBuckets = Array(12).fill(0)
    const monthlyAmounts = Array(12).fill(0)

    purchases.forEach(purchase => {
      const month = new Date(purchase.createdAt).getMonth()
      const amount = purchase.productInfo.discountedPrice * purchase.quantity
      monthlyBuckets[month]++
      monthlyAmounts[month] += amount
    })

    return monthlyBuckets.map((count, month) => ({
      type: 'monthly' as const,
      period: monthNames[month],
      frequency: count,
      percentage: purchases.length > 0 ? (count / purchases.length) * 100 : 0,
      averageAmount: count > 0 ? monthlyAmounts[month] / count : 0
    })).filter(pattern => pattern.frequency > 0)
  }

  private getSeasonFromMonth(month: number): 'spring' | 'summer' | 'fall' | 'winter' {
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }

  private calculateSeasonalGrowth(season: string, purchases: BuyForMeRequest[]): number {
    // 전년 동기 대비 성장률 계산 (모의 데이터)
    return Math.random() * 60 - 30 // -30% ~ +30%
  }

  private analyzeSpendingTrend(purchases: BuyForMeRequest[]): PurchaseInsight | null {
    if (purchases.length < 2) return null

    const recentSpending = purchases.slice(0, Math.floor(purchases.length / 2))
      .reduce((sum, p) => sum + (p.productInfo.discountedPrice * p.quantity), 0)
    
    const olderSpending = purchases.slice(Math.floor(purchases.length / 2))
      .reduce((sum, p) => sum + (p.productInfo.discountedPrice * p.quantity), 0)

    const trend = ((recentSpending - olderSpending) / olderSpending) * 100

    return {
      id: `insight-spending-${Date.now()}`,
      type: 'spending_trend',
      title: trend > 0 ? '지출 증가 추세' : '지출 감소 추세',
      description: `최근 구매 패턴을 분석한 결과, 이전 기간 대비 ${Math.abs(trend).toFixed(1)}% ${trend > 0 ? '증가' : '감소'}했습니다.`,
      confidence: 85,
      importance: Math.abs(trend) > 30 ? 'high' : 'medium',
      data: { trend, recentSpending, olderSpending },
      actionable: true,
      generatedAt: new Date()
    }
  }

  private analyzeCategoryShift(purchases: BuyForMeRequest[]): PurchaseInsight | null {
    // 카테고리 변화 분석 로직 (간소화)
    const categories = this.analyzeCategories(purchases)
    if (categories.length < 2) return null

    const topCategory = categories[0]
    
    return {
      id: `insight-category-${Date.now()}`,
      type: 'category_shift',
      title: `${topCategory.category} 카테고리 선호도 증가`,
      description: `최근 ${topCategory.category} 카테고리에서 ${topCategory.frequency}회 구매하여 주요 관심 분야로 나타났습니다.`,
      confidence: 75,
      importance: 'medium',
      data: { topCategory },
      actionable: true,
      generatedAt: new Date()
    }
  }

  private analyzePriceSensitivity(purchases: BuyForMeRequest[]): PurchaseInsight | null {
    const averagePrice = purchases.reduce((sum, p) => 
      sum + (p.productInfo.discountedPrice * p.quantity), 0
    ) / purchases.length

    const priceVariance = purchases.reduce((sum, p) => {
      const price = p.productInfo.discountedPrice * p.quantity
      return sum + Math.pow(price - averagePrice, 2)
    }, 0) / purchases.length

    const sensitivity = priceVariance / (averagePrice * averagePrice)

    return {
      id: `insight-price-${Date.now()}`,
      type: 'price_sensitivity',
      title: sensitivity > 0.5 ? '가격 민감도 높음' : '가격 민감도 낮음',
      description: `구매 가격 분포를 분석한 결과, ${sensitivity > 0.5 ? '다양한 가격대' : '일정한 가격대'}의 상품을 선호하는 것으로 나타났습니다.`,
      confidence: 70,
      importance: 'medium',
      data: { averagePrice, sensitivity },
      actionable: true,
      generatedAt: new Date()
    }
  }

  private analyzeTimingChanges(purchases: BuyForMeRequest[]): PurchaseInsight | null {
    const timingPatterns = this.analyzePurchaseTiming(purchases)
    const hourlyPatterns = timingPatterns.filter(p => p.type === 'hourly')
    
    if (hourlyPatterns.length === 0) return null

    const peakHour = hourlyPatterns.reduce((max, current) => 
      current.frequency > max.frequency ? current : max
    )

    return {
      id: `insight-timing-${Date.now()}`,
      type: 'timing_pattern',
      title: `주요 구매 시간대: ${peakHour.period}시`,
      description: `분석 결과 ${peakHour.period}시에 가장 활발한 구매 활동을 보이며, 전체 구매의 ${peakHour.percentage.toFixed(1)}%를 차지합니다.`,
      confidence: 80,
      importance: 'medium',
      data: { peakHour },
      actionable: true,
      generatedAt: new Date()
    }
  }

  private getUserSegment(userId: string, purchases: BuyForMeRequest[]): string {
    const totalSpending = purchases.reduce((sum, p) => 
      sum + (p.productInfo.discountedPrice * p.quantity), 0
    )
    const orderCount = purchases.length
    const averageOrderValue = orderCount > 0 ? totalSpending / orderCount : 0

    if (totalSpending > 1000000 && orderCount > 10) return 'premium'
    if (totalSpending > 500000 || orderCount > 5) return 'regular'
    if (orderCount > 0) return 'casual'
    return 'new'
  }

  private matchesSegment(userSegment: string, targetSegments: string[]): boolean {
    return targetSegments.length === 0 || targetSegments.includes(userSegment)
  }

  private calculateConversionRate(purchases: BuyForMeRequest[], users: User[]): number {
    // 간소화된 전환율 계산
    const activeUsers = users.filter(user => user.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    return activeUsers.length > 0 ? (purchases.length / activeUsers.length) * 100 : 0
  }

  private calculateCLV(purchases: BuyForMeRequest[], users: User[]): number {
    // 고객 생애 가치 계산 (간소화)
    const totalRevenue = purchases.reduce((sum, p) => 
      sum + (p.productInfo.discountedPrice * p.quantity), 0
    )
    return users.length > 0 ? totalRevenue / users.length : 0
  }

  private calculateDailyTrends(purchases: BuyForMeRequest[]): MetricTrend[] {
    // 최근 30일 일별 트렌드
    const trends: MetricTrend[] = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayPurchases = purchases.filter(p => {
        const purchaseDate = new Date(p.createdAt)
        return purchaseDate.toDateString() === date.toDateString()
      })

      const revenue = dayPurchases.reduce((sum, p) => 
        sum + (p.productInfo.discountedPrice * p.quantity), 0
      )

      trends.push({
        period: date.toISOString().split('T')[0],
        orders: dayPurchases.length,
        revenue,
        users: new Set(dayPurchases.map(p => p.userId)).size,
        averageOrderValue: dayPurchases.length > 0 ? revenue / dayPurchases.length : 0,
        conversionRate: 0 // 간소화
      })
    }

    return trends
  }

  private calculateWeeklyTrends(purchases: BuyForMeRequest[]): MetricTrend[] {
    // 최근 12주 주별 트렌드 (간소화)
    return []
  }

  private calculateMonthlyTrends(purchases: BuyForMeRequest[]): MetricTrend[] {
    // 최근 12개월 월별 트렌드 (간소화)
    return []
  }

  private async updateUserSegments(purchases: BuyForMeRequest[], users: User[]): Promise<UserSegment[]> {
    // 사용자 세그먼트 업데이트 (현재 초기화된 세그먼트 반환)
    return this.userSegments
  }

  private analyzeTopProducts(purchases: BuyForMeRequest[]): ProductPerformance[] {
    const productMap = new Map<string, {
      orders: BuyForMeRequest[]
      totalRevenue: number
    }>()

    purchases.forEach(purchase => {
      const productId = `${purchase.productInfo.siteName}-${purchase.productInfo.title}`
      const revenue = purchase.productInfo.discountedPrice * purchase.quantity
      
      if (productMap.has(productId)) {
        const existing = productMap.get(productId)!
        existing.orders.push(purchase)
        existing.totalRevenue += revenue
      } else {
        productMap.set(productId, {
          orders: [purchase],
          totalRevenue: revenue
        })
      }
    })

    return Array.from(productMap.entries()).map(([productId, data]) => {
      const firstOrder = data.orders[0]
      const lastOrder = data.orders[data.orders.length - 1]
      
      return {
        productId,
        title: firstOrder.productInfo.title,
        category: this.extractCategory(firstOrder),
        site: firstOrder.productInfo.siteName,
        totalOrders: data.orders.length,
        totalRevenue: data.totalRevenue,
        averagePrice: data.totalRevenue / data.orders.length,
        conversionRate: 0, // 간소화
        customerSatisfaction: 85, // 모의 데이터
        lastOrderDate: new Date(lastOrder.createdAt)
      }
    }).sort((a, b) => b.totalRevenue - a.totalRevenue)
  }

  /**
   * 기본 세그먼트 초기화
   */
  private initializeDefaultSegments(): void {
    this.userSegments = [
      {
        id: 'segment-premium',
        name: '프리미엄 고객',
        description: '높은 구매력과 빈도를 보이는 VIP 고객',
        criteria: {
          totalSpending: { min: 1000000, max: Infinity },
          orderFrequency: { min: 10, max: Infinity },
          averageOrderValue: { min: 100000, max: Infinity },
          preferredCategories: [],
          loyaltyScore: { min: 80, max: 100 }
        },
        characteristics: ['높은 구매력', '자주 구매', '브랜드 충성도 높음'],
        size: 0,
        trends: { growth: 15, retention: 95, churn: 5 }
      },
      {
        id: 'segment-regular',
        name: '일반 고객',
        description: '꾸준한 구매 패턴을 보이는 주요 고객층',
        criteria: {
          totalSpending: { min: 200000, max: 1000000 },
          orderFrequency: { min: 3, max: 10 },
          averageOrderValue: { min: 50000, max: 100000 },
          preferredCategories: [],
          loyaltyScore: { min: 50, max: 80 }
        },
        characteristics: ['안정적인 구매', '가격 민감', '추천에 반응'],
        size: 0,
        trends: { growth: 8, retention: 75, churn: 25 }
      },
      {
        id: 'segment-casual',
        name: '라이트 고객',
        description: '가끔 구매하는 캐주얼 고객',
        criteria: {
          totalSpending: { min: 50000, max: 200000 },
          orderFrequency: { min: 1, max: 3 },
          averageOrderValue: { min: 20000, max: 50000 },
          preferredCategories: [],
          loyaltyScore: { min: 20, max: 50 }
        },
        characteristics: ['가격 중심', '기회 구매', '프로모션 민감'],
        size: 0,
        trends: { growth: 12, retention: 45, churn: 55 }
      }
    ]
  }

  /**
   * 기본 추천 규칙 초기화
   */
  private initializeDefaultRules(): void {
    this.recommendationRules = [
      {
        id: 'rule-premium-electronics',
        name: '프리미엄 전자제품 추천',
        description: '고가 전자제품을 선호하는 고객에게 최신 기기 추천',
        conditions: {
          categories: ['electronics'],
          priceRange: { min: 500000, max: Infinity },
          timing: [],
          userSegment: ['premium']
        },
        recommendations: {
          suggestCategories: ['electronics', 'tech'],
          suggestPriceRange: { min: 500000, max: 2000000 },
          suggestTiming: ['weekend', 'evening'],
          customMessage: '최신 프리미엄 전자제품을 확인해보세요!'
        },
        priority: 10,
        enabled: true
      },
      {
        id: 'rule-fashion-seasonal',
        name: '계절 패션 추천',
        description: '계절에 맞는 패션 아이템 추천',
        conditions: {
          categories: ['fashion'],
          priceRange: { min: 0, max: Infinity },
          timing: ['season_change'],
          userSegment: ['regular', 'premium']
        },
        recommendations: {
          suggestCategories: ['fashion', 'accessories'],
          suggestPriceRange: { min: 30000, max: 200000 },
          suggestTiming: ['weekend'],
          customMessage: '새 시즌 패션 아이템을 만나보세요!'
        },
        priority: 8,
        enabled: true
      }
    ]
  }

  /**
   * 주기적 분석 시작
   */
  private startPeriodicAnalysis(): void {
    // 매일 자정에 분석 실행
    setInterval(() => {
      console.log('Running periodic purchase analytics...')
      // 실제 구현에서는 전체 데이터 재분석
    }, 24 * 60 * 60 * 1000)
  }

  /**
   * 유틸리티 메서드들
   */
  private generatePatternId(userId: string, timeframe: string): string {
    return `pattern-${userId}-${timeframe}-${Date.now()}`
  }

  private async savePatternToStorage(pattern: PurchasePattern): Promise<void> {
    try {
      const key = `purchase_pattern_${pattern.id}`
      localStorage.setItem(key, JSON.stringify({
        ...pattern,
        lastUpdated: pattern.lastUpdated.toISOString(),
        createdAt: pattern.createdAt.toISOString(),
        insights: pattern.insights.map(insight => ({
          ...insight,
          generatedAt: insight.generatedAt.toISOString()
        }))
      }))
    } catch (error) {
      console.error('Failed to save pattern to storage:', error)
    }
  }

  private async saveMetricsToStorage(metrics: AnalyticsMetrics): Promise<void> {
    try {
      const key = `analytics_metrics_${Date.now()}`
      localStorage.setItem(key, JSON.stringify(metrics))
    } catch (error) {
      console.error('Failed to save metrics to storage:', error)
    }
  }

  /**
   * 공개 메서드들
   */
  getUserPattern(userId: string, timeframe: PurchasePattern['timeframe'] = 'monthly'): PurchasePattern | null {
    return this.userPatterns.get(`${userId}-${timeframe}`) || null
  }

  getAllPatterns(): PurchasePattern[] {
    return Array.from(this.userPatterns.values())
  }

  getAnalyticsMetrics(): AnalyticsMetrics | null {
    return this.analyticsMetrics
  }

  getUserSegments(): UserSegment[] {
    return [...this.userSegments]
  }

  getRecommendationRules(): RecommendationRule[] {
    return [...this.recommendationRules]
  }

  addRecommendationRule(rule: Omit<RecommendationRule, 'id'>): RecommendationRule {
    const newRule: RecommendationRule = {
      ...rule,
      id: `rule-${Date.now()}`
    }
    this.recommendationRules.push(newRule)
    return newRule
  }

  updateRecommendationRule(id: string, updates: Partial<RecommendationRule>): RecommendationRule | null {
    const index = this.recommendationRules.findIndex(rule => rule.id === id)
    if (index === -1) return null

    this.recommendationRules[index] = { ...this.recommendationRules[index], ...updates }
    return this.recommendationRules[index]
  }

  deleteRecommendationRule(id: string): boolean {
    const index = this.recommendationRules.findIndex(rule => rule.id === id)
    if (index === -1) return false

    this.recommendationRules.splice(index, 1)
    return true
  }
}

// 싱글톤 인스턴스
export const purchaseAnalyticsService = new PurchaseAnalyticsService()