import { supabase as getSupabaseClient } from '@/lib/supabase/client'
import type { UserRow, OrderRow, HotDealRow } from '@/lib/types/supabase'

// 통계 타입 정의
export interface AdminStatistics {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  totalViews: number
  avgOrderValue: number
  conversionRate: number
  monthlyGrowth: {
    users: number
    orders: number
    revenue: number
  }
}

export interface MonthlyStats {
  month: string
  year: number
  monthNumber: number
  orders: number
  users: number
  revenue: number
}

export interface CategoryStats {
  category: string
  count: number
  percentage: number
}

export interface TopHotDeal {
  id: string
  title: string
  category: string | null
  source: string
  views: number
  ranking?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export class SupabaseAdminService {
  /**
   * 관리자 대시보드용 핵심 통계 조회 (서버사이드 집계)
   */
  static async getDashboardStatistics(): Promise<AdminStatistics> {
    const supabase = getSupabaseClient()
    
    try {
      // 병렬로 집계 쿼리 실행
      const [
        usersCountResult,
        ordersCountResult,
        revenueResult,
        viewsResult,
        currentMonthUsersResult,
        previousMonthUsersResult,
        currentMonthOrdersResult,
        previousMonthOrdersResult,
        currentMonthRevenueResult,
        previousMonthRevenueResult
      ] = await Promise.all([
        // 전체 사용자 수
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true }),
        
        // 전체 주문 수
        supabase
          .from('proxy_purchases_request')
          .select('id', { count: 'exact', head: true }),
        
        // 총 매출 (견적 승인된 주문들의 총합)
        supabase
          .from('proxy_purchase_quotes')
          .select('total_amount')
          .not('total_amount', 'is', null),
        
        // 총 조회수
        supabase
          .from('hot_deals')
          .select('views')
          .not('views', 'is', null),
        
        // 이번 달 신규 사용자
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        // 지난 달 신규 사용자
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
          .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        // 이번 달 주문
        supabase
          .from('proxy_purchases_request')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        // 지난 달 주문
        supabase
          .from('proxy_purchases_request')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
          .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        // 이번 달 매출
        supabase
          .from('proxy_purchase_quotes')
          .select('total_amount')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .not('total_amount', 'is', null),
        
        // 지난 달 매출
        supabase
          .from('proxy_purchase_quotes')
          .select('total_amount')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
          .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .not('total_amount', 'is', null)
      ])

      // 결과 계산
      const totalUsers = usersCountResult.count || 0
      const totalOrders = ordersCountResult.count || 0
      const totalRevenue = revenueResult.data?.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0) || 0
      const totalViews = viewsResult.data?.reduce((sum, item) => sum + (Number(item.views) || 0), 0) || 0
      
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0
      
      // 월별 증가율 계산
      const currentMonthUsers = currentMonthUsersResult.count || 0
      const previousMonthUsers = previousMonthUsersResult.count || 0
      const currentMonthOrders = currentMonthOrdersResult.count || 0
      const previousMonthOrders = previousMonthOrdersResult.count || 0
      const currentMonthRevenue = currentMonthRevenueResult.data?.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0) || 0
      const previousMonthRevenue = previousMonthRevenueResult.data?.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0) || 0
      
      const usersGrowth = previousMonthUsers > 0 ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100 : 0
      const ordersGrowth = previousMonthOrders > 0 ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100 : 0
      const revenueGrowth = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0

      return {
        totalUsers,
        totalOrders,
        totalRevenue,
        totalViews,
        avgOrderValue,
        conversionRate,
        monthlyGrowth: {
          users: Math.round(usersGrowth * 10) / 10,
          orders: Math.round(ordersGrowth * 10) / 10,
          revenue: Math.round(revenueGrowth * 10) / 10
        }
      }
    } catch (error) {
      console.error('통계 조회 실패:', error)
      return {
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalViews: 0,
        avgOrderValue: 0,
        conversionRate: 0,
        monthlyGrowth: {
          users: 0,
          orders: 0,
          revenue: 0
        }
      }
    }
  }

  /**
   * 월별 통계 데이터 조회 (서버사이드 집계)
   */
  static async getMonthlyStatistics(year: number = new Date().getFullYear()): Promise<MonthlyStats[]> {
    const supabase = getSupabaseClient()
    
    try {
      // 12개월 데이터를 병렬로 조회
      const monthPromises = Array.from({ length: 12 }, async (_, i) => {
        const monthStart = new Date(year, i, 1).toISOString()
        const monthEnd = new Date(year, i + 1, 1).toISOString()
        
        const [usersResult, ordersResult, revenueResult] = await Promise.all([
          supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', monthStart)
            .lt('created_at', monthEnd),
          
          supabase
            .from('proxy_purchases_request')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', monthStart)
            .lt('created_at', monthEnd),
          
          supabase
            .from('proxy_purchase_quotes')
            .select('total_amount')
            .gte('created_at', monthStart)
            .lt('created_at', monthEnd)
            .not('total_amount', 'is', null)
        ])
        
        const revenue = revenueResult.data?.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0) || 0
        
        return {
          month: new Date(year, i, 1).toLocaleDateString('ko-KR', { month: 'long' }),
          year,
          monthNumber: i + 1,
          orders: ordersResult.count || 0,
          users: usersResult.count || 0,
          revenue
        }
      })
      
      return await Promise.all(monthPromises)
    } catch (error) {
      console.error('월별 통계 조회 실패:', error)
      return []
    }
  }

  /**
   * 카테고리별 핫딜 통계 조회 (서버사이드 집계)
   */
  static async getCategoryStatistics(): Promise<CategoryStats[]> {
    const supabase = getSupabaseClient()
    
    try {
      const { data, error } = await supabase
        .rpc('get_hotdeal_category_stats')
      
      if (error) {
        console.error('카테고리 통계 RPC 실패:', error)
        // 폴백: 직접 집계
        return await this.getCategoryStatisticsFallback()
      }
      
      return data || []
    } catch (error) {
      console.error('카테고리 통계 조회 실패:', error)
      return await this.getCategoryStatisticsFallback()
    }
  }

  /**
   * 카테고리 통계 폴백 메서드 (RPC가 없을 때)
   */
  private static async getCategoryStatisticsFallback(): Promise<CategoryStats[]> {
    const supabase = getSupabaseClient()
    
    try {
      const { data: hotdeals, error } = await supabase
        .from('hot_deals')
        .select('category')
        .not('category', 'is', null)
      
      if (error) {
        console.error('핫딜 카테고리 조회 실패:', error)
        return []
      }
      
      // 카테고리별 집계
      const categoryCount = (hotdeals || []).reduce((acc, deal) => {
        const category = deal.category || 'other'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const total = hotdeals?.length || 0
      
      return Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0
      })).sort((a, b) => b.count - a.count)
    } catch (error) {
      console.error('카테고리 통계 폴백 실패:', error)
      return []
    }
  }

  /**
   * 인기 핫딜 TOP N 조회 (조회수 기준)
   */
  static async getTopHotDeals(limit: number = 5): Promise<TopHotDeal[]> {
    const supabase = getSupabaseClient()
    
    try {
      const { data, error } = await supabase
        .from('hot_deals')
        .select('id, title, category, source, views')
        .not('views', 'is', null)
        .order('views', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('인기 핫딜 조회 실패:', error)
        return []
      }
      
      return (data || []).map((deal, index) => ({
        ...deal,
        views: Number(deal.views) || 0,
        ranking: index + 1
      }))
    } catch (error) {
      console.error('인기 핫딜 조회 실패:', error)
      return []
    }
  }

  /**
   * Buy-for-me 요청 페이지네이션 조회
   */
  static async getBuyForMeRequests(options?: {
    page?: number
    pageSize?: number
    status?: string
    sortBy?: 'created_at' | 'updated_at' | 'estimated_total_amount'
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResult<OrderRow>> {
    const supabase = getSupabaseClient()
    
    const {
      page = 1,
      pageSize = 20,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options || {}
    
    try {
      // 전체 개수 조회
      let countQuery = supabase
        .from('proxy_purchases_request')
        .select('id', { count: 'exact', head: true })
      
      if (status) {
        countQuery = countQuery.eq('status', status)
      }
      
      const { count: totalCount } = await countQuery
      const total = totalCount || 0
      
      // 데이터 조회
      let dataQuery = supabase
        .from('proxy_purchases_request')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1)
      
      if (status) {
        dataQuery = dataQuery.eq('status', status)
      }
      
      const { data, error } = await dataQuery
      
      if (error) {
        console.error('Buy-for-me 요청 조회 실패:', error)
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          hasMore: false
        }
      }
      
      return {
        data: data || [],
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total
      }
    } catch (error) {
      console.error('Buy-for-me 요청 조회 실패:', error)
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        hasMore: false
      }
    }
  }

  /**
   * Buy-for-me 요청 상태별 개수 조회
   * RPC가 없으므로 직접 집계하는 방식으로 변경
   */
  static async getBuyForMeStatusCounts(): Promise<Record<string, number>> {
    // RPC가 없으므로 직접 집계 방식 사용
    return await this.getBuyForMeStatusCountsFallback()
  }

  /**
   * Buy-for-me 상태별 개수 폴백 메서드
   */
  private static async getBuyForMeStatusCountsFallback(): Promise<Record<string, number>> {
    const supabase = getSupabaseClient()
    
    try {
      const { data, error } = await supabase
        .from('proxy_purchases_request')
        .select('status')
      
      if (error) {
        console.error('상태별 개수 폴백 실패:', error)
        return {}
      }
      
      return (data || []).reduce((acc, request) => {
        const status = request.status || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    } catch (error) {
      console.error('상태별 개수 폴백 실패:', error)
      return {}
    }
  }

  /**
   * 실시간 통계 업데이트를 위한 구독 설정
   */
  static subscribeToStatistics(callback: (payload: any) => void) {
    const supabase = getSupabaseClient()
    
    // 여러 테이블 변경 사항 구독
    const subscriptions = [
      supabase
        .channel('admin-stats-users')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'users' }, 
            callback)
        .subscribe(),
      
      supabase
        .channel('admin-stats-orders')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'proxy_purchases_request' }, 
            callback)
        .subscribe(),
      
      supabase
        .channel('admin-stats-hotdeals')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'hot_deals' }, 
            callback)
        .subscribe()
    ]
    
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription)
      })
    }
  }
}