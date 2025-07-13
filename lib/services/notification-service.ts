/**
 * Real-time Notification Service
 * 실시간 알림 시스템 서비스
 */

import { BuyForMeRequest } from '@/types/buy-for-me'
import { DetailedQuotation } from '@/types/quotation'
import { PriceCheckResult } from './price-verification'

export interface NotificationData {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'unread' | 'read' | 'dismissed'
  createdAt: Date
  readAt?: Date
  expiresAt?: Date
  actionUrl?: string
  actionLabel?: string
}

export type NotificationType = 
  | 'order_status_update'
  | 'quote_received'
  | 'quote_approved'
  | 'payment_reminder'
  | 'shipping_update'
  | 'price_alert'
  | 'system_maintenance'
  | 'promotional'
  | 'admin_notification'

export interface NotificationTemplate {
  type: NotificationType
  titleTemplate: string
  messageTemplate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  ttl?: number // Time to live in hours
  requiresAction?: boolean
}

export interface NotificationPreferences {
  userId: string
  orderUpdates: boolean
  priceAlerts: boolean
  promotional: boolean
  email: boolean
  push: boolean
  inApp: boolean
  quietHours: {
    enabled: boolean
    start: string // HH:mm format
    end: string // HH:mm format
  }
}

/**
 * 알림 템플릿 정의
 */
const notificationTemplates: Record<NotificationType, NotificationTemplate> = {
  order_status_update: {
    type: 'order_status_update',
    titleTemplate: '주문 상태 업데이트',
    messageTemplate: '주문 #{orderId}의 상태가 {status}(으)로 변경되었습니다.',
    priority: 'medium',
    ttl: 72,
    requiresAction: true
  },
  quote_received: {
    type: 'quote_received',
    titleTemplate: '견적서 도착',
    messageTemplate: '{productTitle}에 대한 견적서가 도착했습니다. 총 금액: ₩{totalAmount}',
    priority: 'high',
    ttl: 168, // 7 days
    requiresAction: true
  },
  quote_approved: {
    type: 'quote_approved',
    titleTemplate: '견적서 승인 완료',
    messageTemplate: '견적서가 승인되었습니다. 결제를 진행해주세요.',
    priority: 'high',
    ttl: 24,
    requiresAction: true
  },
  payment_reminder: {
    type: 'payment_reminder',
    titleTemplate: '결제 안내',
    messageTemplate: '주문 #{orderId} 결제 기한이 {dueDate}입니다. 결제를 완료해주세요.',
    priority: 'urgent',
    ttl: 48,
    requiresAction: true
  },
  shipping_update: {
    type: 'shipping_update',
    titleTemplate: '배송 정보 업데이트',
    messageTemplate: '주문하신 상품이 {status}입니다. 운송장번호: {trackingNumber}',
    priority: 'medium',
    ttl: 72,
    requiresAction: false
  },
  price_alert: {
    type: 'price_alert',
    titleTemplate: '가격 변동 알림',
    messageTemplate: '{productTitle}의 가격이 {changeType}했습니다. 현재 가격: ₩{currentPrice}',
    priority: 'medium',
    ttl: 24,
    requiresAction: false
  },
  system_maintenance: {
    type: 'system_maintenance',
    titleTemplate: '시스템 점검 안내',
    messageTemplate: '{date} {time}에 시스템 점검이 예정되어 있습니다.',
    priority: 'low',
    ttl: 168,
    requiresAction: false
  },
  promotional: {
    type: 'promotional',
    titleTemplate: '특별 혜택',
    messageTemplate: '{offerTitle} - {description}',
    priority: 'low',
    ttl: 72,
    requiresAction: false
  },
  admin_notification: {
    type: 'admin_notification',
    titleTemplate: '관리자 알림',
    messageTemplate: '{message}',
    priority: 'high',
    ttl: 24,
    requiresAction: true
  }
}

/**
 * 기본 알림 설정
 */
const defaultNotificationPreferences: Omit<NotificationPreferences, 'userId'> = {
  orderUpdates: true,
  priceAlerts: true,
  promotional: false,
  email: true,
  push: true,
  inApp: true,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  }
}

/**
 * 알림 생성
 */
export function createNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, any>,
  overrides?: Partial<NotificationData>
): NotificationData {
  const template = notificationTemplates[type]
  const id = generateNotificationId()
  
  const title = interpolateTemplate(template.titleTemplate, data)
  const message = interpolateTemplate(template.messageTemplate, data)
  
  const expiresAt = template.ttl 
    ? new Date(Date.now() + template.ttl * 60 * 60 * 1000)
    : undefined

  return {
    id,
    userId,
    type,
    title,
    message,
    data,
    priority: template.priority,
    status: 'unread',
    createdAt: new Date(),
    expiresAt,
    actionUrl: generateActionUrl(type, data),
    actionLabel: generateActionLabel(type),
    ...overrides
  }
}

/**
 * 주문 상태 업데이트 알림
 */
export function createOrderStatusNotification(
  userId: string,
  request: BuyForMeRequest
): NotificationData {
  const statusLabels: Record<BuyForMeRequest['status'], string> = {
    pending_review: '검토 대기',
    quote_sent: '견적 발송',
    quote_approved: '견적 승인',
    payment_pending: '결제 대기',
    payment_completed: '결제 완료',
    purchasing: '구매 진행',
    shipping: '배송 중',
    delivered: '배송 완료',
    cancelled: '취소됨'
  }

  return createNotification(userId, 'order_status_update', {
    orderId: request.id,
    status: statusLabels[request.status],
    productTitle: request.productInfo.title
  })
}

/**
 * 견적서 수신 알림
 */
export function createQuoteReceivedNotification(
  userId: string,
  quotation: DetailedQuotation
): NotificationData {
  return createNotification(userId, 'quote_received', {
    quotationId: quotation.id,
    productTitle: quotation.productInfo.title,
    totalAmount: quotation.pricing.totalAmount.toLocaleString()
  })
}

/**
 * 결제 알림
 */
export function createPaymentReminderNotification(
  userId: string,
  request: BuyForMeRequest,
  dueDate: Date
): NotificationData {
  return createNotification(userId, 'payment_reminder', {
    orderId: request.id,
    dueDate: dueDate.toLocaleDateString('ko-KR'),
    productTitle: request.productInfo.title
  }, {
    priority: 'urgent'
  })
}

/**
 * 배송 업데이트 알림
 */
export function createShippingUpdateNotification(
  userId: string,
  request: BuyForMeRequest,
  status: string,
  trackingNumber?: string
): NotificationData {
  return createNotification(userId, 'shipping_update', {
    orderId: request.id,
    status,
    trackingNumber: trackingNumber || '',
    productTitle: request.productInfo.title
  })
}

/**
 * 가격 변동 알림
 */
export function createPriceAlertNotification(
  userId: string,
  productTitle: string,
  priceResult: PriceCheckResult,
  changeType: 'increase' | 'decrease'
): NotificationData {
  return createNotification(userId, 'price_alert', {
    productTitle,
    changeType: changeType === 'increase' ? '상승' : '하락',
    currentPrice: priceResult.currentPrice?.toLocaleString() || '확인 불가',
    originalPrice: priceResult.originalPrice?.toLocaleString() || ''
  })
}

/**
 * 템플릿 문자열 보간
 */
function interpolateTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key]?.toString() || match
  })
}

/**
 * 액션 URL 생성
 */
function generateActionUrl(type: NotificationType, data: Record<string, any>): string | undefined {
  switch (type) {
    case 'order_status_update':
      return `/mypage/orders/${data.orderId}`
    case 'quote_received':
      return `/mypage/orders/${data.orderId}/quote`
    case 'quote_approved':
    case 'payment_reminder':
      return `/mypage/orders/${data.orderId}/payment`
    case 'shipping_update':
      return `/mypage/orders/${data.orderId}`
    default:
      return undefined
  }
}

/**
 * 액션 라벨 생성
 */
function generateActionLabel(type: NotificationType): string | undefined {
  switch (type) {
    case 'order_status_update':
      return '주문 상세보기'
    case 'quote_received':
      return '견적서 확인'
    case 'quote_approved':
    case 'payment_reminder':
      return '결제하기'
    case 'shipping_update':
      return '배송 추적'
    default:
      return undefined
  }
}

/**
 * 알림 ID 생성
 */
function generateNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
}

/**
 * 조용한 시간 확인
 */
export function isQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHours.enabled) return false
  
  const now = new Date()
  const currentTime = now.getHours() * 100 + now.getMinutes()
  
  const start = parseTime(preferences.quietHours.start)
  const end = parseTime(preferences.quietHours.end)
  
  if (start <= end) {
    return currentTime >= start && currentTime <= end
  } else {
    // Overnight quiet hours (e.g., 22:00 to 08:00)
    return currentTime >= start || currentTime <= end
  }
}

/**
 * 시간 문자열 파싱 (HH:mm -> number)
 */
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 100 + minutes
}

/**
 * 알림 우선순위에 따른 배치 전송
 */
export function batchNotificationsByPriority(
  notifications: NotificationData[]
): {
  urgent: NotificationData[]
  high: NotificationData[]
  medium: NotificationData[]
  low: NotificationData[]
} {
  const result = {
    urgent: [] as NotificationData[],
    high: [] as NotificationData[],
    medium: [] as NotificationData[],
    low: [] as NotificationData[]
  }
  
  notifications.forEach(notification => {
    result[notification.priority].push(notification)
  })
  
  return result
}

/**
 * 알림 전송 스케줄링
 */
export interface NotificationSchedule {
  id: string
  userId: string
  type: NotificationType
  data: Record<string, any>
  scheduledAt: Date
  sent: boolean
  attempts: number
  maxAttempts: number
}

export function scheduleNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, any>,
  scheduledAt: Date,
  maxAttempts: number = 3
): NotificationSchedule {
  return {
    id: generateNotificationId(),
    userId,
    type,
    data,
    scheduledAt,
    sent: false,
    attempts: 0,
    maxAttempts
  }
}

/**
 * 만료된 알림 정리
 */
export function cleanupExpiredNotifications(notifications: NotificationData[]): NotificationData[] {
  const now = new Date()
  return notifications.filter(notification => 
    !notification.expiresAt || notification.expiresAt > now
  )
}

/**
 * 알림 그룹화 (같은 유형의 알림들을 하나로 합침)
 */
export function groupSimilarNotifications(notifications: NotificationData[]): NotificationData[] {
  const groups = new Map<string, NotificationData[]>()
  
  notifications.forEach(notification => {
    const key = `${notification.type}-${notification.userId}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(notification)
  })
  
  const result: NotificationData[] = []
  
  groups.forEach((groupNotifications, key) => {
    if (groupNotifications.length === 1) {
      result.push(groupNotifications[0])
    } else {
      // 같은 유형의 알림이 여러 개면 가장 최근 것을 기준으로 합침
      const latest = groupNotifications.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      )[0]
      
      const count = groupNotifications.length
      const grouped: NotificationData = {
        ...latest,
        id: generateNotificationId(),
        title: `${latest.title} 외 ${count - 1}건`,
        message: `${latest.message} (총 ${count}개의 알림)`,
        data: {
          ...latest.data,
          groupedCount: count,
          groupedIds: groupNotifications.map(n => n.id)
        }
      }
      
      result.push(grouped)
    }
  })
  
  return result
}

/**
 * 기본 설정 가져오기
 */
export function getDefaultNotificationPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    ...defaultNotificationPreferences
  }
}