import { toast } from 'sonner'
import { BuyForMeRequest } from '@/types/buy-for-me'

export type NotificationType = 'info' | 'success' | 'error' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  target?: 'admin' | 'user' | 'all'  // 알림 대상 추가
  userId?: string  // 특정 사용자를 위한 알림인 경우
}

class NotificationService {
  private notifications: Notification[] = []
  private storageKey = 'hiko-notifications'

  constructor() {
    this.loadNotifications()
  }

  private loadNotifications() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }))
      }
    }
  }

  private saveNotifications() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.notifications))
    }
  }

  private createNotification(
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string,
    target: 'admin' | 'user' | 'all' = 'all',
    userId?: string
  ): Notification {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      actionUrl,
      target,
      userId
    }

    this.notifications.unshift(notification)
    this.saveNotifications()
    
    // 현재 사용자 정보 확인 (localStorage에서)
    const currentUserStr = localStorage.getItem('currentUser')
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null
    
    // 알림 대상이 맞는 경우에만 토스트 표시
    const shouldShowToast = 
      target === 'all' || 
      (target === 'admin' && currentUser?.role === 'admin') ||
      (target === 'user' && userId === currentUser?.id)
    
    if (shouldShowToast) {
      const toastType = type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'message'
      toast[toastType](title, {
        description: message,
        action: actionUrl ? {
          label: '확인하기',
          onClick: () => window.location.href = actionUrl
        } : undefined
      })
    }

    return notification
  }

  // Buy for Me 요청 관련 알림
  notifyNewRequest(request: BuyForMeRequest) {
    // 관리자에게만 표시되는 알림
    return this.createNotification(
      'info',
      '새로운 대리 구매 요청',
      `${request.shippingInfo.name}님이 새로운 요청을 보냈습니다.`,
      `/admin/buy-for-me/${request.id}`,
      'admin'  // 관리자만
    )
  }

  notifyQuoteSent(request: BuyForMeRequest) {
    // 해당 사용자에게만 표시되는 알림
    return this.createNotification(
      'success',
      '견적서가 발송되었습니다',
      `주문번호 ${request.id.slice(0, 8)}의 견적서를 확인해주세요.`,
      `/mypage/orders/${request.id}/quote`,
      'user',  // 특정 사용자만
      request.userId
    )
  }

  notifyQuoteApproved(request: BuyForMeRequest) {
    // 관리자에게만 표시되는 알림
    return this.createNotification(
      'success',
      '견적이 승인되었습니다',
      `${request.shippingInfo.name}님이 견적을 승인했습니다. 결제를 진행해주세요.`,
      `/admin/buy-for-me/${request.id}`,
      'admin'  // 관리자만
    )
  }

  notifyPaymentConfirmed(request: BuyForMeRequest) {
    // 해당 사용자에게만 표시되는 알림
    return this.createNotification(
      'success',
      '결제가 확인되었습니다',
      `주문번호 ${request.id.slice(0, 8)}의 결제가 확인되었습니다.`,
      `/mypage/orders/${request.id}`,
      'user',  // 특정 사용자만
      request.userId
    )
  }

  notifyOrderShipped(request: BuyForMeRequest) {
    // 해당 사용자에게만 표시되는 알림
    return this.createNotification(
      'info',
      '상품이 발송되었습니다',
      `트래킹 번호: ${request.orderInfo?.trackingNumber || '확인 중'}`,
      `/mypage/orders/${request.id}`,
      'user',  // 특정 사용자만
      request.userId
    )
  }

  notifyOrderDelivered(request: BuyForMeRequest) {
    // 해당 사용자에게만 표시되는 알림
    return this.createNotification(
      'success',
      '배송이 완료되었습니다',
      '상품이 안전하게 도착했습니다. 이용해 주셔서 감사합니다.',
      `/mypage/orders/${request.id}`,
      'user',  // 특정 사용자만
      request.userId
    )
  }

  // 일반 알림
  success(title: string, message: string, actionUrl?: string) {
    return this.createNotification('success', title, message, actionUrl, 'all')
  }

  error(title: string, message: string, actionUrl?: string) {
    return this.createNotification('error', title, message, actionUrl, 'all')
  }

  info(title: string, message: string, actionUrl?: string) {
    return this.createNotification('info', title, message, actionUrl, 'all')
  }

  warning(title: string, message: string, actionUrl?: string) {
    return this.createNotification('warning', title, message, actionUrl, 'all')
  }

  // 알림 관리
  getNotifications(onlyUnread = false): Notification[] {
    // 현재 사용자 정보 확인
    const currentUserStr = localStorage.getItem('currentUser')
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null
    
    // 사용자에 맞는 알림만 필터링
    const filtered = this.notifications.filter(n => {
      if (n.target === 'all') return true
      if (n.target === 'admin' && currentUser?.role === 'admin') return true
      if (n.target === 'user' && n.userId === currentUser?.id) return true
      return false
    })
    
    return onlyUnread 
      ? filtered.filter(n => !n.read)
      : filtered
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.saveNotifications()
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true)
    this.saveNotifications()
  }

  clearNotifications() {
    this.notifications = []
    this.saveNotifications()
  }

  getUnreadCount(): number {
    // 현재 사용자 정보 확인
    const currentUserStr = localStorage.getItem('currentUser')
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null
    
    // 사용자에 맞는 알림만 카운트
    return this.notifications.filter(n => {
      // 읽지 않은 알림인지 확인
      if (n.read) return false
      
      // 대상 확인
      if (n.target === 'all') return true
      if (n.target === 'admin' && currentUser?.role === 'admin') return true
      if (n.target === 'user' && n.userId === currentUser?.id) return true
      return false
    }).length
  }
}

export const notificationService = new NotificationService()