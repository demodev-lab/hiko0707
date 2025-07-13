/**
 * Recommendation Engine Service
 * 맞춤 추천 시스템 서비스
 */

import { BuyForMeRequest } from '@/types/buy-for-me'
import { HotDeal } from '@/types/hotdeal'
import { User } from '@/types/user'
import { PurchasePattern, RecommendationRule, purchaseAnalyticsService } from './purchase-analytics'

export interface UserRecommendation {
  id: string
  userId: string
  type: 'hotdeal' | 'category' | 'price_range' | 'timing' | 'site' | 'custom'
  title: string
  description: string
  reasoning: string
  items: RecommendationItem[]
  confidence: number // 0-100
  priority: number // 1-10
  metadata: {
    sourcePattern?: PurchasePattern
    matchedRules?: string[]
    category?: string
    priceRange?: { min: number, max: number }
    targetTiming?: string
    personalizedScore?: number
  }
  createdAt: Date
  expiresAt: Date
  clicked: boolean
  applied: boolean
  feedback?: 'helpful' | 'not_helpful' | 'irrelevant'
}

export interface RecommendationItem {
  id: string
  type: 'hotdeal' | 'product' | 'category' | 'action'
  title: string
  description?: string
  url?: string
  imageUrl?: string
  price?: number
  originalPrice?: number
  discount?: number
  site?: string
  category?: string
  tags?: string[]
  score: number
  metadata?: any
}

export interface RecommendationConfig {
  maxRecommendations: number
  minConfidence: number
  includeTypes: UserRecommendation['type'][]
  excludeExpired: boolean
  personalizeScoring: boolean
  diversifyResults: boolean
}

export interface RecommendationStats {
  totalRecommendations: number
  clickRate: number
  applicationRate: number
  feedbackRate: number
  topCategories: Array<{ category: string, count: number, clickRate: number }>
  performanceByType: Array<{ type: string, count: number, clickRate: number, confidence: number }>
  userEngagement: {
    activeUsers: number
    averageRecommendationsPerUser: number
    averageClicksPerUser: number
  }
}

export interface RecommendationEngine {
  generateRecommendations(userId: string, config?: Partial<RecommendationConfig>): Promise<UserRecommendation[]>
  getRecommendationsByType(userId: string, type: UserRecommendation['type']): Promise<UserRecommendation[]>
  updateRecommendation(id: string, updates: Partial<UserRecommendation>): Promise<UserRecommendation | null>
  recordClick(recommendationId: string, itemId?: string): Promise<void>
  recordApplication(recommendationId: string, orderId?: string): Promise<void>
  recordFeedback(recommendationId: string, feedback: UserRecommendation['feedback']): Promise<void>
  getStats(timeframe?: 'daily' | 'weekly' | 'monthly'): Promise<RecommendationStats>
}

class RecommendationEngineService implements RecommendationEngine {
  private static instance: RecommendationEngineService
  private recommendations: Map<string, UserRecommendation> = new Map()
  private clickHistory: Map<string, Array<{ timestamp: Date, itemId?: string }>> = new Map()
  private feedbackHistory: Map<string, UserRecommendation['feedback']> = new Map()

  static getInstance(): RecommendationEngineService {
    if (!RecommendationEngineService.instance) {
      RecommendationEngineService.instance = new RecommendationEngineService()
    }
    return RecommendationEngineService.instance
  }

  async generateRecommendations(
    userId: string, 
    config: Partial<RecommendationConfig> = {}
  ): Promise<UserRecommendation[]> {
    const defaultConfig: RecommendationConfig = {
      maxRecommendations: 10,
      minConfidence: 30,
      includeTypes: ['hotdeal', 'category', 'price_range', 'timing', 'site'],
      excludeExpired: true,
      personalizeScoring: true,
      diversifyResults: true
    }

    const finalConfig = { ...defaultConfig, ...config }
    const recommendations: UserRecommendation[] = []

    try {
      // 사용자 구매 패턴 가져오기
      const userPattern = await purchaseAnalyticsService.getUserPattern(userId)
      if (!userPattern) {
        return await this.generateGenericRecommendations(userId, finalConfig)
      }

      // 추천 규칙 가져오기
      const rules = await purchaseAnalyticsService.getRecommendationRules()
      const applicableRules = rules.filter(rule => 
        rule.enabled && this.isRuleApplicable(rule, userPattern)
      )

      // 각 타입별로 추천 생성
      for (const type of finalConfig.includeTypes) {
        const typeRecommendations = await this.generateRecommendationsByType(
          userId, 
          type, 
          userPattern, 
          applicableRules
        )
        recommendations.push(...typeRecommendations)
      }

      // 점수로 정렬 및 다양성 확보
      let finalRecommendations = this.scoreAndRankRecommendations(recommendations, userPattern)
      
      if (finalConfig.diversifyResults) {
        finalRecommendations = this.diversifyRecommendations(finalRecommendations)
      }

      // 신뢰도 필터링 및 개수 제한
      finalRecommendations = finalRecommendations
        .filter(rec => rec.confidence >= finalConfig.minConfidence)
        .slice(0, finalConfig.maxRecommendations)

      // 저장
      finalRecommendations.forEach(rec => {
        this.recommendations.set(rec.id, rec)
      })

      return finalRecommendations

    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      return await this.generateGenericRecommendations(userId, finalConfig)
    }
  }

  private async generateRecommendationsByType(
    userId: string,
    type: UserRecommendation['type'],
    pattern: PurchasePattern,
    rules: RecommendationRule[]
  ): Promise<UserRecommendation[]> {
    const recommendations: UserRecommendation[] = []

    switch (type) {
      case 'category':
        recommendations.push(...await this.generateCategoryRecommendations(userId, pattern))
        break
      case 'price_range':
        recommendations.push(...await this.generatePriceRangeRecommendations(userId, pattern))
        break
      case 'timing':
        recommendations.push(...await this.generateTimingRecommendations(userId, pattern))
        break
      case 'site':
        recommendations.push(...await this.generateSiteRecommendations(userId, pattern))
        break
      case 'hotdeal':
        recommendations.push(...await this.generateHotDealRecommendations(userId, pattern))
        break
      case 'custom':
        recommendations.push(...await this.generateCustomRecommendations(userId, pattern, rules))
        break
    }

    return recommendations
  }

  private async generateCategoryRecommendations(
    userId: string, 
    pattern: PurchasePattern
  ): Promise<UserRecommendation[]> {
    const topCategories = pattern.patterns.frequentCategories
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)

    return topCategories.map((category, index) => ({
      id: `category-${userId}-${Date.now()}-${index}`,
      userId,
      type: 'category' as const,
      title: `${category.category} 카테고리 추천`,
      description: `자주 구매하시는 ${category.category} 관련 상품들을 추천드립니다`,
      reasoning: `최근 ${pattern.timeframe} 동안 ${category.frequency}회 구매하신 카테고리입니다`,
      items: this.getMockCategoryItems(category.category),
      confidence: Math.min(90, 50 + (category.frequency * 10)),
      priority: 10 - index,
      metadata: {
        sourcePattern: pattern,
        category: category.category,
        personalizedScore: category.frequency
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
      clicked: false,
      applied: false
    }))
  }

  private async generatePriceRangeRecommendations(
    userId: string, 
    pattern: PurchasePattern
  ): Promise<UserRecommendation[]> {
    const preferredRange = pattern.patterns.priceRanges
      .sort((a, b) => b.frequency - a.frequency)[0]

    if (!preferredRange) return []

    return [{
      id: `price-${userId}-${Date.now()}`,
      userId,
      type: 'price_range' as const,
      title: `${preferredRange.range} 가격대 추천`,
      description: `선호하시는 가격대의 상품들을 모아봤습니다`,
      reasoning: `${preferredRange.percentage.toFixed(1)}%의 구매가 이 가격대에서 이루어졌습니다`,
      items: this.getMockPriceRangeItems(preferredRange.minPrice, preferredRange.maxPrice),
      confidence: Math.min(85, 40 + preferredRange.percentage),
      priority: 7,
      metadata: {
        sourcePattern: pattern,
        priceRange: { min: preferredRange.minPrice, max: preferredRange.maxPrice },
        personalizedScore: preferredRange.frequency
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5일
      clicked: false,
      applied: false
    }]
  }

  private async generateTimingRecommendations(
    userId: string, 
    pattern: PurchasePattern
  ): Promise<UserRecommendation[]> {
    const bestTiming = pattern.patterns.purchaseTiming
      .sort((a, b) => b.frequency - a.frequency)[0]

    if (!bestTiming) return []

    return [{
      id: `timing-${userId}-${Date.now()}`,
      userId,
      type: 'timing' as const,
      title: `${bestTiming.period} 구매 타이밍 추천`,
      description: `평소 구매 패턴을 기반으로 최적의 구매 시점을 추천드립니다`,
      reasoning: `${bestTiming.type} 기준으로 ${bestTiming.period}에 가장 많이 구매하셨습니다`,
      items: this.getMockTimingItems(bestTiming.period),
      confidence: Math.min(80, 30 + bestTiming.percentage),
      priority: 6,
      metadata: {
        sourcePattern: pattern,
        targetTiming: bestTiming.period,
        personalizedScore: bestTiming.frequency
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3일
      clicked: false,
      applied: false
    }]
  }

  private async generateSiteRecommendations(
    userId: string, 
    pattern: PurchasePattern
  ): Promise<UserRecommendation[]> {
    const topSites = pattern.patterns.shoppingSites
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 2)

    return topSites.map((site, index) => ({
      id: `site-${userId}-${Date.now()}-${index}`,
      userId,
      type: 'site' as const,
      title: `${site.site} 추천 상품`,
      description: `자주 이용하시는 ${site.site}의 인기 상품들을 추천드립니다`,
      reasoning: `평균 주문가 ₩${site.averageOrderValue.toLocaleString()}으로 만족도가 높은 사이트입니다`,
      items: this.getMockSiteItems(site.site),
      confidence: Math.min(85, 35 + site.satisfactionScore),
      priority: 8 - index,
      metadata: {
        sourcePattern: pattern,
        personalizedScore: site.frequency
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
      clicked: false,
      applied: false
    }))
  }

  private async generateHotDealRecommendations(
    userId: string, 
    pattern: PurchasePattern
  ): Promise<UserRecommendation[]> {
    const topCategory = pattern.patterns.frequentCategories[0]?.category
    
    return [{
      id: `hotdeal-${userId}-${Date.now()}`,
      userId,
      type: 'hotdeal' as const,
      title: '맞춤 핫딜 추천',
      description: `${topCategory || '관심사'}를 기반으로 선별한 최신 핫딜입니다`,
      reasoning: '구매 패턴을 분석하여 관심있어 하실 핫딜을 선별했습니다',
      items: this.getMockHotDealItems(topCategory),
      confidence: 75,
      priority: 9,
      metadata: {
        sourcePattern: pattern,
        category: topCategory,
        personalizedScore: pattern.patterns.frequentCategories[0]?.frequency || 1
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2일
      clicked: false,
      applied: false
    }]
  }

  private async generateCustomRecommendations(
    userId: string, 
    pattern: PurchasePattern,
    rules: RecommendationRule[]
  ): Promise<UserRecommendation[]> {
    return rules.map((rule, index) => ({
      id: `custom-${userId}-${rule.id}-${Date.now()}`,
      userId,
      type: 'custom' as const,
      title: rule.name,
      description: rule.description,
      reasoning: rule.recommendations.customMessage || '맞춤 규칙 기반 추천',
      items: this.getMockCustomItems(rule),
      confidence: Math.min(90, 50 + rule.priority * 5),
      priority: rule.priority,
      metadata: {
        sourcePattern: pattern,
        matchedRules: [rule.id],
        personalizedScore: rule.priority
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5일
      clicked: false,
      applied: false
    }))
  }

  private async generateGenericRecommendations(
    userId: string,
    config: RecommendationConfig
  ): Promise<UserRecommendation[]> {
    return [{
      id: `generic-${userId}-${Date.now()}`,
      userId,
      type: 'hotdeal' as const,
      title: '인기 핫딜 추천',
      description: '현재 가장 인기있는 핫딜을 추천드립니다',
      reasoning: '구매 패턴 분석 중이니 인기 상품부터 확인해보세요',
      items: this.getMockGenericItems(),
      confidence: 50,
      priority: 5,
      metadata: {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3일
      clicked: false,
      applied: false
    }]
  }

  private isRuleApplicable(rule: RecommendationRule, pattern: PurchasePattern): boolean {
    // 카테고리 조건 확인
    if (rule.conditions.categories.length > 0) {
      const userCategories = pattern.patterns.frequentCategories.map(c => c.category)
      const hasMatchingCategory = rule.conditions.categories.some(cat => 
        userCategories.includes(cat)
      )
      if (!hasMatchingCategory) return false
    }

    // 가격대 조건 확인
    const avgPurchaseAmount = pattern.patterns.frequentCategories
      .reduce((sum, cat) => sum + cat.averageAmount, 0) / 
      (pattern.patterns.frequentCategories.length || 1)

    if (avgPurchaseAmount < rule.conditions.priceRange.min || 
        avgPurchaseAmount > rule.conditions.priceRange.max) {
      return false
    }

    return true
  }

  private scoreAndRankRecommendations(
    recommendations: UserRecommendation[], 
    pattern: PurchasePattern
  ): UserRecommendation[] {
    return recommendations
      .map(rec => ({
        ...rec,
        confidence: this.calculatePersonalizedConfidence(rec, pattern)
      }))
      .sort((a, b) => {
        // 우선순위 1차 정렬
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        // 신뢰도 2차 정렬
        return b.confidence - a.confidence
      })
  }

  private calculatePersonalizedConfidence(
    recommendation: UserRecommendation, 
    pattern: PurchasePattern
  ): number {
    let confidence = recommendation.confidence
    
    // 개인화 점수 반영
    if (recommendation.metadata.personalizedScore) {
      confidence += Math.min(20, recommendation.metadata.personalizedScore * 2)
    }

    // 최근성 가산점
    const daysSinceLastUpdate = Math.floor(
      (Date.now() - pattern.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceLastUpdate <= 7) {
      confidence += 10
    }

    return Math.min(100, confidence)
  }

  private diversifyRecommendations(recommendations: UserRecommendation[]): UserRecommendation[] {
    const diversified: UserRecommendation[] = []
    const typeCount: Record<string, number> = {}

    for (const rec of recommendations) {
      const currentTypeCount = typeCount[rec.type] || 0
      
      // 각 타입당 최대 3개까지만 허용
      if (currentTypeCount < 3) {
        diversified.push(rec)
        typeCount[rec.type] = currentTypeCount + 1
      }
    }

    return diversified
  }

  // Mock 데이터 생성 메서드들
  private getMockCategoryItems(category: string): RecommendationItem[] {
    const mockItems = [
      { title: `${category} 베스트 상품 1`, price: 45000, originalPrice: 60000 },
      { title: `${category} 신상품`, price: 32000, originalPrice: 40000 },
      { title: `${category} 인기 브랜드`, price: 78000, originalPrice: 95000 }
    ]

    return mockItems.map((item, index) => ({
      id: `${category}-item-${index}`,
      type: 'product' as const,
      title: item.title,
      description: `${category} 카테고리의 추천 상품입니다`,
      price: item.price,
      originalPrice: item.originalPrice,
      discount: Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100),
      category,
      score: 90 - index * 5,
      tags: [category, '추천']
    }))
  }

  private getMockPriceRangeItems(minPrice: number, maxPrice: number): RecommendationItem[] {
    const avgPrice = (minPrice + maxPrice) / 2
    
    return Array.from({ length: 3 }, (_, index) => ({
      id: `price-item-${index}`,
      type: 'product' as const,
      title: `가격대 맞춤 상품 ${index + 1}`,
      description: `₩${minPrice.toLocaleString()} - ₩${maxPrice.toLocaleString()} 가격대 상품`,
      price: Math.round(avgPrice + (Math.random() - 0.5) * avgPrice * 0.4),
      score: 85 - index * 5,
      tags: ['가격대 맞춤', '추천']
    }))
  }

  private getMockTimingItems(period: string): RecommendationItem[] {
    return [{
      id: `timing-item-${period}`,
      type: 'action' as const,
      title: `${period} 추천 구매`,
      description: `평소 ${period}에 구매하시는 패턴을 기반으로 추천드립니다`,
      score: 80,
      tags: ['타이밍', '추천']
    }]
  }

  private getMockSiteItems(site: string): RecommendationItem[] {
    return Array.from({ length: 2 }, (_, index) => ({
      id: `${site}-item-${index}`,
      type: 'product' as const,
      title: `${site} 인기상품 ${index + 1}`,
      description: `${site}에서 인기있는 상품입니다`,
      site,
      score: 85 - index * 5,
      tags: [site, '인기']
    }))
  }

  private getMockHotDealItems(category?: string): RecommendationItem[] {
    return Array.from({ length: 3 }, (_, index) => ({
      id: `hotdeal-item-${index}`,
      type: 'hotdeal' as const,
      title: `${category || '추천'} 핫딜 ${index + 1}`,
      description: '지금 놓치면 안되는 핫딜입니다',
      price: 25000 + index * 10000,
      originalPrice: 40000 + index * 15000,
      discount: 35 + index * 5,
      category,
      score: 90 - index * 5,
      tags: ['핫딜', category || '추천'].filter(Boolean)
    }))
  }

  private getMockCustomItems(rule: RecommendationRule): RecommendationItem[] {
    return rule.recommendations.suggestCategories.map((category, index) => ({
      id: `custom-${rule.id}-${index}`,
      type: 'category' as const,
      title: `${category} 맞춤 추천`,
      description: rule.recommendations.customMessage,
      category,
      score: 80 + rule.priority,
      tags: [category, '맞춤']
    }))
  }

  private getMockGenericItems(): RecommendationItem[] {
    return [
      {
        id: 'generic-1',
        type: 'hotdeal' as const,
        title: '인기 핫딜 1',
        description: '현재 가장 인기있는 상품입니다',
        price: 35000,
        originalPrice: 50000,
        discount: 30,
        score: 75,
        tags: ['인기', '핫딜']
      }
    ]
  }

  // 인터페이스 구현 메서드들
  async getRecommendationsByType(
    userId: string, 
    type: UserRecommendation['type']
  ): Promise<UserRecommendation[]> {
    const userRecommendations = Array.from(this.recommendations.values())
      .filter(rec => rec.userId === userId && rec.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    
    return userRecommendations
  }

  async updateRecommendation(
    id: string, 
    updates: Partial<UserRecommendation>
  ): Promise<UserRecommendation | null> {
    const existing = this.recommendations.get(id)
    if (!existing) return null

    const updated = { ...existing, ...updates }
    this.recommendations.set(id, updated)
    return updated
  }

  async recordClick(recommendationId: string, itemId?: string): Promise<void> {
    const recommendation = this.recommendations.get(recommendationId)
    if (!recommendation) return

    // 클릭 기록
    const clicks = this.clickHistory.get(recommendationId) || []
    clicks.push({ timestamp: new Date(), itemId })
    this.clickHistory.set(recommendationId, clicks)

    // 추천 상태 업데이트
    await this.updateRecommendation(recommendationId, { clicked: true })
  }

  async recordApplication(recommendationId: string, orderId?: string): Promise<void> {
    await this.updateRecommendation(recommendationId, { 
      applied: true,
      metadata: { 
        ...this.recommendations.get(recommendationId)?.metadata,
        appliedOrderId: orderId 
      }
    })
  }

  async recordFeedback(
    recommendationId: string, 
    feedback: UserRecommendation['feedback']
  ): Promise<void> {
    this.feedbackHistory.set(recommendationId, feedback)
    await this.updateRecommendation(recommendationId, { feedback })
  }

  async getStats(timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<RecommendationStats> {
    const now = new Date()
    const timeframeDays = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : 30
    const startTime = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000)

    const recentRecommendations = Array.from(this.recommendations.values())
      .filter(rec => rec.createdAt >= startTime)

    const totalRecommendations = recentRecommendations.length
    const clickedRecommendations = recentRecommendations.filter(rec => rec.clicked).length
    const appliedRecommendations = recentRecommendations.filter(rec => rec.applied).length
    const withFeedback = recentRecommendations.filter(rec => rec.feedback).length

    // 카테고리별 통계
    const categoryStats = new Map<string, { count: number, clicks: number }>()
    recentRecommendations.forEach(rec => {
      const category = rec.metadata.category || 'other'
      const stats = categoryStats.get(category) || { count: 0, clicks: 0 }
      stats.count++
      if (rec.clicked) stats.clicks++
      categoryStats.set(category, stats)
    })

    const topCategories = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        clickRate: stats.count > 0 ? (stats.clicks / stats.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 타입별 성과
    const typeStats = new Map<string, { count: number, clicks: number, totalConfidence: number }>()
    recentRecommendations.forEach(rec => {
      const stats = typeStats.get(rec.type) || { count: 0, clicks: 0, totalConfidence: 0 }
      stats.count++
      stats.totalConfidence += rec.confidence
      if (rec.clicked) stats.clicks++
      typeStats.set(rec.type, stats)
    })

    const performanceByType = Array.from(typeStats.entries())
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        clickRate: stats.count > 0 ? (stats.clicks / stats.count) * 100 : 0,
        confidence: stats.count > 0 ? stats.totalConfidence / stats.count : 0
      }))

    // 사용자 참여도
    const activeUsers = new Set(recentRecommendations.map(rec => rec.userId)).size
    const totalClicks = Array.from(this.clickHistory.values())
      .flat()
      .filter(click => click.timestamp >= startTime).length

    return {
      totalRecommendations,
      clickRate: totalRecommendations > 0 ? (clickedRecommendations / totalRecommendations) * 100 : 0,
      applicationRate: totalRecommendations > 0 ? (appliedRecommendations / totalRecommendations) * 100 : 0,
      feedbackRate: totalRecommendations > 0 ? (withFeedback / totalRecommendations) * 100 : 0,
      topCategories,
      performanceByType,
      userEngagement: {
        activeUsers,
        averageRecommendationsPerUser: activeUsers > 0 ? totalRecommendations / activeUsers : 0,
        averageClicksPerUser: activeUsers > 0 ? totalClicks / activeUsers : 0
      }
    }
  }

  // 추가 유틸리티 메서드
  getUserRecommendations(userId: string, limit = 10): UserRecommendation[] {
    return Array.from(this.recommendations.values())
      .filter(rec => rec.userId === userId && rec.expiresAt > new Date())
      .sort((a, b) => b.priority - a.priority || b.confidence - a.confidence)
      .slice(0, limit)
  }

  clearExpiredRecommendations(): number {
    const now = new Date()
    const expired = Array.from(this.recommendations.entries())
      .filter(([_, rec]) => rec.expiresAt <= now)
    
    expired.forEach(([id]) => this.recommendations.delete(id))
    return expired.length
  }
}

export const recommendationEngineService = RecommendationEngineService.getInstance()