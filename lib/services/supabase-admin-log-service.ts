import { supabaseAdmin } from '@/lib/supabase/client'
import type { Database } from '@/database.types'

// Supabase 테이블 타입 정의
type AdminActivityLogRow = Database['public']['Tables']['admin_activity_logs']['Row']
type AdminActivityLogInsert = Database['public']['Tables']['admin_activity_logs']['Insert']
type AdminActivityLogUpdate = Database['public']['Tables']['admin_activity_logs']['Update']

/**
 * Supabase 관리자 활동 로그 서비스 (Phase 4)
 * admin_activity_logs 테이블 관리
 */
export class SupabaseAdminLogService {
  /**
   * 관리자 활동 로그 생성
   */
  static async createAdminLog(data: {
    admin_id: string
    action: string
    action_category: string
    entity_type?: string
    entity_id?: string
    old_value?: any
    new_value?: any
    details?: any
    ip_address?: string
    user_agent?: string
    session_id?: string
  }): Promise<AdminActivityLogRow | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    const logData: AdminActivityLogInsert = {
      admin_id: data.admin_id,
      action: data.action,
      action_category: data.action_category,
      entity_type: data.entity_type || null,
      entity_id: data.entity_id || null,
      old_value: data.old_value ? JSON.parse(JSON.stringify(data.old_value)) : null,
      new_value: data.new_value ? JSON.parse(JSON.stringify(data.new_value)) : null,
      details: data.details ? JSON.parse(JSON.stringify(data.details)) : null,
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      session_id: data.session_id || null,
      created_at: new Date().toISOString()
    }

    const { data: createdLog, error } = await supabase
      .from('admin_activity_logs')
      .insert(logData)
      .select()
      .single()

    if (error || !createdLog) {
      console.error('관리자 로그 생성 실패:', error)
      return null
    }

    return createdLog
  }

  /**
   * 관리자 활동 로그 목록 조회
   */
  static async getAdminLogs(options?: {
    admin_id?: string
    action_category?: string
    entity_type?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
    sortBy?: 'created_at' | 'action'
    sortOrder?: 'asc' | 'desc'
  }): Promise<(AdminActivityLogRow & { admin: { name: string; email: string } })[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }

    let query = supabase
      .from('admin_activity_logs')
      .select(`
        *,
        admin:admin_id (
          name,
          email
        )
      `)

    // 필터링 조건 적용
    if (options?.admin_id) {
      query = query.eq('admin_id', options.admin_id)
    }

    if (options?.action_category) {
      query = query.eq('action_category', options.action_category)
    }

    if (options?.entity_type) {
      query = query.eq('entity_type', options.entity_type)
    }

    if (options?.start_date) {
      query = query.gte('created_at', options.start_date)
    }

    if (options?.end_date) {
      query = query.lte('created_at', options.end_date)
    }

    // 정렬 설정
    const sortBy = options?.sortBy || 'created_at'
    const sortOrder = options?.sortOrder || 'desc'
    const ascending = sortOrder === 'asc'

    query = query.order(sortBy, { ascending })

    // 페이징 설정
    if (options?.limit) {
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + options.limit) - 1)
      } else {
        query = query.limit(options.limit)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('관리자 로그 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 특정 엔티티의 변경 이력 조회
   */
  static async getEntityHistory(
    entityType: string,
    entityId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<AdminActivityLogRow[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }

    let query = supabase
      .from('admin_activity_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + options.limit) - 1)
      } else {
        query = query.limit(options.limit)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('엔티티 변경 이력 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 관리자별 활동 통계
   */
  static async getAdminActivityStats(adminId?: string, options?: {
    start_date?: string
    end_date?: string
  }): Promise<{
    total_actions: number
    actions_by_category: { [category: string]: number }
    actions_by_type: { [action: string]: number }
    daily_activity: { date: string; count: number }[]
    most_active_hours: { hour: number; count: number }[]
    entities_modified: number
  } | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    try {
      let query = supabase
        .from('admin_activity_logs')
        .select('*')

      if (adminId) {
        query = query.eq('admin_id', adminId)
      }

      if (options?.start_date) {
        query = query.gte('created_at', options.start_date)
      }

      if (options?.end_date) {
        query = query.lte('created_at', options.end_date)
      }

      // 전체 액션 수
      const { count: totalActions } = await supabase
        .from('admin_activity_logs')
        .select('*', { count: 'exact', head: true })

      // 로그 데이터 조회
      const { data: logs } = await query
        .select('action, action_category, entity_id, created_at')

      if (!logs) {
        return null
      }

      // 카테고리별 집계
      const actionsByCategory: { [key: string]: number } = {}
      const actionsByType: { [key: string]: number } = {}
      const dailyActivity: { [key: string]: number } = {}
      const hourlyActivity: { [key: number]: number } = {}
      const uniqueEntities = new Set<string>()

      logs.forEach(log => {
        // 카테고리별
        actionsByCategory[log.action_category] = (actionsByCategory[log.action_category] || 0) + 1

        // 액션별
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1

        // 일별 활동
        const date = new Date(log.created_at).toISOString().split('T')[0]
        dailyActivity[date] = (dailyActivity[date] || 0) + 1

        // 시간별 활동
        const hour = new Date(log.created_at).getHours()
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1

        // 수정된 엔티티
        if (log.entity_id) {
          uniqueEntities.add(log.entity_id)
        }
      })

      // 일별 활동 데이터 정렬
      const dailyActivityArray = Object.entries(dailyActivity)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // 시간별 활동 데이터 정렬
      const mostActiveHours = Object.entries(hourlyActivity)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) // 상위 5시간

      return {
        total_actions: totalActions || 0,
        actions_by_category: actionsByCategory,
        actions_by_type: actionsByType,
        daily_activity: dailyActivityArray,
        most_active_hours: mostActiveHours,
        entities_modified: uniqueEntities.size
      }
    } catch (error) {
      console.error('관리자 활동 통계 조회 실패:', error)
      return null
    }
  }

  /**
   * 로그 검색
   */
  static async searchLogs(
    searchTerm: string,
    options?: {
      admin_id?: string
      action_category?: string
      start_date?: string
      end_date?: string
      limit?: number
      offset?: number
    }
  ): Promise<AdminActivityLogRow[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }

    let query = supabase
      .from('admin_activity_logs')
      .select('*')
      .or(`action.ilike.%${searchTerm}%,details::text.ilike.%${searchTerm}%`)

    if (options?.admin_id) {
      query = query.eq('admin_id', options.admin_id)
    }

    if (options?.action_category) {
      query = query.eq('action_category', options.action_category)
    }

    if (options?.start_date) {
      query = query.gte('created_at', options.start_date)
    }

    if (options?.end_date) {
      query = query.lte('created_at', options.end_date)
    }

    query = query.order('created_at', { ascending: false })

    if (options?.limit) {
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + options.limit) - 1)
      } else {
        query = query.limit(options.limit)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('로그 검색 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 보안 이벤트 로그 조회 (중요한 액션들)
   */
  static async getSecurityLogs(options?: {
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }): Promise<AdminActivityLogRow[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }

    const securityActions = [
      'user_delete',
      'user_role_change',
      'admin_create',
      'admin_delete',
      'system_setting_change',
      'bulk_delete',
      'data_export',
      'password_reset'
    ]

    let query = supabase
      .from('admin_activity_logs')
      .select('*')
      .in('action', securityActions)

    if (options?.start_date) {
      query = query.gte('created_at', options.start_date)
    }

    if (options?.end_date) {
      query = query.lte('created_at', options.end_date)
    }

    query = query.order('created_at', { ascending: false })

    if (options?.limit) {
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + options.limit) - 1)
      } else {
        query = query.limit(options.limit)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('보안 로그 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 로그 정리 (오래된 로그 삭제)
   */
  static async cleanupOldLogs(daysOld: number = 90): Promise<{
    deleted_count: number
    error?: string
  }> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return { deleted_count: 0, error: 'Supabase admin client not initialized' }
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // 먼저 삭제될 로그 개수 확인
    const { count, error: countError } = await supabase
      .from('admin_activity_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffDate.toISOString())

    if (countError) {
      return { deleted_count: 0, error: countError.message }
    }

    // 삭제 실행 (보안 로그는 보존)
    const securityActions = [
      'user_delete',
      'user_role_change',
      'admin_create',
      'admin_delete',
      'system_setting_change'
    ]

    const { error: deleteError } = await supabase
      .from('admin_activity_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .not('action', 'in', `(${securityActions.join(',')})`)

    if (deleteError) {
      return { deleted_count: 0, error: deleteError.message }
    }

    return { deleted_count: count || 0 }
  }

  /**
   * 감사 보고서 생성용 데이터 조회
   */
  static async getAuditReport(options: {
    start_date: string
    end_date: string
    admin_id?: string
    include_categories?: string[]
  }): Promise<{
    summary: {
      total_actions: number
      unique_admins: number
      categories: string[]
      date_range: { start: string; end: string }
    }
    detailed_logs: AdminActivityLogRow[]
    admin_summary: { admin_id: string; name: string; action_count: number }[]
  } | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    try {
      let query = supabase
        .from('admin_activity_logs')
        .select(`
          *,
          admin:admin_id (
            name,
            email
          )
        `)
        .gte('created_at', options.start_date)
        .lte('created_at', options.end_date)

      if (options.admin_id) {
        query = query.eq('admin_id', options.admin_id)
      }

      if (options.include_categories) {
        query = query.in('action_category', options.include_categories)
      }

      query = query.order('created_at', { ascending: false })

      const { data: logs, error } = await query

      if (error || !logs) {
        return null
      }

      // 요약 데이터 생성
      const uniqueAdmins = new Set(logs.map(log => log.admin_id))
      const categories = [...new Set(logs.map(log => log.action_category))]

      // 관리자별 요약
      const adminSummary: { [key: string]: { name: string; count: number } } = {}
      logs.forEach(log => {
        const adminInfo = log.admin as any
        if (!adminSummary[log.admin_id]) {
          adminSummary[log.admin_id] = {
            name: adminInfo?.name || 'Unknown',
            count: 0
          }
        }
        adminSummary[log.admin_id].count++
      })

      const adminSummaryArray = Object.entries(adminSummary)
        .map(([admin_id, info]) => ({
          admin_id,
          name: info.name,
          action_count: info.count
        }))
        .sort((a, b) => b.action_count - a.action_count)

      return {
        summary: {
          total_actions: logs.length,
          unique_admins: uniqueAdmins.size,
          categories,
          date_range: {
            start: options.start_date,
            end: options.end_date
          }
        },
        detailed_logs: logs,
        admin_summary: adminSummaryArray
      }
    } catch (error) {
      console.error('감사 보고서 생성 실패:', error)
      return null
    }
  }
}