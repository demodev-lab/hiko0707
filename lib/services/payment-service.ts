import { 
  PaymentRequest, 
  Payment, 
  PaymentMethod, 
  PaymentStatus, 
  PaymentProvider,
  PaymentConfig,
  calculatePaymentFees,
  canProcessPayment
} from '@/types/payment'

export class PaymentService {
  private config: PaymentConfig
  private static instance: PaymentService

  constructor(config: PaymentConfig) {
    this.config = config
  }

  static getInstance(config?: PaymentConfig): PaymentService {
    if (!PaymentService.instance) {
      if (!config) {
        throw new Error('PaymentService configuration required')
      }
      PaymentService.instance = new PaymentService(config)
    }
    return PaymentService.instance
  }

  // 결제 요청 생성
  async createPaymentRequest(data: Omit<PaymentRequest, 'id' | 'createdAt'>): Promise<PaymentRequest> {
    const paymentRequest: PaymentRequest = {
      ...data,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }

    return paymentRequest
  }

  // 결제 처리
  async processPayment(paymentRequest: PaymentRequest): Promise<Payment> {
    const { provider, amount, paymentMethodId } = paymentRequest

    try {
      // 결제 방법 검증
      const paymentMethod = await this.getPaymentMethod(paymentMethodId)
      const validation = canProcessPayment(amount, paymentRequest.currency, paymentMethod)
      
      if (!validation.canProcess) {
        throw new Error(validation.reason)
      }

      // 수수료 계산
      const { fees, netAmount } = calculatePaymentFees(amount, paymentMethod)

      // 외부 결제 시스템 호출
      const externalResult = await this.callExternalPaymentProvider(provider, {
        amount,
        currency: paymentRequest.currency,
        orderId: paymentRequest.orderId,
        customerInfo: paymentRequest.customerInfo,
        returnUrl: paymentRequest.returnUrl,
        cancelUrl: paymentRequest.cancelUrl,
        webhookUrl: paymentRequest.webhookUrl,
        metadata: paymentRequest.metadata
      })

      // 결제 객체 생성
      const payment: Payment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentRequestId: paymentRequest.id,
        orderId: paymentRequest.orderId,
        userId: paymentRequest.userId,
        amount,
        currency: paymentRequest.currency,
        provider,
        paymentMethodId,
        status: externalResult.status,
        externalTransactionId: externalResult.transactionId,
        externalPaymentId: externalResult.paymentId,
        paidAmount: externalResult.status === 'completed' ? amount : undefined,
        fees,
        netAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
        paidAt: externalResult.status === 'completed' ? new Date() : undefined,
        metadata: paymentRequest.metadata
      }

      return payment
    } catch (error) {
      // 실패한 결제 객체 생성
      const failedPayment: Payment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentRequestId: paymentRequest.id,
        orderId: paymentRequest.orderId,
        userId: paymentRequest.userId,
        amount,
        currency: paymentRequest.currency,
        provider,
        paymentMethodId,
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
        updatedAt: new Date(),
        failedAt: new Date(),
        metadata: paymentRequest.metadata
      }

      throw new PaymentError(failedPayment, error instanceof Error ? error.message : 'Payment failed')
    }
  }

  // 결제 취소
  async cancelPayment(paymentId: string, reason: string): Promise<Payment> {
    try {
      const payment = await this.getPayment(paymentId)
      
      if (payment.status !== 'pending' && payment.status !== 'processing') {
        throw new Error('Cannot cancel payment with current status')
      }

      // 외부 결제 시스템에서 취소
      if (payment.externalTransactionId) {
        await this.callExternalCancelPayment(payment.provider, payment.externalTransactionId)
      }

      const updatedPayment: Payment = {
        ...payment,
        status: 'cancelled',
        cancelReason: reason,
        updatedAt: new Date(),
        cancelledAt: new Date()
      }

      return updatedPayment
    } catch (error) {
      throw new Error(`Payment cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 환불 처리
  async refundPayment(paymentId: string, amount: number, reason: string): Promise<Payment> {
    try {
      const payment = await this.getPayment(paymentId)
      
      if (payment.status !== 'completed') {
        throw new Error('Cannot refund uncompleted payment')
      }

      if (amount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount')
      }

      // 외부 결제 시스템에서 환불
      if (payment.externalTransactionId) {
        await this.callExternalRefundPayment(payment.provider, payment.externalTransactionId, amount)
      }

      const updatedPayment: Payment = {
        ...payment,
        status: 'refunded',
        refundAmount: amount,
        refundReason: reason,
        updatedAt: new Date(),
        refundedAt: new Date()
      }

      return updatedPayment
    } catch (error) {
      throw new Error(`Payment refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 결제 상태 업데이트 (웹훅용)
  async updatePaymentStatus(externalTransactionId: string, status: PaymentStatus, metadata?: Record<string, any>): Promise<Payment> {
    try {
      const payment = await this.getPaymentByExternalId(externalTransactionId)
      
      const updatedPayment: Payment = {
        ...payment,
        status,
        updatedAt: new Date(),
        metadata: { ...payment.metadata, ...metadata }
      }

      // 상태에 따른 타임스탬프 설정
      switch (status) {
        case 'completed':
          updatedPayment.paidAt = new Date()
          break
        case 'failed':
          updatedPayment.failedAt = new Date()
          break
        case 'cancelled':
          updatedPayment.cancelledAt = new Date()
          break
        case 'refunded':
          updatedPayment.refundedAt = new Date()
          break
      }

      return updatedPayment
    } catch (error) {
      throw new Error(`Payment status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 외부 결제 시스템 호출 (실제 구현 시 각 프로바이더별로 분리)
  private async callExternalPaymentProvider(provider: PaymentProvider, data: any): Promise<any> {
    const config = this.config.providers[provider]
    if (!config) {
      throw new Error(`Payment provider ${provider} not configured`)
    }

    // 실제 구현에서는 각 프로바이더의 API를 호출
    switch (provider) {
      case 'card':
        return this.callCardPaymentAPI(data, config)
      case 'kakao_pay':
        return this.callKakaoPayAPI(data, config)
      case 'naver_pay':
        return this.callNaverPayAPI(data, config)
      case 'toss_pay':
        return this.callTossPayAPI(data, config)
      case 'paypal':
        return this.callPayPalAPI(data, config)
      case 'alipay':
        return this.callAlipayAPI(data, config)
      case 'wechat_pay':
        return this.callWeChatPayAPI(data, config)
      case 'bank_transfer':
        return this.callBankTransferAPI(data, config)
      default:
        throw new Error(`Unsupported payment provider: ${provider}`)
    }
  }

  // 개별 결제 프로바이더 API 호출 메서드들 (예시)
  private async callCardPaymentAPI(data: any, config: any): Promise<any> {
    // 신용카드 결제 API 호출 시뮬레이션
    // 데모용으로 2초 후 성공 처리
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      status: 'completed' as PaymentStatus,
      transactionId: `card_${Date.now()}`,
      paymentId: `card_pay_${Date.now()}`
    }
  }

  private async callKakaoPayAPI(data: any, config: any): Promise<any> {
    // 카카오페이 API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return {
      status: 'completed' as PaymentStatus,
      transactionId: `kakao_${Date.now()}`,
      paymentId: `kakao_pay_${Date.now()}`
    }
  }

  private async callNaverPayAPI(data: any, config: any): Promise<any> {
    // 네이버페이 API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return {
      status: 'completed' as PaymentStatus,
      transactionId: `naver_${Date.now()}`,
      paymentId: `naver_pay_${Date.now()}`
    }
  }

  private async callTossPayAPI(data: any, config: any): Promise<any> {
    // 토스페이 API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return {
      status: 'completed' as PaymentStatus,
      transactionId: `toss_${Date.now()}`,
      paymentId: `toss_pay_${Date.now()}`
    }
  }

  private async callPayPalAPI(data: any, config: any): Promise<any> {
    // PayPal API 호출
    return {
      status: 'processing' as PaymentStatus,
      transactionId: `paypal_${Date.now()}`,
      paymentId: `paypal_pay_${Date.now()}`
    }
  }

  private async callAlipayAPI(data: any, config: any): Promise<any> {
    // Alipay API 호출
    return {
      status: 'processing' as PaymentStatus,
      transactionId: `alipay_${Date.now()}`,
      paymentId: `alipay_pay_${Date.now()}`
    }
  }

  private async callWeChatPayAPI(data: any, config: any): Promise<any> {
    // WeChat Pay API 호출
    return {
      status: 'processing' as PaymentStatus,
      transactionId: `wechat_${Date.now()}`,
      paymentId: `wechat_pay_${Date.now()}`
    }
  }

  private async callBankTransferAPI(data: any, config: any): Promise<any> {
    // 계좌이체 API 호출
    return {
      status: 'pending' as PaymentStatus,
      transactionId: `bank_${Date.now()}`,
      paymentId: `bank_pay_${Date.now()}`
    }
  }

  // 취소 API 호출
  private async callExternalCancelPayment(provider: PaymentProvider, externalTransactionId: string): Promise<void> {
    const config = this.config.providers[provider]
    if (!config) {
      throw new Error(`Payment provider ${provider} not configured`)
    }

    // 실제 구현에서는 각 프로바이더의 취소 API를 호출
    console.log(`Cancelling payment ${externalTransactionId} via ${provider}`)
  }

  // 환불 API 호출
  private async callExternalRefundPayment(provider: PaymentProvider, externalTransactionId: string, amount: number): Promise<void> {
    const config = this.config.providers[provider]
    if (!config) {
      throw new Error(`Payment provider ${provider} not configured`)
    }

    // 실제 구현에서는 각 프로바이더의 환불 API를 호출
    console.log(`Refunding payment ${externalTransactionId} amount ${amount} via ${provider}`)
  }

  // 헬퍼 메서드들 (실제로는 Repository에서 구현)
  private async getPayment(paymentId: string): Promise<Payment> {
    // 실제로는 PaymentRepository에서 조회
    throw new Error('Not implemented - should use PaymentRepository')
  }

  private async getPaymentByExternalId(externalTransactionId: string): Promise<Payment> {
    // 실제로는 PaymentRepository에서 조회
    throw new Error('Not implemented - should use PaymentRepository')
  }

  private async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    // 실제로는 PaymentMethodRepository에서 조회
    // 임시로 기본값 반환
    return {
      id: paymentMethodId,
      provider: 'card',
      name: 'Credit Card',
      isActive: true,
      supportedCurrencies: ['KRW', 'USD'],
      processingTimeMinutes: 5,
      fees: {
        percentage: 2.5,
        fixed: 500
      }
    }
  }

  // 사용 가능한 결제 방법 조회
  async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    // 실제로는 Repository에서 조회하거나 설정에서 가져옴
    return [
      {
        id: 'card',
        provider: 'card',
        name: '신용카드',
        description: 'Visa, MasterCard, JCB 등',
        isActive: true,
        supportedCurrencies: ['KRW', 'USD'],
        processingTimeMinutes: 5,
        fees: { percentage: 2.5, fixed: 500 }
      },
      {
        id: 'kakao_pay',
        provider: 'kakao_pay',
        name: '카카오페이',
        description: '간편하고 안전한 카카오페이',
        isActive: true,
        supportedCurrencies: ['KRW'],
        processingTimeMinutes: 1,
        fees: { percentage: 2.0 }
      },
      {
        id: 'naver_pay',
        provider: 'naver_pay',
        name: '네이버페이',
        description: '네이버페이로 간편결제',
        isActive: true,
        supportedCurrencies: ['KRW'],
        processingTimeMinutes: 1,
        fees: { percentage: 2.0 }
      },
      {
        id: 'toss_pay',
        provider: 'toss_pay',
        name: '토스페이',
        description: '토스로 간편결제',
        isActive: true,
        supportedCurrencies: ['KRW'],
        processingTimeMinutes: 1,
        fees: { percentage: 1.8 }
      },
      {
        id: 'paypal',
        provider: 'paypal',
        name: 'PayPal',
        description: '전 세계에서 사용 가능한 PayPal',
        isActive: true,
        supportedCurrencies: ['USD', 'EUR', 'KRW'],
        processingTimeMinutes: 10,
        fees: { percentage: 3.5, fixed: 1000 }
      },
      {
        id: 'alipay',
        provider: 'alipay',
        name: 'Alipay',
        description: '중국 최대 모바일 결제',
        isActive: true,
        supportedCurrencies: ['CNY', 'USD'],
        processingTimeMinutes: 5,
        fees: { percentage: 2.8 }
      },
      {
        id: 'wechat_pay',
        provider: 'wechat_pay',
        name: 'WeChat Pay',
        description: '위챗페이로 간편결제',
        isActive: true,
        supportedCurrencies: ['CNY', 'USD'],
        processingTimeMinutes: 5,
        fees: { percentage: 2.8 }
      },
      {
        id: 'bank_transfer',
        provider: 'bank_transfer',
        name: '계좌이체',
        description: '한국 은행 계좌이체',
        isActive: true,
        supportedCurrencies: ['KRW'],
        minAmount: 10000,
        maxAmount: 50000000,
        processingTimeMinutes: 1440, // 24시간
        fees: { fixed: 1000 }
      }
    ]
  }
}

// 결제 에러 클래스
export class PaymentError extends Error {
  public payment: Payment

  constructor(payment: Payment, message: string) {
    super(message)
    this.name = 'PaymentError'
    this.payment = payment
  }
}

// 기본 결제 서비스 설정
const defaultConfig: PaymentConfig = {
  providers: {
    card: {
      apiKey: process.env.CARD_API_KEY || '',
      secretKey: process.env.CARD_SECRET_KEY || '',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production'
    },
    kakao_pay: {
      apiKey: process.env.KAKAO_PAY_API_KEY || '',
      secretKey: process.env.KAKAO_PAY_SECRET_KEY || '',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production'
    },
    naver_pay: {
      apiKey: process.env.NAVER_PAY_API_KEY || '',
      secretKey: process.env.NAVER_PAY_SECRET_KEY || '',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production'
    },
    toss_pay: {
      apiKey: process.env.TOSS_PAY_API_KEY || '',
      secretKey: process.env.TOSS_PAY_SECRET_KEY || '',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production'
    },
    paypal: {
      apiKey: process.env.PAYPAL_CLIENT_ID || '',
      secretKey: process.env.PAYPAL_CLIENT_SECRET || '',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production'
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const paymentService = PaymentService.getInstance(defaultConfig)