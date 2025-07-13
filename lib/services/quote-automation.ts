/**
 * Quote Automation Service
 * 견적서 자동화 서비스
 */

import { BuyForMeRequest } from '@/types/buy-for-me'
import { DetailedQuotation, QuotationTemplate, PricingBreakdown } from '@/types/quotation'
import { PriceCheckResult } from './price-verification'

export interface AutoQuoteRule {
  id: string
  name: string
  description: string
  conditions: AutoQuoteCondition[]
  actions: AutoQuoteAction[]
  priority: number
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AutoQuoteCondition {
  type: 'product_category' | 'price_range' | 'shipping_country' | 'user_tier' | 'order_count'
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between'
  value: string | number | [number, number]
}

export interface AutoQuoteAction {
  type: 'apply_template' | 'set_commission' | 'add_fee' | 'set_shipping' | 'apply_discount'
  value: string | number
  description?: string
}

export interface QuoteAutomationResult {
  quotation: DetailedQuotation
  appliedRules: string[]
  automationLevel: 'full' | 'partial' | 'manual'
  requiresReview: boolean
  confidence: number
  warnings: string[]
}

/**
 * 견적서 자동 생성 서비스
 */
export class QuoteAutomationService {
  private rules: AutoQuoteRule[] = []
  private templates: QuotationTemplate[] = []

  constructor() {
    this.initializeDefaultRules()
    this.initializeDefaultTemplates()
  }

  /**
   * 자동 견적서 생성
   */
  async generateAutoQuote(
    request: BuyForMeRequest,
    priceCheck?: PriceCheckResult
  ): Promise<QuoteAutomationResult> {
    const applicableRules = this.findApplicableRules(request)
    const template = this.selectBestTemplate(request, applicableRules)
    
    // 기본 견적 생성
    let quotation = this.createBaseQuotation(request, template)
    
    // 실시간 가격 적용
    if (priceCheck && priceCheck.currentPrice) {
      quotation = this.applyPriceCheck(quotation, priceCheck)
    }

    // 자동화 규칙 적용
    const { updatedQuotation, appliedRules } = this.applyAutomationRules(quotation, applicableRules)
    quotation = updatedQuotation

    // 자동화 결과 분석
    const result = this.analyzeAutomationResult(quotation, appliedRules, request)

    return result
  }

  /**
   * 적용 가능한 규칙 찾기
   */
  private findApplicableRules(request: BuyForMeRequest): AutoQuoteRule[] {
    return this.rules
      .filter(rule => rule.enabled)
      .filter(rule => this.evaluateConditions(rule.conditions, request))
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * 조건 평가
   */
  private evaluateConditions(conditions: AutoQuoteCondition[], request: BuyForMeRequest): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'product_category':
          return this.evaluateProductCategory(condition, request)
        case 'price_range':
          return this.evaluatePriceRange(condition, request)
        case 'shipping_country':
          return this.evaluateShippingCountry(condition, request)
        case 'user_tier':
          return this.evaluateUserTier(condition, request)
        case 'order_count':
          return this.evaluateOrderCount(condition, request)
        default:
          return false
      }
    })
  }

  private evaluateProductCategory(condition: AutoQuoteCondition, request: BuyForMeRequest): boolean {
    const category = this.detectProductCategory(request.productInfo.title)
    
    switch (condition.operator) {
      case 'equals':
        return category === condition.value
      case 'contains':
        return category.includes(condition.value as string)
      default:
        return false
    }
  }

  private evaluatePriceRange(condition: AutoQuoteCondition, request: BuyForMeRequest): boolean {
    const price = request.productInfo.price
    
    switch (condition.operator) {
      case 'greater_than':
        return price > (condition.value as number)
      case 'less_than':
        return price < (condition.value as number)
      case 'between':
        const [min, max] = condition.value as [number, number]
        return price >= min && price <= max
      default:
        return false
    }
  }

  private evaluateShippingCountry(condition: AutoQuoteCondition, request: BuyForMeRequest): boolean {
    // 실제 구현에서는 사용자의 배송 국가 정보 사용
    return condition.value === 'KR' // 현재는 한국만 지원
  }

  private evaluateUserTier(condition: AutoQuoteCondition, request: BuyForMeRequest): boolean {
    // 실제 구현에서는 사용자 등급 정보 사용
    return condition.value === 'standard'
  }

  private evaluateOrderCount(condition: AutoQuoteCondition, request: BuyForMeRequest): boolean {
    // 실제 구현에서는 사용자의 주문 횟수 정보 사용
    const orderCount = 5 // 모의 데이터
    
    switch (condition.operator) {
      case 'greater_than':
        return orderCount > (condition.value as number)
      case 'less_than':
        return orderCount < (condition.value as number)
      default:
        return false
    }
  }

  /**
   * 최적 템플릿 선택
   */
  private selectBestTemplate(request: BuyForMeRequest, rules: AutoQuoteRule[]): QuotationTemplate {
    // 규칙에서 지정된 템플릿 찾기
    for (const rule of rules) {
      const templateAction = rule.actions.find(action => action.type === 'apply_template')
      if (templateAction) {
        const template = this.templates.find(t => t.id === templateAction.value)
        if (template) return template
      }
    }

    // 기본 템플릿 선택
    const category = this.detectProductCategory(request.productInfo.title)
    return this.templates.find(t => t.category === category) || this.templates[0]
  }

  /**
   * 기본 견적서 생성
   */
  private createBaseQuotation(request: BuyForMeRequest, template: QuotationTemplate): DetailedQuotation {
    const basePrice = request.productInfo.price
    const commission = Math.ceil(basePrice * 0.08) // 8% 수수료
    
    const pricing: PricingBreakdown = {
      productPrice: basePrice,
      commission,
      serviceFee: template.fees.serviceFee,
      shippingFee: template.fees.domesticShipping,
      insuranceFee: template.fees.insurance,
      taxes: 0,
      discounts: 0,
      totalAmount: basePrice + commission + template.fees.serviceFee + template.fees.domesticShipping + template.fees.insurance
    }

    return {
      id: this.generateQuotationId(),
      requestId: request.id,
      templateId: template.id,
      productInfo: {
        title: request.productInfo.title,
        url: request.productInfo.url,
        price: basePrice,
        options: request.productInfo.options,
        category: this.detectProductCategory(request.productInfo.title),
        imageUrl: request.productInfo.imageUrl
      },
      pricing,
      shippingOptions: template.shippingOptions,
      timeline: {
        processing: '1-2 영업일',
        purchasing: '2-3 영업일',
        shipping: '5-7 영업일',
        total: '8-12 영업일'
      },
      terms: template.terms,
      notes: template.notes,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
      currency: 'KRW'
    }
  }

  /**
   * 실시간 가격 체크 결과 적용
   */
  private applyPriceCheck(quotation: DetailedQuotation, priceCheck: PriceCheckResult): DetailedQuotation {
    if (!priceCheck.currentPrice) return quotation

    const priceDifference = priceCheck.currentPrice - quotation.pricing.productPrice
    const updatedPricing = {
      ...quotation.pricing,
      productPrice: priceCheck.currentPrice,
      totalAmount: quotation.pricing.totalAmount + priceDifference
    }

    return {
      ...quotation,
      pricing: updatedPricing,
      notes: [
        ...quotation.notes,
        `실시간 가격 확인: ₩${priceCheck.currentPrice.toLocaleString()} (${priceCheck.lastChecked?.toLocaleString()})`
      ]
    }
  }

  /**
   * 자동화 규칙 적용
   */
  private applyAutomationRules(
    quotation: DetailedQuotation, 
    rules: AutoQuoteRule[]
  ): { updatedQuotation: DetailedQuotation; appliedRules: string[] } {
    let updated = { ...quotation }
    const appliedRules: string[] = []

    for (const rule of rules) {
      for (const action of rule.actions) {
        if (action.type === 'apply_template') continue // 이미 적용됨

        updated = this.applyAction(updated, action)
        appliedRules.push(`${rule.name}: ${action.description || action.type}`)
      }
    }

    return { updatedQuotation: updated, appliedRules }
  }

  /**
   * 개별 액션 적용
   */
  private applyAction(quotation: DetailedQuotation, action: AutoQuoteAction): DetailedQuotation {
    const pricing = { ...quotation.pricing }

    switch (action.type) {
      case 'set_commission':
        const newCommission = Math.ceil(pricing.productPrice * (action.value as number) / 100)
        const commissionDiff = newCommission - pricing.commission
        pricing.commission = newCommission
        pricing.totalAmount += commissionDiff
        break

      case 'add_fee':
        pricing.serviceFee += action.value as number
        pricing.totalAmount += action.value as number
        break

      case 'set_shipping':
        const shippingDiff = (action.value as number) - pricing.shippingFee
        pricing.shippingFee = action.value as number
        pricing.totalAmount += shippingDiff
        break

      case 'apply_discount':
        const discount = action.value as number
        pricing.discounts += discount
        pricing.totalAmount -= discount
        break
    }

    return { ...quotation, pricing }
  }

  /**
   * 자동화 결과 분석
   */
  private analyzeAutomationResult(
    quotation: DetailedQuotation, 
    appliedRules: string[], 
    request: BuyForMeRequest
  ): QuoteAutomationResult {
    const confidence = this.calculateConfidence(quotation, request)
    const automationLevel = this.determineAutomationLevel(appliedRules.length, confidence)
    const requiresReview = this.requiresReview(quotation, confidence)
    const warnings = this.generateWarnings(quotation, request)

    return {
      quotation,
      appliedRules,
      automationLevel,
      requiresReview,
      confidence,
      warnings
    }
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(quotation: DetailedQuotation, request: BuyForMeRequest): number {
    let confidence = 100

    // 가격 정확성 확인
    if (quotation.pricing.productPrice !== request.productInfo.price) {
      confidence -= 10
    }

    // 카테고리 인식 신뢰도
    const category = this.detectProductCategory(request.productInfo.title)
    if (category === 'general') {
      confidence -= 15
    }

    // 특수 요청사항 복잡도
    if (request.specialRequests && request.specialRequests.length > 50) {
      confidence -= 20
    }

    return Math.max(confidence, 0)
  }

  /**
   * 자동화 수준 결정
   */
  private determineAutomationLevel(appliedRulesCount: number, confidence: number): 'full' | 'partial' | 'manual' {
    if (confidence >= 90 && appliedRulesCount >= 3) return 'full'
    if (confidence >= 70 && appliedRulesCount >= 1) return 'partial'
    return 'manual'
  }

  /**
   * 검토 필요 여부
   */
  private requiresReview(quotation: DetailedQuotation, confidence: number): boolean {
    return confidence < 80 || quotation.pricing.totalAmount > 1000000 // 100만원 초과 시 검토
  }

  /**
   * 경고 메시지 생성
   */
  private generateWarnings(quotation: DetailedQuotation, request: BuyForMeRequest): string[] {
    const warnings: string[] = []

    if (quotation.pricing.totalAmount > 500000) {
      warnings.push('고액 주문: 결제 방법 및 한도 확인 필요')
    }

    if (request.specialRequests && request.specialRequests.includes('급한')) {
      warnings.push('긴급 주문: 추가 수수료 및 배송비 검토 필요')
    }

    const category = this.detectProductCategory(request.productInfo.title)
    if (category === 'electronics') {
      warnings.push('전자제품: 국내 인증 및 A/S 안내 필요')
    }

    return warnings
  }

  /**
   * 상품 카테고리 감지
   */
  private detectProductCategory(title: string): string {
    const categories = {
      electronics: ['스마트폰', '노트북', '컴퓨터', '태블릿', '이어폰', '헤드폰'],
      fashion: ['옷', '신발', '가방', '액세서리', '패션'],
      beauty: ['화장품', '스킨케어', '향수', '뷰티'],
      home: ['가구', '인테리어', '주방', '생활용품'],
      sports: ['운동', '스포츠', '헬스', '피트니스'],
      books: ['책', '도서', '교재'],
      toys: ['장난감', '게임', '완구']
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category
      }
    }

    return 'general'
  }

  /**
   * 기본 규칙 초기화
   */
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'rule-high-value',
        name: '고액 상품 할인',
        description: '50만원 이상 상품에 대해 수수료 할인 적용',
        conditions: [
          { type: 'price_range', operator: 'greater_than', value: 500000 }
        ],
        actions: [
          { type: 'set_commission', value: 6, description: '수수료 6%로 할인' }
        ],
        priority: 10,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rule-electronics',
        name: '전자제품 추가 수수료',
        description: '전자제품의 경우 검수 수수료 추가',
        conditions: [
          { type: 'product_category', operator: 'equals', value: 'electronics' }
        ],
        actions: [
          { type: 'add_fee', value: 5000, description: '전자제품 검수 수수료 추가' }
        ],
        priority: 8,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rule-bulk-discount',
        name: '다량 주문 할인',
        description: '5회 이상 주문 고객 할인',
        conditions: [
          { type: 'order_count', operator: 'greater_than', value: 5 }
        ],
        actions: [
          { type: 'apply_discount', value: 10000, description: '단골 고객 할인 1만원' }
        ],
        priority: 5,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  /**
   * 기본 템플릿 초기화
   */
  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'template-standard',
        name: '표준 템플릿',
        category: 'general',
        fees: {
          serviceFee: 3000,
          domesticShipping: 3000,
          internationalShipping: 25000,
          insurance: 2000
        },
        shippingOptions: [
          { 
            id: 'standard', 
            name: '일반배송', 
            fee: 3000, 
            duration: '5-7일',
            description: '일반 택배 배송'
          }
        ],
        terms: [
          '결제 완료 후 구매 진행',
          '상품 하자 시 교환/환불 가능',
          '단순 변심 시 왕복 배송비 고객 부담'
        ],
        notes: [
          '정확한 배송 기간은 판매자 상황에 따라 달라질 수 있습니다.'
        ]
      },
      {
        id: 'template-electronics',
        name: '전자제품 템플릿',
        category: 'electronics',
        fees: {
          serviceFee: 5000,
          domesticShipping: 3000,
          internationalShipping: 30000,
          insurance: 3000
        },
        shippingOptions: [
          { 
            id: 'safe', 
            name: '안전포장배송', 
            fee: 5000, 
            duration: '5-7일',
            description: '전자제품 전용 안전 포장'
          }
        ],
        terms: [
          '전자제품 특성상 개봉 후 교환/환불 불가',
          '초기 불량 시 1주일 내 A/S 가능',
          '국내 인증 필요 시 추가 비용 발생 가능'
        ],
        notes: [
          '전자제품은 국내 인증(KC, 전파인증) 확인이 필요할 수 있습니다.',
          '제품 사양 및 호환성을 반드시 확인해주세요.'
        ]
      }
    ]
  }

  /**
   * 견적서 ID 생성
   */
  private generateQuotationId(): string {
    return `quote-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  /**
   * 규칙 관리 메서드들
   */
  addRule(rule: Omit<AutoQuoteRule, 'id' | 'createdAt' | 'updatedAt'>): AutoQuoteRule {
    const newRule: AutoQuoteRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.rules.push(newRule)
    return newRule
  }

  updateRule(id: string, updates: Partial<AutoQuoteRule>): AutoQuoteRule | null {
    const index = this.rules.findIndex(rule => rule.id === id)
    if (index === -1) return null

    this.rules[index] = {
      ...this.rules[index],
      ...updates,
      updatedAt: new Date()
    }
    return this.rules[index]
  }

  deleteRule(id: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === id)
    if (index === -1) return false

    this.rules.splice(index, 1)
    return true
  }

  getRules(): AutoQuoteRule[] {
    return [...this.rules]
  }

  getTemplates(): QuotationTemplate[] {
    return [...this.templates]
  }
}

// 싱글톤 인스턴스
export const quoteAutomationService = new QuoteAutomationService()