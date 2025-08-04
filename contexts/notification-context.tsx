'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { notificationService, Notification } from '@/lib/notifications/notification-service'
import { useClerkRole } from '@/hooks/use-clerk-role'
import { useSupabaseUser } from '@/hooks/use-supabase-user'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { isAuthenticated } = useClerkRole()
  const { user: currentUser } = useSupabaseUser()

  // 현재 사용자 정보를 notificationService에 전달할 수 있는 형태로 변환
  const notificationUser = currentUser ? {
    id: currentUser.id,
    role: currentUser.role
  } : null

  const refreshNotifications = () => {
    if (isAuthenticated && notificationUser) {
      const allNotifications = notificationService.getNotifications(false, notificationUser)
      setNotifications(allNotifications)
      setUnreadCount(notificationService.getUnreadCount(notificationUser))
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    refreshNotifications()
    // 1초마다 알림 업데이트 (더 빠른 반응성을 위해)
    const interval = setInterval(refreshNotifications, 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated, notificationUser?.id, notificationUser?.role])

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id)
    refreshNotifications()
  }

  const markAllAsRead = () => {
    notificationService.markAllAsRead()
    refreshNotifications()
  }

  const removeNotification = (id: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== id)
    notificationService.clearNotifications()
    updatedNotifications.forEach(n => {
      if (n.type === 'success') {
        notificationService.success(n.title, n.message, n.actionUrl, notificationUser)
      } else if (n.type === 'error') {
        notificationService.error(n.title, n.message, n.actionUrl, notificationUser)
      } else if (n.type === 'warning') {
        notificationService.warning(n.title, n.message, n.actionUrl, notificationUser)
      } else {
        notificationService.info(n.title, n.message, n.actionUrl, notificationUser)
      }
    })
    refreshNotifications()
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}