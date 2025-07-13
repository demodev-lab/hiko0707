/**
 * Quotation System Types
 * 견적서 시스템 타입 정의
 */

import { BuyForMeRequest } from './buy-for-me'
import { PriceCheckResult } from '@/lib/services/price-verification'

export interface QuotationTemplate {
  id: string
  name: string
  description: string
  category: ProductCategory
  baseServiceFeePercent: number
  additionalFees: QuotationFee[]
  shippingOptions: ShippingOption[]
  terms: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  usageCount: number
}

export interface QuotationFee {
  id: string
  name: string
  description: string
  type: 'fixed' | 'percentage' | 'conditional'
  amount: number
  condition?: string
  isOptional: boolean
  category: 'service' | 'shipping' | 'insurance' | 'customs' | 'other'
}

export interface ShippingOption {
  id: string
  name: string
  description: string
  estimatedDays: number
  basePrice: number
  weightMultiplier?: number
  freeShippingThreshold?: number
  trackingIncluded: boolean
  insuranceIncluded: boolean
  supportedRegions: string[]
}

export interface DetailedQuotation {
  id: string
  requestId: string
  adminId: string
  templateId?: string
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
  
  // 상품 정보
  productInfo: {
    title: string
    verifiedPrice: number
    originalEstimate: number
    priceVerification: PriceCheckResult
    quantity: number
    options?: string
    imageUrl?: string
    productUrl: string
    seller: string
  }
  
  // 비용 계산
  pricing: {
    productCost: number
    serviceFee: number
    serviceFeePercent: number
    additionalFees: Array<{
      name: string
      amount: number
      description: string
    }>
    domesticShipping: number
    internationalShipping?: number
    insurance?: number
    taxes?: number
    subtotal: number
    totalAmount: number
  }
  
  // 배송 정보
  shipping: {
    selectedOption: ShippingOption
    estimatedDelivery: Date
    trackingIncluded: boolean
    insuranceValue?: number
  }
  
  // 결제 정보
  payment: {
    methods: PaymentMethod[]
    dueDate: Date
    currency: 'KRW' | 'USD'
    exchangeRate?: number
  }
  
  // 견적서 메타데이터
  metadata: {
    validUntil: Date
    notes?: string
    internalNotes?: string
    riskLevel: 'low' | 'medium' | 'high'
    complexityScore: number
    estimatedProcessingTime: number
  }
  
  // 이력
  history: QuotationHistory[]
  
  createdAt: Date
  updatedAt: Date
  sentAt?: Date
  respondedAt?: Date
}

export interface QuotationHistory {
  id: string
  action: 'created' | 'updated' | 'sent' | 'approved' | 'rejected' | 'expired' | 'price_updated'
  userId: string
  userType: 'admin' | 'customer'
  details: string
  previousData?: Partial<DetailedQuotation>
  timestamp: Date
}

export interface PaymentMethod {
  id: string
  type: 'credit_card' | 'bank_transfer' | 'paypal' | 'toss' | 'kakao_pay'
  name: string
  description: string
  processingFee?: number
  isAvailable: boolean
  instructions?: string
}

export type ProductCategory = 
  | 'electronics'
  | 'fashion'
  | 'home_living'
  | 'beauty'
  | 'sports'
  | 'books'
  | 'food'
  | 'toys'
  | 'automotive'
  | 'other'

export interface QuotationStats {
  totalQuotations: number
  approvalRate: number
  averageProcessingTime: number
  averageOrderValue: number
  topCategories: Array<{
    category: ProductCategory
    count: number
    value: number
  }>
  priceAccuracy: {
    averageDeviation: number
    underestimatedCount: number
    overestimatedCount: number
  }
}

export interface AutoQuoteConfig {
  enabled: boolean
  maxOrderValue: number
  allowedCategories: ProductCategory[]
  autoApprovalThreshold: number
  requiresManualReview: boolean
  priceTolerancePercent: number
}

export interface QuotationValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  confidenceScore: number
}

// 견적서 생성 요청 타입
export interface CreateQuotationRequest {
  requestId: string
  templateId?: string
  priceVerification: PriceCheckResult
  customFees?: QuotationFee[]
  notes?: string
  expedited?: boolean
}

// 견적서 업데이트 요청 타입
export interface UpdateQuotationRequest {
  quotationId: string
  pricing?: Partial<DetailedQuotation['pricing']>
  shipping?: Partial<DetailedQuotation['shipping']>
  notes?: string
  validUntil?: Date
}