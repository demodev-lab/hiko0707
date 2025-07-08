export type PaymentStatus = 
  | 'pending'     // 결제 대기
  | 'processing'  // 결제 처리 중
  | 'completed'   // 결제 완료
  | 'failed'      // 결제 실패
  | 'cancelled'   // 결제 취소
  | 'refunded'    // 환불 완료

export type PaymentProvider = 
  | 'card'         // 신용카드
  | 'bank_transfer' // 계좌이체
  | 'paypal'       // PayPal
  | 'alipay'       // Alipay
  | 'wechat_pay'   // WeChat Pay
  | 'kakao_pay'    // 카카오페이
  | 'naver_pay'    // 네이버페이
  | 'toss_pay'     // 토스페이

export interface PaymentMethod {
  id: string
  provider: PaymentProvider
  name: string
  description?: string
  isActive: boolean
  supportedCurrencies: string[]
  minAmount?: number
  maxAmount?: number
  processingTimeMinutes: number
  fees: {
    percentage?: number  // 수수료 비율 (%)
    fixed?: number      // 고정 수수료 (원)
  }
}

export interface PaymentRequest {
  id: string
  orderId: string
  userId: string
  amount: number
  currency: string
  provider: PaymentProvider
  paymentMethodId: string
  
  // 결제 상세 정보
  description: string
  customerInfo: {
    name: string
    email: string
    phone?: string
  }
  
  // 결제 옵션
  returnUrl?: string
  cancelUrl?: string
  webhookUrl?: string
  
  // 메타데이터
  metadata?: Record<string, any>
  
  // 타임스탬프
  createdAt: Date
  expiresAt?: Date
}

export interface Payment {
  id: string
  paymentRequestId: string
  orderId: string
  userId: string
  
  // 결제 정보
  amount: number
  currency: string
  provider: PaymentProvider
  paymentMethodId: string
  
  // 상태 정보
  status: PaymentStatus
  
  // 외부 결제 시스템 정보
  externalTransactionId?: string
  externalPaymentId?: string
  
  // 결제 상세 내역
  paidAmount?: number
  fees?: number
  netAmount?: number
  
  // 실패/취소 정보
  failureReason?: string
  cancelReason?: string
  
  // 환불 정보
  refundAmount?: number
  refundReason?: string
  
  // 타임스탬프
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
  failedAt?: Date
  cancelledAt?: Date
  refundedAt?: Date
  
  // 메타데이터
  metadata?: Record<string, any>
}

export interface PaymentFormData {
  paymentMethod: PaymentProvider
  
  // 카드 결제
  cardInfo?: {
    number: string
    expiryMonth: string
    expiryYear: string
    cvc: string
    holderName: string
  }
  
  // 계좌이체
  bankInfo?: {
    bankCode: string
    accountNumber: string
    holderName: string
  }
  
  // 간편결제는 별도 인증 과정
  
  // 동의 사항
  agreements: {
    terms: boolean
    privacy: boolean
    payment: boolean
  }
}

export interface PaymentConfig {
  providers: {
    [K in PaymentProvider]?: {
      apiKey: string
      secretKey: string
      merchantId?: string
      environment: 'sandbox' | 'production'
      webhookSecret?: string
    }
  }
}

// 결제 수수료 계산
export function calculatePaymentFees(
  amount: number, 
  paymentMethod: PaymentMethod
): { fees: number; netAmount: number } {
  let fees = 0
  
  if (paymentMethod.fees.percentage) {
    fees += Math.round(amount * (paymentMethod.fees.percentage / 100))
  }
  
  if (paymentMethod.fees.fixed) {
    fees += paymentMethod.fees.fixed
  }
  
  return {
    fees,
    netAmount: amount - fees
  }
}

// 결제 가능 여부 확인
export function canProcessPayment(
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod
): { canProcess: boolean; reason?: string } {
  if (!paymentMethod.isActive) {
    return { canProcess: false, reason: '현재 사용할 수 없는 결제 방법입니다.' }
  }
  
  if (!paymentMethod.supportedCurrencies.includes(currency)) {
    return { canProcess: false, reason: '지원하지 않는 통화입니다.' }
  }
  
  if (paymentMethod.minAmount && amount < paymentMethod.minAmount) {
    return { 
      canProcess: false, 
      reason: `최소 결제 금액은 ${paymentMethod.minAmount.toLocaleString()}원입니다.` 
    }
  }
  
  if (paymentMethod.maxAmount && amount > paymentMethod.maxAmount) {
    return { 
      canProcess: false, 
      reason: `최대 결제 금액은 ${paymentMethod.maxAmount.toLocaleString()}원입니다.` 
    }
  }
  
  return { canProcess: true }
}