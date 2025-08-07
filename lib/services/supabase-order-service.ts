import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/database.types'

// Supabase 테이블 타입 정의
type ProxyPurchaseRow = Database['public']['Tables']['proxy_purchases_request']['Row']
type ProxyPurchaseInsert = Database['public']['Tables']['proxy_purchases_request']['Insert']
type ProxyPurchaseUpdate = Database['public']['Tables']['proxy_purchases_request']['Update']

type OrderStatusHistoryRow = Database['public']['Tables']['order_status_history']['Row']
type OrderStatusHistoryInsert = Database['public']['Tables']['order_status_history']['Insert']

type ProxyPurchaseQuoteRow = Database['public']['Tables']['proxy_purchase_quotes']['Row']
type ProxyPurchaseQuoteInsert = Database['public']['Tables']['proxy_purchase_quotes']['Insert']
type ProxyPurchaseQuoteUpdate = Database['public']['Tables']['proxy_purchase_quotes']['Update']

/**
 * Supabase Buy-for-me (Proxy Purchase) 주문 서비스
 * proxy_purchases_request, order_status_history, proxy_purchase_quotes 테이블 관리
 */
export class SupabaseOrderService {
  /**
   * 새로운 Buy-for-me 주문 요청 생성
   */
  static async createOrder(orderData: Omit<ProxyPurchaseInsert, 'created_at' | 'updated_at' | 'order_number'>): Promise<ProxyPurchaseRow | null> {
    const supabaseClient = supabase()
    
    // 주문 번호 생성 (HIKO + YYYYMMDD + 4자리 랜덤)
    const orderNumber = `HIKO${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(1000 + Math.random() * 9000)}`
    
    const insertData: ProxyPurchaseInsert = {
      ...orderData,
      order_number: orderNumber,
      status: orderData.status || 'pending_review', // 테이블 기본값과 일치하도록 수정
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseClient
      .from('proxy_purchases_request')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('주문 생성 실패 - 상세 오류:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        insertData: insertData
      })
      return null
    }

    // 상태 히스토리 기록
    if (data) {
      await this.addStatusHistory(data.id, null, data.status, data.user_id, '주문 생성')
    }

    return data
  }

  /**
   * 주문 목록 조회 (사용자별)
   */
  static async getOrdersByUser(userId: string, options?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<ProxyPurchaseRow[]> {
    const supabaseClient = supabase()
    
    let query = supabaseClient
      .from('proxy_purchases_request')
      .select(`
        *,
        hot_deals:hot_deal_id (
          id,
          title,
          image_url,
          sale_price,
          original_price
        ),
        shipping_address:shipping_address_id (
          id,
          name,
          address,
          address_detail,
          phone,
          post_code
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
      console.error('주문 목록 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 주문 상세 조회
   */
  static async getOrderById(orderId: string): Promise<ProxyPurchaseRow | null> {
    const supabaseClient = supabase()

    const { data, error } = await supabaseClient
      .from('proxy_purchases_request')
      .select(`
        *,
        hot_deals:hot_deal_id (
          id,
          title,
          description,
          image_url,
          sale_price,
          original_price,
          original_url,
          source
        ),
        shipping_address:shipping_address_id (
          id,
          name,
          address,
          address_detail,
          phone,
          post_code
        ),
        quotes:proxy_purchase_quotes!request_id (
          id,
          product_cost,
          domestic_shipping,
          international_shipping,
          fee,
          total_amount,
          payment_method,
          approval_state,
          valid_until,
          notes,
          created_at
        ),
        payments:payments!request_id (
          id,
          amount,
          payment_method,
          status,
          paid_at,
          created_at
        ),
        status_history:order_status_history!request_id (
          id,
          from_status,
          to_status,
          notes,
          metadata,
          created_at,
          changed_by
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('주문 상세 조회 실패:', error)
      return null
    }

    return data
  }

  /**
   * 주문 상태 업데이트
   */
  static async updateOrderStatus(
    orderId: string, 
    newStatus: string, 
    changedBy: string, 
    notes?: string
  ): Promise<ProxyPurchaseRow | null> {
    const supabaseClient = supabase()

    // 현재 상태 조회
    const { data: currentOrder } = await supabaseClient
      .from('proxy_purchases_request')
      .select('status')
      .eq('id', orderId)
      .single()

    if (!currentOrder) {
      console.error('주문을 찾을 수 없습니다')
      return null
    }

    // 주문 상태 업데이트
    const { data, error } = await supabaseClient
      .from('proxy_purchases_request')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('주문 상태 업데이트 실패:', error)
      return null
    }

    // 상태 히스토리 기록
    await this.addStatusHistory(orderId, currentOrder.status, newStatus, changedBy, notes)

    return data
  }

  /**
   * 주문 정보 업데이트
   */
  static async updateOrder(orderId: string, updates: ProxyPurchaseUpdate): Promise<ProxyPurchaseRow | null> {
    const supabaseClient = supabase()

    const updateData: ProxyPurchaseUpdate = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // undefined 값 제거
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof ProxyPurchaseUpdate] === undefined) {
        delete updateData[key as keyof ProxyPurchaseUpdate]
      }
    })

    const { data, error } = await supabaseClient
      .from('proxy_purchases_request')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('주문 업데이트 실패:', error)
      return null
    }

    return data
  }

  /**
   * 주문 상태 히스토리 추가
   */
  static async addStatusHistory(
    requestId: string,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string,
    notes?: string
  ): Promise<OrderStatusHistoryRow | null> {
    const supabaseClient = supabase()

    const historyData: OrderStatusHistoryInsert = {
      request_id: requestId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: changedBy,
      notes: notes || null,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabaseClient
      .from('order_status_history')
      .insert(historyData)
      .select()
      .single()

    if (error) {
      console.error('상태 히스토리 추가 실패:', error)
      return null
    }

    return data
  }

  /**
   * 견적서 생성
   */
  static async createQuote(quoteData: Omit<ProxyPurchaseQuoteInsert, 'created_at'>): Promise<ProxyPurchaseQuoteRow | null> {
    const supabaseClient = supabase()

    const insertData: ProxyPurchaseQuoteInsert = {
      ...quoteData,
      approval_state: quoteData.approval_state || 'pending',
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabaseClient
      .from('proxy_purchase_quotes')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('견적서 생성 실패:', error)
      return null
    }

    return data
  }

  /**
   * 견적서 승인/거부
   */
  static async updateQuoteApproval(
    quoteId: string,
    approvalState: 'approved' | 'rejected',
    notes?: string
  ): Promise<ProxyPurchaseQuoteRow | null> {
    const supabaseClient = supabase()

    const updateData: ProxyPurchaseQuoteUpdate = {
      approval_state: approvalState,
      notes: notes || null
    }

    if (approvalState === 'approved') {
      updateData.approved_at = new Date().toISOString()
    } else if (approvalState === 'rejected') {
      updateData.rejected_at = new Date().toISOString()
    }

    const { data, error } = await supabaseClient
      .from('proxy_purchase_quotes')
      .update(updateData)
      .eq('id', quoteId)
      .select()
      .single()

    if (error) {
      console.error('견적서 승인/거부 실패:', error)
      return null
    }

    return data
  }

  /**
   * 관리자용: 모든 주문 조회 - 최적화된 버전
   */
  static async getAllOrders(options?: {
    status?: string
    source?: string
    limit?: number
    offset?: number
  }): Promise<ProxyPurchaseRow[]> {
    const supabaseClient = supabase()
    
    // 기본값 설정으로 성능 최적화
    const { 
      limit = 2000, // 기본 2000개로 제한
      offset = 0,
      status,
      source 
    } = options || {}

    let query = supabaseClient
      .from('proxy_purchases_request')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        ),
        hot_deals:hot_deal_id (
          id,
          title,
          image_url,
          sale_price,
          source
        ),
        quotes:proxy_purchase_quotes!request_id (
          id,
          total_amount,
          approval_state,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (source) {
      query = query.eq('hot_deals.source', source)
    }

    if (offset > 0) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('전체 주문 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 주문 통계 조회
   */
  static async getOrderStats(userId?: string): Promise<{
    total: number
    pending: number
    processing: number
    completed: number
    cancelled: number
  } | null> {
    const supabaseClient = supabase()

    let query = supabaseClient
      .from('proxy_purchases_request')
      .select('status')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('주문 통계 조회 실패:', error)
      return null
    }

    const stats = {
      total: data?.length || 0,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    }

    data?.forEach(order => {
      switch (order.status) {
        case 'payment_pending':
          stats.pending++
          break
        case 'payment_completed':
          stats.processing++
          break
        case 'delivered':
          stats.completed++
          break
        case 'cancelled':
          stats.cancelled++
          break
      }
    })

    return stats
  }

  /**
   * 모든 결제 내역 조회 (관리자용)
   */
  static async getAllPayments(): Promise<Database['public']['Tables']['payments']['Row'][]> {
    const supabaseClient = supabase()

    const { data, error } = await supabaseClient
      .from('payments')
      .select(`
        *,
        proxy_purchases_request:request_id (
          id,
          order_number,
          user_id,
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('전체 결제 내역 조회 실패:', error)
      return []
    }

    return data || []
  }
}