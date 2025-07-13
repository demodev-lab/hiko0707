/**
 * Quotation Service
 * 견적서 생성 및 관리 서비스
 */

import { 
  DetailedQuotation, 
  QuotationTemplate, 
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationValidationResult,
  ProductCategory,
  QuotationFee,
  ShippingOption,
  PaymentMethod,
  QuotationStats
} from '@/types/quotation'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { verifyProductPrice, PriceCheckResult } from './price-verification'

/**
 * 기본 견적서 템플릿들
 */
const defaultTemplates: QuotationTemplate[] = [
  {
    id: 'electronics-standard',
    name: '전자제품 표준',
    description: '일반 전자제품용 견적서 템플릿',
    category: 'electronics',
    baseServiceFeePercent: 8,
    additionalFees: [
      {
        id: 'electronics-inspection',
        name: '전자제품 검수비',
        description: '전자제품 작동 확인 및 포장 상태 검수',
        type: 'fixed',
        amount: 5000,
        isOptional: false,
        category: 'service'
      }
    ],
    shippingOptions: [
      {
        id: 'standard-electronics',
        name: '일반배송',
        description: '일반 택배 배송 (2-3일)',
        estimatedDays: 3,
        basePrice: 3000,
        trackingIncluded: true,
        insuranceIncluded: false,
        supportedRegions: ['전국']
      },
      {
        id: 'safe-electronics',
        name: '안전배송',
        description: '전자제품 전용 포장재 사용 (3-4일)',
        estimatedDays: 4,
        basePrice: 8000,
        trackingIncluded: true,
        insuranceIncluded: true,
        supportedRegions: ['전국']
      }
    ],
    terms: [
      '전자제품은 배송 중 파손 위험이 있어 안전배송을 권장합니다',
      '개봉 후 불량 확인 시 판매자와 직접 교환/환불 진행됩니다',
      '해외 직구 상품의 경우 A/S가 제한될 수 있습니다'
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0
  },
  {
    id: 'fashion-standard',
    name: '패션 표준',
    description: '의류, 신발, 가방 등 패션 아이템용',
    category: 'fashion',
    baseServiceFeePercent: 8,
    additionalFees: [],
    shippingOptions: [
      {
        id: 'standard-fashion',
        name: '일반배송',
        description: '일반 택배 배송 (2-3일)',
        estimatedDays: 3,
        basePrice: 3000,
        trackingIncluded: true,
        insuranceIncluded: false,
        supportedRegions: ['전국']
      }
    ],
    terms: [
      '사이즈 교환은 상품 수령 후 7일 이내 가능합니다',
      '착용 흔적이 있는 경우 교환/환불이 제한될 수 있습니다'
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0
  },
  {
    id: 'general-standard',
    name: '일반 상품 표준',
    description: '기타 일반 상품용 기본 템플릿',
    category: 'other',
    baseServiceFeePercent: 8,
    additionalFees: [],
    shippingOptions: [
      {
        id: 'standard-general',
        name: '일반배송',
        description: '일반 택배 배송 (2-3일)',
        estimatedDays: 3,
        basePrice: 3000,
        trackingIncluded: true,
        insuranceIncluded: false,
        supportedRegions: ['전국']
      }
    ],
    terms: [
      '상품 불량 시 판매자와 직접 교환/환불이 진행됩니다',
      '배송비는 고객 부담입니다'
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0
  }
]

/**
 * 기본 결제 방법들
 */
const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: 'bank-transfer',
    type: 'bank_transfer',
    name: '무통장입금',
    description: '지정 계좌로 직접 입금',
    processingFee: 0,
    isAvailable: true,
    instructions: '입금자명을 주문번호-성함으로 입력해주세요'
  },
  {
    id: 'toss',
    type: 'toss',
    name: '토스페이',
    description: '토스 간편결제',
    processingFee: 0,
    isAvailable: true
  },
  {
    id: 'kakao-pay',
    type: 'kakao_pay',
    name: '카카오페이',
    description: '카카오페이 간편결제',
    processingFee: 0,
    isAvailable: true
  }
]

/**
 * 상품 카테고리 자동 감지
 */
function detectProductCategory(title: string, seller?: string): ProductCategory {
  const titleLower = title.toLowerCase()
  const sellerLower = seller?.toLowerCase() || ''
  
  // 전자제품 키워드
  if (titleLower.includes('아이폰') || titleLower.includes('갤럭시') || 
      titleLower.includes('노트북') || titleLower.includes('컴퓨터') ||
      titleLower.includes('헤드폰') || titleLower.includes('이어폰') ||
      titleLower.includes('tv') || titleLower.includes('모니터')) {
    return 'electronics'
  }
  
  // 패션 키워드
  if (titleLower.includes('티셔츠') || titleLower.includes('바지') ||
      titleLower.includes('신발') || titleLower.includes('가방') ||
      titleLower.includes('자켓') || titleLower.includes('드레스')) {
    return 'fashion'
  }
  
  // 뷰티 키워드
  if (titleLower.includes('화장품') || titleLower.includes('스킨케어') ||
      titleLower.includes('메이크업') || titleLower.includes('향수')) {
    return 'beauty'
  }
  
  // 홈리빙 키워드
  if (titleLower.includes('침구') || titleLower.includes('가구') ||
      titleLower.includes('인테리어') || titleLower.includes('주방')) {
    return 'home_living'
  }
  
  return 'other'
}

/**
 * 견적서 생성
 */
export async function createDetailedQuotation(
  request: BuyForMeRequest,
  adminId: string,
  options: CreateQuotationRequest
): Promise<DetailedQuotation> {
  
  // 1. 실시간 가격 확인
  const priceVerification = options.priceVerification || 
    await verifyProductPrice(request.productInfo.originalUrl, {
      id: request.hotdealId || request.id,
      title: request.productInfo.title,
      price: request.productInfo.discountedPrice.toString(),
      originalPrice: request.productInfo.originalPrice.toString(),
      productUrl: request.productInfo.originalUrl,
      seller: request.productInfo.siteName
    } as any)
  
  // 2. 상품 카테고리 감지 및 템플릿 선택
  const category = detectProductCategory(request.productInfo.title, request.productInfo.siteName)
  const template = getTemplateByCategory(category)
  
  // 3. 가격 계산
  const verifiedPrice = priceVerification.currentPrice || request.productInfo.discountedPrice
  const productCost = verifiedPrice * request.quantity
  const serviceFee = Math.round(productCost * (template.baseServiceFeePercent / 100))
  
  // 4. 추가 수수료 계산
  const additionalFees = template.additionalFees.map(fee => ({
    name: fee.name,
    amount: fee.type === 'percentage' ? Math.round(productCost * (fee.amount / 100)) : fee.amount,
    description: fee.description
  }))
  
  // 5. 배송비 계산
  const selectedShipping = template.shippingOptions[0] // 기본 배송 옵션
  const shippingCost = selectedShipping.basePrice
  
  // 6. 총액 계산
  const additionalFeesTotal = additionalFees.reduce((sum, fee) => sum + fee.amount, 0)
  const subtotal = productCost + serviceFee + additionalFeesTotal + shippingCost
  const totalAmount = subtotal
  
  // 7. 견적서 생성
  const quotation: DetailedQuotation = {
    id: generateQuotationId(),
    requestId: request.id,
    adminId,
    templateId: template.id,
    status: 'draft',
    
    productInfo: {
      title: request.productInfo.title,
      verifiedPrice,
      originalEstimate: request.productInfo.discountedPrice,
      priceVerification,
      quantity: request.quantity,
      options: request.productOptions,
      imageUrl: request.productInfo.imageUrl,
      productUrl: request.productInfo.originalUrl,
      seller: request.productInfo.siteName
    },
    
    pricing: {
      productCost,
      serviceFee,
      serviceFeePercent: template.baseServiceFeePercent,
      additionalFees,
      domesticShipping: shippingCost,
      subtotal,
      totalAmount
    },
    
    shipping: {
      selectedOption: selectedShipping,
      estimatedDelivery: new Date(Date.now() + selectedShipping.estimatedDays * 24 * 60 * 60 * 1000),
      trackingIncluded: selectedShipping.trackingIncluded,
      insuranceValue: selectedShipping.insuranceIncluded ? Math.min(productCost, 100000) : undefined
    },
    
    payment: {
      methods: defaultPaymentMethods.filter(method => method.isAvailable),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
      currency: 'KRW'
    },
    
    metadata: {
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일간 유효
      notes: options.notes,
      riskLevel: calculateRiskLevel(priceVerification, productCost),
      complexityScore: calculateComplexityScore(request),
      estimatedProcessingTime: calculateProcessingTime(category, productCost)
    },
    
    history: [{
      id: generateHistoryId(),
      action: 'created',
      userId: adminId,
      userType: 'admin',
      details: '견적서가 생성되었습니다',
      timestamp: new Date()
    }],
    
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  return quotation
}

/**
 * 견적서 업데이트
 */
export function updateQuotation(
  quotation: DetailedQuotation,
  updates: UpdateQuotationRequest,
  adminId: string
): DetailedQuotation {
  const updated = { ...quotation }
  
  // 가격 정보 업데이트
  if (updates.pricing) {
    updated.pricing = { ...updated.pricing, ...updates.pricing }
    // 총액 재계산
    const { productCost, serviceFee, domesticShipping } = updated.pricing
    const additionalFeesTotal = updated.pricing.additionalFees.reduce((sum, fee) => sum + fee.amount, 0)
    updated.pricing.subtotal = productCost + serviceFee + additionalFeesTotal + (domesticShipping || 0)
    updated.pricing.totalAmount = updated.pricing.subtotal
  }
  
  // 배송 정보 업데이트
  if (updates.shipping) {
    updated.shipping = { ...updated.shipping, ...updates.shipping }
  }
  
  // 메타데이터 업데이트
  if (updates.notes) {
    updated.metadata.notes = updates.notes
  }
  
  if (updates.validUntil) {
    updated.metadata.validUntil = updates.validUntil
  }
  
  // 이력 추가
  updated.history.push({
    id: generateHistoryId(),
    action: 'updated',
    userId: adminId,
    userType: 'admin',
    details: '견적서가 수정되었습니다',
    previousData: quotation,
    timestamp: new Date()
  })
  
  updated.updatedAt = new Date()
  
  return updated
}

/**
 * 견적서 발송
 */
export function sendQuotation(quotation: DetailedQuotation, adminId: string): DetailedQuotation {
  const updated = { ...quotation }
  updated.status = 'sent'
  updated.sentAt = new Date()
  
  updated.history.push({
    id: generateHistoryId(),
    action: 'sent',
    userId: adminId,
    userType: 'admin',
    details: '견적서가 고객에게 발송되었습니다',
    timestamp: new Date()
  })
  
  updated.updatedAt = new Date()
  
  return updated
}

/**
 * 견적서 검증
 */
export function validateQuotation(quotation: DetailedQuotation): QuotationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []
  
  // 필수 정보 확인
  if (!quotation.productInfo.verifiedPrice) {
    errors.push('상품 가격이 확인되지 않았습니다')
  }
  
  if (!quotation.pricing.totalAmount || quotation.pricing.totalAmount <= 0) {
    errors.push('총 결제 금액이 올바르지 않습니다')
  }
  
  if (!quotation.shipping.selectedOption) {
    errors.push('배송 옵션이 선택되지 않았습니다')
  }
  
  // 가격 정확성 확인
  const priceDeviation = Math.abs(quotation.productInfo.verifiedPrice - quotation.productInfo.originalEstimate)
  const deviationPercent = (priceDeviation / quotation.productInfo.originalEstimate) * 100
  
  if (deviationPercent > 10) {
    warnings.push(`예상 가격과 실제 가격의 차이가 ${deviationPercent.toFixed(1)}%입니다`)
  }
  
  if (deviationPercent > 20) {
    errors.push('가격 차이가 너무 큽니다. 고객에게 별도 안내가 필요합니다')
  }
  
  // 서비스 수수료 확인
  const expectedServiceFee = Math.round(quotation.pricing.productCost * 0.08)
  if (Math.abs(quotation.pricing.serviceFee - expectedServiceFee) > 1000) {
    warnings.push('서비스 수수료가 표준(8%)과 다릅니다')
  }
  
  // 배송비 확인
  if (quotation.pricing.domesticShipping > 10000) {
    warnings.push('배송비가 평균보다 높습니다')
  }
  
  // 제안사항
  if (quotation.pricing.productCost > 100000 && !quotation.shipping.insuranceValue) {
    suggestions.push('고가 상품이므로 배송 보험 추가를 고려해보세요')
  }
  
  if (quotation.metadata.riskLevel === 'high') {
    suggestions.push('위험도가 높은 주문입니다. 고객에게 별도 안내를 권장합니다')
  }
  
  // 신뢰도 점수 계산
  let confidenceScore = 100
  confidenceScore -= errors.length * 20
  confidenceScore -= warnings.length * 10
  confidenceScore = Math.max(0, Math.min(100, confidenceScore))
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    confidenceScore
  }
}

/**
 * 헬퍼 함수들
 */
function getTemplateByCategory(category: ProductCategory): QuotationTemplate {
  return defaultTemplates.find(t => t.category === category) || defaultTemplates[2] // 일반 템플릿
}

function calculateRiskLevel(priceVerification: PriceCheckResult, productCost: number): 'low' | 'medium' | 'high' {
  if (!priceVerification.success) return 'high'
  if (priceVerification.availability === 'out_of_stock') return 'high'
  if (productCost > 500000) return 'medium'
  if (priceVerification.availability === 'limited') return 'medium'
  return 'low'
}

function calculateComplexityScore(request: BuyForMeRequest): number {
  let score = 1
  
  // 옵션 복잡도
  if (request.productOptions && request.productOptions.length > 20) score += 1
  
  // 특별 요청사항 복잡도
  if (request.specialRequests && request.specialRequests.length > 50) score += 1
  
  // 수량
  if (request.quantity > 5) score += 1
  
  // 가격대
  if (request.productInfo.discountedPrice > 100000) score += 1
  
  return Math.min(5, score)
}

function calculateProcessingTime(category: ProductCategory, productCost: number): number {
  let baseTime = 2 // 기본 2시간
  
  // 카테고리별 추가 시간
  if (category === 'electronics') baseTime += 1
  
  // 가격대별 추가 시간
  if (productCost > 100000) baseTime += 1
  if (productCost > 500000) baseTime += 2
  
  return baseTime
}

function generateQuotationId(): string {
  return `QUOTE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
}

function generateHistoryId(): string {
  return `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
}

/**
 * 견적서 통계 계산
 */
export function calculateQuotationStats(quotations: DetailedQuotation[]): QuotationStats {
  const total = quotations.length
  const approved = quotations.filter(q => q.status === 'approved').length
  
  const processingTimes = quotations
    .filter(q => q.sentAt && q.createdAt)
    .map(q => (q.sentAt!.getTime() - q.createdAt.getTime()) / (1000 * 60 * 60)) // hours
  
  const orderValues = quotations.map(q => q.pricing.totalAmount)
  
  return {
    totalQuotations: total,
    approvalRate: total > 0 ? (approved / total) * 100 : 0,
    averageProcessingTime: processingTimes.length > 0 ? 
      processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0,
    averageOrderValue: orderValues.length > 0 ?
      orderValues.reduce((a, b) => a + b, 0) / orderValues.length : 0,
    topCategories: [],
    priceAccuracy: {
      averageDeviation: 0,
      underestimatedCount: 0,
      overestimatedCount: 0
    }
  }
}