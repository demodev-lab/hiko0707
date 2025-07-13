/**
 * Notifications Hook
 * 알림 관리를 위한 React Hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  NotificationData, 
  NotificationType, 
  NotificationPreferences,
  createNotification,
  createOrderStatusNotification,
  createQuoteReceivedNotification,
  createPaymentReminderNotification,
  createShippingUpdateNotification,
  createPriceAlertNotification,
  isQuietHours,
  batchNotificationsByPriority,
  groupSimilarNotifications,
  cleanupExpiredNotifications,
  getDefaultNotificationPreferences
} from '@/lib/services/notification-service'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

/**
 * 기본 알림 Hook
 */
export function useNotifications() {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false)
  
  // 브라우저 알림 권한 확인
  useEffect(() => {
    if ('Notification' in window) {
      setIsNotificationEnabled(Notification.permission === 'granted')
    }
  }, [])

  // 알림 목록 조회
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: async () => {
      // 실제 구현에서는 API 호출
      // 현재는 로컬 스토리지에서 모의 데이터 가져오기
      return getNotificationsFromStorage(currentUser?.id || '')
    },
    enabled: !!currentUser,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000 // 1분마다 자동 새로고침
  })

  // 알림 설정 조회
  const {
    data: preferences,
    isLoading: isPreferencesLoading
  } = useQuery({
    queryKey: ['notification-preferences', currentUser?.id],
    queryFn: async () => {
      // 실제 구현에서는 API 호출
      return getNotificationPreferencesFromStorage(currentUser?.id || '')
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000 // 5분
  })

  // 알림 읽음 처리 Mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await markNotificationAsRead(notificationId, currentUser?.id || '')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] })
    }
  })

  // 알림 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await deleteNotification(notificationId, currentUser?.id || '')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] })
    }
  })

  // 알림 설정 업데이트 Mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: NotificationPreferences) => {
      return await updateNotificationPreferences(newPreferences)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['notification-preferences', currentUser?.id] 
      })
      toast.success('알림 설정이 저장되었습니다')
    }
  })

  // 새 알림 생성 Mutation
  const createNotificationMutation = useMutation({
    mutationFn: async ({
      type,
      data,
      overrides
    }: {
      type: NotificationType
      data: Record<string, any>
      overrides?: Partial<NotificationData>
    }) => {
      if (!currentUser) throw new Error('User not authenticated')
      
      const notification = createNotification(currentUser.id, type, data, overrides)
      return await saveNotificationToStorage(notification)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] })
    }
  })

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setIsNotificationEnabled(permission === 'granted')
      return permission === 'granted'
    }
    return false
  }, [])

  // 브라우저 알림 표시
  const showBrowserNotification = useCallback((notification: NotificationData) => {
    if (!isNotificationEnabled || !preferences) return
    
    // 조용한 시간 확인
    if (isQuietHours(preferences)) return
    
    // 우선순위가 낮은 알림은 브라우저 알림으로 표시하지 않음
    if (notification.priority === 'low') return

    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent'
    })
  }, [isNotificationEnabled, preferences])

  // 통계 계산
  const stats = useMemo(() => {
    const unreadCount = notifications.filter(n => n.status === 'unread').length
    const urgentCount = notifications.filter(n => n.priority === 'urgent' && n.status === 'unread').length
    const todayCount = notifications.filter(n => {
      const today = new Date()
      const notifDate = new Date(n.createdAt)
      return notifDate.toDateString() === today.toDateString()
    }).length

    return {
      total: notifications.length,
      unread: unreadCount,
      urgent: urgentCount,
      today: todayCount
    }
  }, [notifications])

  // 알림 그룹화
  const groupedNotifications = useMemo(() => {
    const cleaned = cleanupExpiredNotifications(notifications)
    return groupSimilarNotifications(cleaned)
  }, [notifications])

  // 우선순위별 알림
  const notificationsByPriority = useMemo(() => {
    return batchNotificationsByPriority(notifications.filter(n => n.status === 'unread'))
  }, [notifications])

  return {
    // Data
    notifications: groupedNotifications,
    preferences,
    stats,
    notificationsByPriority,
    
    // Loading states
    isLoading,
    isPreferencesLoading,
    
    // Actions
    markAsRead: markAsReadMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    createNotification: createNotificationMutation.mutateAsync,
    refetch,
    
    // Browser notifications
    isNotificationEnabled,
    requestNotificationPermission,
    showBrowserNotification,
    
    // Loading states for mutations
    isMarkingAsRead: markAsReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending
  }
}

/**
 * 특정 유형의 알림 Hook
 */
export function useNotificationsByType(type: NotificationType) {
  const { notifications } = useNotifications()
  
  return useMemo(() => {
    return notifications.filter(n => n.type === type)
  }, [notifications, type])
}

/**
 * 실시간 알림 Hook
 */
export function useRealtimeNotifications() {
  const { currentUser } = useAuth()
  const { showBrowserNotification, createNotification } = useNotifications()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')

  // 실시간 연결 (WebSocket 등)
  useEffect(() => {
    if (!currentUser) return

    // 실제 구현에서는 WebSocket 연결
    setConnectionStatus('connecting')
    
    // 모의 연결
    const timer = setTimeout(() => {
      setConnectionStatus('connected')
    }, 1000)

    return () => {
      clearTimeout(timer)
      setConnectionStatus('disconnected')
    }
  }, [currentUser])

  // 새 알림 생성 및 표시
  const sendRealtimeNotification = useCallback(async (
    type: NotificationType,
    data: Record<string, any>,
    overrides?: Partial<NotificationData>
  ) => {
    try {
      const notification = await createNotification({ type, data, overrides })
      
      // 브라우저 알림 표시
      showBrowserNotification(notification)
      
      // 토스트 알림 표시 (긴급하거나 중요한 알림만)
      if (notification.priority === 'urgent' || notification.priority === 'high') {
        toast(notification.title, {
          description: notification.message,
          action: notification.actionUrl ? {
            label: notification.actionLabel || '확인',
            onClick: () => window.location.href = notification.actionUrl!
          } : undefined
        })
      }
      
      return notification
    } catch (error) {
      console.error('Failed to send realtime notification:', error)
    }
  }, [createNotification, showBrowserNotification])

  return {
    connectionStatus,
    sendRealtimeNotification
  }
}

/**
 * 헬퍼 함수들 (실제 구현에서는 API 호출로 대체)
 */
async function getNotificationsFromStorage(userId: string): Promise<NotificationData[]> {
  try {
    const stored = localStorage.getItem(`notifications_${userId}`)
    if (stored) {
      const notifications = JSON.parse(stored)
      return notifications.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        readAt: n.readAt ? new Date(n.readAt) : undefined,
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
      }))
    }
  } catch (error) {
    console.error('Failed to load notifications:', error)
  }
  return []
}

async function saveNotificationToStorage(notification: NotificationData): Promise<NotificationData> {
  try {
    const existing = await getNotificationsFromStorage(notification.userId)
    const updated = [notification, ...existing].slice(0, 100) // 최대 100개 유지
    
    localStorage.setItem(
      `notifications_${notification.userId}`, 
      JSON.stringify(updated)
    )
  } catch (error) {
    console.error('Failed to save notification:', error)
  }
  return notification
}

async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  try {
    const notifications = await getNotificationsFromStorage(userId)
    const updated = notifications.map(n => 
      n.id === notificationId 
        ? { ...n, status: 'read' as const, readAt: new Date() }
        : n
    )
    
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  try {
    const notifications = await getNotificationsFromStorage(userId)
    const updated = notifications.filter(n => n.id !== notificationId)
    
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to delete notification:', error)
  }
}

async function getNotificationPreferencesFromStorage(userId: string): Promise<NotificationPreferences> {
  try {
    const stored = localStorage.getItem(`notification_preferences_${userId}`)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load notification preferences:', error)
  }
  
  return getDefaultNotificationPreferences(userId)
}

async function updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
  try {
    localStorage.setItem(
      `notification_preferences_${preferences.userId}`, 
      JSON.stringify(preferences)
    )
  } catch (error) {
    console.error('Failed to update notification preferences:', error)
  }
  return preferences
}