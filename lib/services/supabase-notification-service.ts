import { supabaseAdmin } from '@/lib/supabase/client'
import type { Database } from '@/database.types'

// Supabase 테이블 타입 정의
type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

/**
 * Supabase 알림 관리 서비스 (Phase 4)
 * notifications 테이블 관리
 */
export class SupabaseNotificationService {
  /**
   * 사용자 알림 목록 조회
   */
  static async getUserNotifications(userId: string, options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
    sortBy?: 'created_at' | 'is_read'
    sortOrder?: 'asc' | 'desc'
  }): Promise<NotificationRow[]> {
    const supabase = supabaseAdmin()
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    // 읽지 않은 알림만 조회
    if (options?.unreadOnly) {
      query = query.eq('is_read', false)
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
    } else {
      query = query.limit(20) // 기본값 유지
    }

    const { data, error } = await query

    if (error) {
      console.error('알림 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const supabase = supabaseAdmin()
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('읽지 않은 알림 개수 조회 실패:', error)
      return 0
    }

    return count || 0
  }

  /**
   * 알림 생성
   */
  static async createNotification(
    userId: string,
    title: string,
    content: string
  ): Promise<NotificationRow | null> {
    const supabase = supabaseAdmin()
    
    const notificationData: NotificationInsert = {
      user_id: userId,
      title,
      content,
      is_read: false,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error || !data) {
      console.error('알림 생성 실패:', error)
      return null
    }

    return data
  }

  /**
   * 알림 읽음 처리
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    const supabase = supabaseAdmin()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('알림 읽음 처리 실패:', error)
      return false
    }

    return true
  }

  /**
   * 사용자의 모든 알림 읽음 처리
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    const supabase = supabaseAdmin()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('모든 알림 읽음 처리 실패:', error)
      return false
    }

    return true
  }

  /**
   * 알림 삭제
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    const supabase = supabaseAdmin()
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('알림 삭제 실패:', error)
      return false
    }

    return true
  }

  /**
   * 오래된 알림 일괄 삭제 (30일 이상)
   */
  static async deleteOldNotifications(userId: string): Promise<boolean> {
    const supabase = supabaseAdmin()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (error) {
      console.error('오래된 알림 삭제 실패:', error)
      return false
    }

    return true
  }

  /**
   * 주문 상태 변경 알림 생성
   */
  static async createOrderNotification(
    userId: string,
    orderId: string,
    status: string
  ): Promise<NotificationRow | null> {
    const statusMessages: Record<string, string> = {
      processing: '주문이 처리 중입니다.',
      shipped: '주문이 발송되었습니다.',
      delivered: '주문이 배송 완료되었습니다.',
      cancelled: '주문이 취소되었습니다.'
    }

    const title = '주문 상태 업데이트'
    const content = statusMessages[status] || `주문 상태가 ${status}로 변경되었습니다.`

    return this.createNotification(userId, title, content)
  }

  /**
   * 핫딜 알림 생성
   */
  static async createHotDealNotification(
    userId: string,
    dealTitle: string,
    dealId: string
  ): Promise<NotificationRow | null> {
    const title = '새로운 핫딜 알림'
    const content = `관심있을 만한 핫딜이 등록되었습니다: ${dealTitle}`

    return this.createNotification(userId, title, content)
  }

  /**
   * 일괄 알림 생성 (Phase 4)
   */
  static async createBulkNotifications(
    notifications: Array<{
      user_id: string
      title: string
      content: string
    }>
  ): Promise<NotificationRow[]> {
    const supabase = supabaseAdmin()
    
    const notificationData: NotificationInsert[] = notifications.map(notif => ({
      user_id: notif.user_id,
      title: notif.title,
      content: notif.content,
      is_read: false,
      created_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()

    if (error || !data) {
      console.error('일괄 알림 생성 실패:', error)
      return []
    }

    return data
  }

  /**
   * 오래된 알림 정리 (전체) - Phase 4
   */
  static async cleanupOldNotifications(daysOld: number = 30): Promise<{
    deleted_count: number
    error?: string
  }> {
    const supabase = supabaseAdmin()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // 먼저 삭제될 알림 개수 확인
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffDate.toISOString())

    if (countError) {
      return { deleted_count: 0, error: countError.message }
    }

    // 삭제 실행
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (deleteError) {
      return { deleted_count: 0, error: deleteError.message }
    }

    return { deleted_count: count || 0 }
  }

  /**
   * 알림 통계 조회 - Phase 4
   */
  static async getNotificationStats(userId?: string): Promise<{
    total_notifications: number
    unread_notifications: number
    read_notifications: number
    notifications_by_type: { [key: string]: number }
    recent_notifications: number // 최근 7일
  } | null> {
    const supabase = supabaseAdmin()

    try {
      // 총 알림 수
      let totalCountQuery = supabase.from('notifications').select('*', { count: 'exact', head: true })
      if (userId) {
        totalCountQuery = totalCountQuery.eq('user_id', userId)
      }
      
      const { count: totalCount } = await totalCountQuery

      // 읽지 않은 알림 수
      let unreadQuery = supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false)
      if (userId) {
        unreadQuery = unreadQuery.eq('user_id', userId)
      }
      
      const { count: unreadCount } = await unreadQuery

      // 읽은 알림 수
      let readQuery = supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', true)
      if (userId) {
        readQuery = readQuery.eq('user_id', userId)
      }
      
      const { count: readCount } = await readQuery

      // 최근 7일 알림 수
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      let recentQuery = supabase.from('notifications').select('*', { count: 'exact', head: true }).gte('created_at', lastWeek)
      if (userId) {
        recentQuery = recentQuery.eq('user_id', userId)
      }
      
      const { count: recentCount } = await recentQuery

      // 타입별 분류를 위한 알림 데이터 조회
      let notificationQuery = supabase.from('notifications').select('title')
      if (userId) {
        notificationQuery = notificationQuery.eq('user_id', userId)
      }
      
      const { data: notifications } = await notificationQuery

      // 제목으로 타입 분류
      const notificationsByType: { [key: string]: number } = {}
      notifications?.forEach(notification => {
        const title = notification.title
        if (title.includes('주문')) {
          notificationsByType['주문'] = (notificationsByType['주문'] || 0) + 1
        } else if (title.includes('핫딜')) {
          notificationsByType['핫딜'] = (notificationsByType['핫딜'] || 0) + 1
        } else if (title.includes('시스템')) {
          notificationsByType['시스템'] = (notificationsByType['시스템'] || 0) + 1
        } else {
          notificationsByType['기타'] = (notificationsByType['기타'] || 0) + 1
        }
      })

      return {
        total_notifications: totalCount || 0,
        unread_notifications: unreadCount || 0,
        read_notifications: readCount || 0,
        notifications_by_type: notificationsByType,
        recent_notifications: recentCount || 0
      }
    } catch (error) {
      console.error('알림 통계 조회 실패:', error)
      return null
    }
  }

  /**
   * 알림 검색 - Phase 4
   */
  static async searchNotifications(userId: string, searchTerm: string, options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  }): Promise<NotificationRow[]> {
    const supabase = supabaseAdmin()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)

    if (options?.unreadOnly) {
      query = query.eq('is_read', false)
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
      console.error('알림 검색 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 시스템 공지사항 생성 - Phase 4
   */
  static async createSystemAnnouncement(
    title: string,
    content: string,
    targetUsers?: string[] // 특정 사용자들만, 없으면 전체
  ): Promise<{
    success: boolean
    notification_count: number
    error?: string
  }> {
    const supabase = supabaseAdmin()

    try {
      let userIds: string[]

      if (targetUsers && targetUsers.length > 0) {
        userIds = targetUsers
      } else {
        // 모든 활성 사용자 조회
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('status', 'active')

        if (userError || !users) {
          return { success: false, notification_count: 0, error: userError?.message }
        }

        userIds = users.map(user => user.id)
      }

      // 일괄 알림 생성
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: `[시스템 공지] ${title}`,
        content
      }))

      const createdNotifications = await this.createBulkNotifications(notifications)

      return {
        success: createdNotifications.length > 0,
        notification_count: createdNotifications.length
      }
    } catch (error) {
      return {
        success: false,
        notification_count: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 알림 일괄 읽음 처리 (관리자용) - Phase 4
   */
  static async markNotificationsAsReadBatch(
    notificationIds: string[]
  ): Promise<{ success: boolean; updated_count: number; error?: string }> {
    const supabase = supabaseAdmin()

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds)
      .select('id')

    if (error) {
      return { success: false, updated_count: 0, error: error.message }
    }

    return { success: true, updated_count: data?.length || 0 }
  }

  /**
   * 알림 일괄 삭제 (관리자용) - Phase 4
   */
  static async deleteNotificationsBatch(
    notificationIds: string[]
  ): Promise<{ success: boolean; deleted_count: number; error?: string }> {
    const supabase = supabaseAdmin()

    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds)
      .select('id')

    if (error) {
      return { success: false, deleted_count: 0, error: error.message }
    }

    return { success: true, deleted_count: data?.length || 0 }
  }
}