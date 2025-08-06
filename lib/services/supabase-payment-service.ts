import { supabaseAdmin } from '@/lib/supabase/client'
import type { PaymentRow, PaymentInsert, PaymentUpdate } from '@/lib/types/supabase'

/**
 * Supabase 결제 서비스
 * payments 테이블 관리
 */
export class SupabasePaymentService {
  /**
   * 새로운 결제 기록 생성
   */
  static async createPayment(paymentData: Omit<PaymentInsert, 'created_at' | 'updated_at'>): Promise<PaymentRow | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }
    
    const insertData: PaymentInsert = {
      ...paymentData,
      status: paymentData.status || 'pending',
      currency: paymentData.currency || 'KRW',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('payments')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('결제 기록 생성 실패:', error)
      return null
    }

    return data
  }

  /**
   * 결제 상태 업데이트
   */
  static async updatePaymentStatus(
    paymentId: string, 
    status: string, 
    externalPaymentId?: string,
    paidAt?: string
  ): Promise<PaymentRow | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    const updateData: PaymentUpdate = {
      status,
      updated_at: new Date().toISOString()
    }

    if (externalPaymentId) {
      updateData.external_payment_id = externalPaymentId
    }

    if (paidAt) {
      updateData.paid_at = paidAt
    } else if (status === 'completed' || status === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single()

    if (error) {
      console.error('결제 상태 업데이트 실패:', error)
      return null
    }

    return data
  }

  /**
   * 주문별 결제 목록 조회
   */
  static async getPaymentsByRequest(requestId: string): Promise<PaymentRow[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        proxy_purchases_request:request_id (
          id,
          order_number,
          status
        ),
        users:user_id (
          id,
          name,
          email
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('주문별 결제 목록 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 사용자별 결제 목록 조회
   */
  static async getPaymentsByUser(userId: string, options?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<PaymentRow[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }

    let query = supabase
      .from('payments')
      .select(`
        *,
        proxy_purchases_request:request_id (
          id,
          order_number,
          status,
          hot_deals:hot_deal_id (
            id,
            title,
            image_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('사용자별 결제 목록 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 결제 ID로 결제 정보 조회
   */
  static async getPaymentById(paymentId: string): Promise<PaymentRow | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        proxy_purchases_request:request_id (
          id,
          order_number,
          status,
          quantity,
          option,
          special_requests,
          hot_deals:hot_deal_id (
            id,
            title,
            description,
            image_url,
            sale_price,
            original_price,
            source
          ),
          shipping_address:shipping_address_id (
            id,
            name,
            address,
            address_detail,
            phone,
            post_code
          )
        ),
        users:user_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', paymentId)
      .single()

    if (error) {
      console.error('결제 정보 조회 실패:', error)
      return null
    }

    return data
  }

  /**
   * 외부 결제 ID로 결제 정보 조회
   */
  static async getPaymentByExternalId(externalPaymentId: string): Promise<PaymentRow | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('external_payment_id', externalPaymentId)
      .single()

    if (error) {
      console.error('외부 결제 ID로 결제 정보 조회 실패:', error)
      return null
    }

    return data
  }

  /**
   * 결제 정보 업데이트
   */
  static async updatePayment(paymentId: string, updates: PaymentUpdate): Promise<PaymentRow | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    const updateData: PaymentUpdate = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // undefined 값 제거
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof PaymentUpdate] === undefined) {
        delete updateData[key as keyof PaymentUpdate]
      }
    })

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single()

    if (error) {
      console.error('결제 업데이트 실패:', error)
      return null
    }

    return data
  }

  /**
   * 관리자용: 모든 결제 목록 조회
   */
  static async getAllPayments(options?: {
    status?: string
    payment_method?: string
    payment_gateway?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }): Promise<PaymentRow[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }

    let query = supabase
      .from('payments')
      .select(`
        *,
        proxy_purchases_request:request_id (
          id,
          order_number,
          status,
          hot_deals:hot_deal_id (
            id,
            title,
            source
          )
        ),
        users:user_id (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.payment_method) {
      query = query.eq('payment_method', options.payment_method)
    }

    if (options?.payment_gateway) {
      query = query.eq('payment_gateway', options.payment_gateway)
    }

    if (options?.start_date) {
      query = query.gte('created_at', options.start_date)
    }

    if (options?.end_date) {
      query = query.lte('created_at', options.end_date)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('전체 결제 목록 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 결제 통계 조회
   */
  static async getPaymentStats(options?: {
    start_date?: string
    end_date?: string
    user_id?: string
  }): Promise<{
    total_count: number
    total_amount: number
    completed_count: number
    completed_amount: number
    pending_count: number
    failed_count: number
    by_method: { [key: string]: { count: number; amount: number } }
    by_gateway: { [key: string]: { count: number; amount: number } }
  } | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    let query = supabase
      .from('payments')
      .select('status, amount, payment_method, payment_gateway')

    if (options?.start_date) {
      query = query.gte('created_at', options.start_date)
    }

    if (options?.end_date) {
      query = query.lte('created_at', options.end_date)
    }

    if (options?.user_id) {
      query = query.eq('user_id', options.user_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('결제 통계 조회 실패:', error)
      return null
    }

    const stats = {
      total_count: data?.length || 0,
      total_amount: 0,
      completed_count: 0,
      completed_amount: 0,
      pending_count: 0,
      failed_count: 0,
      by_method: {} as { [key: string]: { count: number; amount: number } },
      by_gateway: {} as { [key: string]: { count: number; amount: number } }
    }

    data?.forEach(payment => {
      stats.total_amount += payment.amount

      // 상태별 통계
      switch (payment.status) {
        case 'completed':
        case 'paid':
          stats.completed_count++
          stats.completed_amount += payment.amount
          break
        case 'pending':
          stats.pending_count++
          break
        case 'failed':
        case 'cancelled':
          stats.failed_count++
          break
      }

      // 결제 방법별 통계
      const method = payment.payment_method || 'unknown'
      if (!stats.by_method[method]) {
        stats.by_method[method] = { count: 0, amount: 0 }
      }
      stats.by_method[method].count++
      stats.by_method[method].amount += payment.amount

      // 결제 게이트웨이별 통계
      const gateway = payment.payment_gateway || 'unknown'
      if (!stats.by_gateway[gateway]) {
        stats.by_gateway[gateway] = { count: 0, amount: 0 }
      }
      stats.by_gateway[gateway].count++
      stats.by_gateway[gateway].amount += payment.amount
    })

    return stats
  }

  /**
   * 결제 환불 처리
   */
  static async processRefund(
    paymentId: string,
    refundAmount?: number,
    reason?: string
  ): Promise<PaymentRow | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    // 기존 결제 정보 조회
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (!payment) {
      console.error('결제 정보를 찾을 수 없습니다')
      return null
    }

    const actualRefundAmount = refundAmount || payment.amount

    const updateData: PaymentUpdate = {
      status: 'refunded',
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single()

    if (error) {
      console.error('환불 처리 실패:', error)
      return null
    }

    return data
  }

  /**
   * 사용 가능한 결제 방법 목록 조회
   * 현재는 하드코딩된 값을 반환하지만, 향후 system_settings 테이블에서 관리 예정
   */
  static async getAvailablePaymentMethods(): Promise<Array<{
    id: string
    provider: string
    name: string
    description: string
    isActive: boolean
    supportedCurrencies: string[]
    minAmount?: number
    maxAmount?: number
    processingTimeMinutes: number
    fees: { percentage?: number; fixed?: number }
  }>> {
    // TODO: 향후 system_settings 테이블에서 동적으로 관리
    // 현재는 기존 payment-service의 로직을 그대로 사용
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