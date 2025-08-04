'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { SupabaseNotificationService } from '@/lib/services/supabase-notification-service'
import { SupabaseAdminLogService } from '@/lib/services/supabase-admin-log-service'
import { SupabaseSystemSettingsService } from '@/lib/services/supabase-system-settings-service'
import type { Database } from '@/database.types'

// 타입 정의
type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type AdminActivityLogRow = Database['public']['Tables']['admin_activity_logs']['Row']
type SystemSettingRow = Database['public']['Tables']['system_settings']['Row']

// Query Keys
const SYSTEM_KEYS = {
  // 알림 관련
  notifications: (userId: string) => ['notifications', 'user', userId] as const,
  unreadCount: (userId: string) => ['notifications', 'unread-count', userId] as const,
  notificationStats: (userId?: string) => ['notifications', 'stats', userId] as const,
  
  // 관리자 로그 관련
  adminLogs: (options?: any) => ['admin-logs', options] as const,
  entityHistory: (entityType: string, entityId: string) => ['admin-logs', 'entity-history', entityType, entityId] as const,
  adminActivityStats: (adminId?: string) => ['admin-logs', 'activity-stats', adminId] as const,
  securityLogs: (options?: any) => ['admin-logs', 'security', options] as const,
  auditReport: (options: any) => ['admin-logs', 'audit-report', options] as const,
  
  // 시스템 설정 관련
  systemSettings: (options?: any) => ['system-settings', options] as const,
  publicSettings: () => ['system-settings', 'public'] as const,
  settingsByCategory: (category: string) => ['system-settings', 'category', category] as const,
  settingDetail: (key: string) => ['system-settings', 'detail', key] as const,
  settingCategories: () => ['system-settings', 'categories'] as const,
} as const

/**
 * 알림 관련 hooks
 */
export function useNotifications(userId: string, options?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
  sortBy?: 'created_at' | 'is_read'
  sortOrder?: 'asc' | 'desc'
}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: SYSTEM_KEYS.notifications(userId),
    queryFn: () => SupabaseNotificationService.getUserNotifications(userId, options),
    staleTime: 1000 * 60 * 2, // 2분
    enabled: !!userId,
  })

  // 실시간 알림 구독 - 페이지 가시성 기반 최적화
  useEffect(() => {
    if (!userId) return

    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel(`notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('알림 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.notifications(userId) })
            queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.unreadCount(userId) })
            queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.notificationStats() })
          }
        )
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (isVisible()) {
        setupSubscription()
      } else if (channel) {
        supabase().removeChannel(channel)
        channel = null
      }
    }

    // 초기 설정
    setupSubscription()
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channel) {
        supabase().removeChannel(channel)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, queryClient])

  return query
}

export function useUnreadNotificationCount(userId: string) {
  return useQuery({
    queryKey: SYSTEM_KEYS.unreadCount(userId),
    queryFn: () => SupabaseNotificationService.getUnreadCount(userId),
    staleTime: 1000 * 30, // 30초
    enabled: !!userId,
  })
}

export function useNotificationStats(userId?: string) {
  return useQuery({
    queryKey: SYSTEM_KEYS.notificationStats(userId),
    queryFn: () => SupabaseNotificationService.getNotificationStats(userId),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 알림 생성/수정/삭제 mutations
 */
export function useCreateNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, title, content }: { 
      userId: string
      title: string
      content: string
    }) => SupabaseNotificationService.createNotification(userId, title, content),
    onSuccess: (result, { userId }) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.unreadCount(userId) })
        queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.notificationStats() })
      }
    },
  })
}

export function useCreateBulkNotifications() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (notifications: Array<{
      user_id: string
      title: string
      content: string
    }>) => SupabaseNotificationService.createBulkNotifications(notifications),
    onSuccess: (results) => {
      if (results.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.notificationStats() })
      }
    },
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (notificationId: string) => 
      SupabaseNotificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: string) => 
      SupabaseNotificationService.markAllAsRead(userId),
    onSuccess: (success, userId) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.unreadCount(userId) })
      }
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (notificationId: string) => 
      SupabaseNotificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useCreateSystemAnnouncement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ title, content, targetUsers }: {
      title: string
      content: string
      targetUsers?: string[]
    }) => SupabaseNotificationService.createSystemAnnouncement(title, content, targetUsers),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.notificationStats() })
      }
    },
  })
}

/**
 * 관리자 로그 관련 hooks
 */
export function useAdminLogs(options?: {
  admin_id?: string
  action_category?: string
  entity_type?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'action'
  sortOrder?: 'asc' | 'desc'
}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: SYSTEM_KEYS.adminLogs(options),
    queryFn: () => SupabaseAdminLogService.getAdminLogs(options),
    staleTime: 1000 * 60 * 5, // 5분
  })

  // 실시간 관리자 로그 구독 - 페이지 가시성 기반 최적화
  useEffect(() => {
    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel('admin-logs-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_activity_logs'
          },
          (payload) => {
            console.log('관리자 로그 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
            if (options?.admin_id) {
              queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.adminActivityStats(options.admin_id) })
            }
          }
        )
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (isVisible()) {
        setupSubscription()
      } else if (channel) {
        supabase().removeChannel(channel)
        channel = null
      }
    }

    // 초기 설정
    setupSubscription()
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channel) {
        supabase().removeChannel(channel)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [queryClient, options?.admin_id])

  return query
}

export function useEntityHistory(entityType: string, entityId: string, options?: {
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: SYSTEM_KEYS.entityHistory(entityType, entityId),
    queryFn: () => SupabaseAdminLogService.getEntityHistory(entityType, entityId, options),
    staleTime: 1000 * 60 * 10, // 10분
    enabled: !!(entityType && entityId),
  })
}

export function useAdminActivityStats(adminId?: string, options?: {
  start_date?: string
  end_date?: string
}) {
  return useQuery({
    queryKey: SYSTEM_KEYS.adminActivityStats(adminId),
    queryFn: () => SupabaseAdminLogService.getAdminActivityStats(adminId, options),
    staleTime: 1000 * 60 * 15, // 15분
  })
}

export function useSecurityLogs(options?: {
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: SYSTEM_KEYS.securityLogs(options),
    queryFn: () => SupabaseAdminLogService.getSecurityLogs(options),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

export function useAuditReport(options: {
  start_date: string
  end_date: string
  admin_id?: string
  include_categories?: string[]
}) {
  return useQuery({
    queryKey: SYSTEM_KEYS.auditReport(options),
    queryFn: () => SupabaseAdminLogService.getAuditReport(options),
    staleTime: 1000 * 60 * 30, // 30분
    enabled: !!(options.start_date && options.end_date),
  })
}

/**
 * 관리자 로그 생성 mutation
 */
export function useCreateAdminLog() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: {
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
    }) => SupabaseAdminLogService.createAdminLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
    },
  })
}

/**
 * 시스템 설정 관련 hooks
 */
export function useSystemSettings(options?: {
  category?: string
  is_public?: boolean
  is_editable?: boolean
  search?: string
  limit?: number
  offset?: number
}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: SYSTEM_KEYS.systemSettings(options),
    queryFn: () => SupabaseSystemSettingsService.getAllSettings(options),
    staleTime: 1000 * 60 * 10, // 10분
  })

  // 실시간 시스템 설정 구독 - 페이지 가시성 기반 최적화
  useEffect(() => {
    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel('system-settings-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'system_settings'
          },
          (payload) => {
            console.log('시스템 설정 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['system-settings'] })
            queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.publicSettings() })
            queryClient.invalidateQueries({ queryKey: SYSTEM_KEYS.settingCategories() })
          }
        )
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (isVisible()) {
        setupSubscription()
      } else if (channel) {
        supabase().removeChannel(channel)
        channel = null
      }
    }

    // 초기 설정
    setupSubscription()
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channel) {
        supabase().removeChannel(channel)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [queryClient])

  return query
}

export function usePublicSettings() {
  return useQuery({
    queryKey: SYSTEM_KEYS.publicSettings(),
    queryFn: () => SupabaseSystemSettingsService.getPublicSettings(),
    staleTime: 1000 * 60 * 15, // 15분
  })
}

export function useSettingsByCategory(category: string, includePrivate: boolean = false) {
  return useQuery({
    queryKey: SYSTEM_KEYS.settingsByCategory(category),
    queryFn: () => SupabaseSystemSettingsService.getSettingsByCategory(category, includePrivate),
    staleTime: 1000 * 60 * 10, // 10분
    enabled: !!category,
  })
}

export function useSettingDetail(key: string) {
  return useQuery({
    queryKey: SYSTEM_KEYS.settingDetail(key),
    queryFn: () => SupabaseSystemSettingsService.getSettingDetail(key),
    staleTime: 1000 * 60 * 10, // 10분
    enabled: !!key,
  })
}

export function useSetting<T = any>(key: string) {
  return useQuery({
    queryKey: ['system-settings', 'value', key],
    queryFn: () => SupabaseSystemSettingsService.getSetting<T>(key),
    staleTime: 1000 * 60 * 10, // 10분
    enabled: !!key,
  })
}

export function useSettingCategories() {
  return useQuery({
    queryKey: SYSTEM_KEYS.settingCategories(),
    queryFn: () => SupabaseSystemSettingsService.getCategories(),
    staleTime: 1000 * 60 * 30, // 30분
  })
}

/**
 * 시스템 설정 생성/수정/삭제 mutations
 */
export function useCreateSetting() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: {
      key: string
      value: any
      data_type: 'string' | 'number' | 'boolean' | 'json' | 'array'
      category: string
      description?: string
      is_public?: boolean
      is_editable?: boolean
      validation_rules?: any
      default_value?: any
      updated_by: string
    }) => SupabaseSystemSettingsService.createSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
    },
  })
}

export function useUpdateSetting() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ key, value, updatedBy, validateValue = true }: {
      key: string
      value: any
      updatedBy: string
      validateValue?: boolean
    }) => SupabaseSystemSettingsService.updateSetting(key, value, updatedBy, validateValue),
    onSuccess: (result, { key }) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['system-settings'] })
        queryClient.setQueryData(['system-settings', 'value', key], result.value)
      }
    },
  })
}

export function useUpdateMultipleSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ settings, updatedBy }: {
      settings: Array<{ key: string; value: any }>
      updatedBy: string
    }) => SupabaseSystemSettingsService.updateMultipleSettings(settings, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
    },
  })
}

export function useDeleteSetting() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (key: string) => SupabaseSystemSettingsService.deleteSetting(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
    },
  })
}

export function useResetSettingToDefault() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ key, updatedBy }: { key: string; updatedBy: string }) => 
      SupabaseSystemSettingsService.resetSettingToDefault(key, updatedBy),
    onSuccess: (result, { key }) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['system-settings'] })
        queryClient.setQueryData(['system-settings', 'value', key], result.value)
      }
    },
  })
}

export function useCreateSettingTemplate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ category, settings, createdBy }: {
      category: string
      settings: Array<{
        key: string
        value: any
        data_type: 'string' | 'number' | 'boolean' | 'json' | 'array'
        description?: string
        is_public?: boolean
        is_editable?: boolean
        validation_rules?: any
        default_value?: any
      }>
      createdBy: string
    }) => SupabaseSystemSettingsService.createSettingTemplate(category, settings, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
    },
  })
}

/**
 * 통합 시스템 관리 데이터 hook
 */
export function useSystemManagementData(userId: string) {
  const notifications = useNotifications(userId, { limit: 10 })
  const unreadCount = useUnreadNotificationCount(userId)
  const notificationStats = useNotificationStats()
  const adminActivityStats = useAdminActivityStats()
  const publicSettings = usePublicSettings()
  
  return {
    notifications: notifications.data || [],
    unreadCount: unreadCount.data || 0,
    notificationStats: notificationStats.data,
    adminStats: adminActivityStats.data,
    publicSettings: publicSettings.data || {},
    isLoading: notifications.isLoading || unreadCount.isLoading || notificationStats.isLoading,
    isError: notifications.isError || unreadCount.isError || notificationStats.isError,
  }
}

/**
 * 관리자 대시보드 데이터 hook
 */
export function useAdminDashboardData(adminId?: string) {
  const recentLogs = useAdminLogs({ limit: 20, sortOrder: 'desc' })
  const securityLogs = useSecurityLogs({ limit: 10 })
  const activityStats = useAdminActivityStats(adminId)
  const notificationStats = useNotificationStats()
  const settingCategories = useSettingCategories()
  
  return {
    recentLogs: recentLogs.data || [],
    securityLogs: securityLogs.data || [],
    activityStats: activityStats.data,
    notificationStats: notificationStats.data,
    settingCategories: settingCategories.data || [],
    isLoading: recentLogs.isLoading || securityLogs.isLoading || activityStats.isLoading,
    isError: recentLogs.isError || securityLogs.isError || activityStats.isError,
  }
}