'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { notificationService, Notification } from '@/lib/notifications/notification-service'

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

  const refreshNotifications = () => {
    const allNotifications = notificationService.getNotifications()
    setNotifications(allNotifications)
    setUnreadCount(notificationService.getUnreadCount())
  }

  useEffect(() => {
    refreshNotifications()
    // 5초마다 알림 업데이트
    const interval = setInterval(refreshNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

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
        notificationService.success(n.title, n.message, n.actionUrl)
      } else if (n.type === 'error') {
        notificationService.error(n.title, n.message, n.actionUrl)
      } else if (n.type === 'warning') {
        notificationService.warning(n.title, n.message, n.actionUrl)
      } else {
        notificationService.info(n.title, n.message, n.actionUrl)
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