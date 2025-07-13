/**
 * Shipping Automation Service
 * 배송 추적 자동화 서비스
 */

import { BuyForMeRequest } from '@/types/buy-for-me'
import { createShippingUpdateNotification } from './notification-service'

export interface ShippingProvider {
  id: string
  name: string
  nameKo: string
  trackingUrlTemplate: string
  apiEndpoint?: string
  apiKey?: string
  supportedCountries: string[]
  estimatedDays: {
    domestic: number
    international: number
  }
}

export interface TrackingEvent {
  id: string
  timestamp: Date
  status: string
  statusKo: string
  location: string
  description: string
  nextLocation?: string
}

export interface ShippingTracking {
  id: string
  orderId: string
  trackingNumber: string
  provider: ShippingProvider
  currentStatus: string
  currentStatusKo: string
  events: TrackingEvent[]
  estimatedDelivery?: Date
  actualDelivery?: Date
  lastChecked: Date
  isDelivered: boolean
  recipientInfo: {
    name: string
    phone?: string
    address: string
  }
  metadata?: {
    weight?: number
    dimensions?: string
    value?: number
    insurance?: boolean
  }
}

export interface AutoTrackingRule {
  id: string
  name: string
  description: string
  conditions: {
    providers: string[]
    statuses: string[]
    delayThreshold: number // hours
  }
  actions: {
    notifyCustomer: boolean
    notifyAdmin: boolean
    autoRetry: boolean
    escalateIssue: boolean
  }
  enabled: boolean
}

/**
 * 배송 업체 정의
 */
const shippingProviders: Record<string, ShippingProvider> = {
  cj_logistics: {
    id: 'cj_logistics',
    name: 'CJ Logistics',
    nameKo: 'CJ대한통운',
    trackingUrlTemplate: 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvNo={trackingNumber}',
    supportedCountries: ['KR'],
    estimatedDays: { domestic: 2, international: 7 }
  },
  hanjin: {
    id: 'hanjin',
    name: 'Hanjin Express',
    nameKo: '한진택배',
    trackingUrlTemplate: 'https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnum={trackingNumber}',
    supportedCountries: ['KR'],
    estimatedDays: { domestic: 2, international: 7 }
  },
  lotte: {
    id: 'lotte',
    name: 'Lotte Global Logistics',
    nameKo: '롯데택배',
    trackingUrlTemplate: 'https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo={trackingNumber}',
    supportedCountries: ['KR'],
    estimatedDays: { domestic: 2, international: 7 }
  },
  korea_post: {
    id: 'korea_post',
    name: 'Korea Post',
    nameKo: '우체국택배',
    trackingUrlTemplate: 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1={trackingNumber}',
    supportedCountries: ['KR'],
    estimatedDays: { domestic: 3, international: 10 }
  },
  dhl: {
    id: 'dhl',
    name: 'DHL Express',
    nameKo: 'DHL',
    trackingUrlTemplate: 'https://www.dhl.com/kr-ko/home/tracking/tracking-express.html?submit=1&tracking-id={trackingNumber}',
    supportedCountries: ['KR', 'US', 'CN', 'JP'],
    estimatedDays: { domestic: 1, international: 3 }
  },
  fedex: {
    id: 'fedex',
    name: 'FedEx',
    nameKo: '페덱스',
    trackingUrlTemplate: 'https://www.fedex.com/fedextrack/?trknbr={trackingNumber}',
    supportedCountries: ['KR', 'US', 'CN', 'JP'],
    estimatedDays: { domestic: 1, international: 3 }
  }
}

/**
 * 배송 추적 자동화 서비스
 */
export class ShippingAutomationService {
  private trackingRules: AutoTrackingRule[] = []
  private activeTrackings: Map<string, ShippingTracking> = new Map()

  constructor() {
    this.initializeDefaultRules()
    this.startAutoTracking()
  }

  /**
   * 새 배송 추적 등록
   */
  async registerTracking(
    orderId: string,
    trackingNumber: string,
    providerId: string,
    recipientInfo: {
      name: string
      phone?: string
      address: string
    },
    metadata?: {
      weight?: number
      dimensions?: string
      value?: number
      insurance?: boolean
    }
  ): Promise<ShippingTracking> {
    const provider = shippingProviders[providerId]
    if (!provider) {
      throw new Error(`Unsupported shipping provider: ${providerId}`)
    }

    const tracking: ShippingTracking = {
      id: this.generateTrackingId(),
      orderId,
      trackingNumber,
      provider,
      currentStatus: 'registered',
      currentStatusKo: '접수됨',
      events: [{
        id: this.generateEventId(),
        timestamp: new Date(),
        status: 'registered',
        statusKo: '접수됨',
        location: '발송지',
        description: '배송 접수가 완료되었습니다.'
      }],
      lastChecked: new Date(),
      isDelivered: false,
      recipientInfo,
      metadata
    }

    this.activeTrackings.set(tracking.id, tracking)
    await this.saveTrackingToStorage(tracking)

    // 초기 추적 정보 조회 시도
    await this.updateTrackingInfo(tracking.id)

    return tracking
  }

  /**
   * 배송 추적 정보 업데이트
   */
  async updateTrackingInfo(trackingId: string): Promise<ShippingTracking | null> {
    const tracking = this.activeTrackings.get(trackingId)
    if (!tracking || tracking.isDelivered) return null

    try {
      // 실제 구현에서는 각 배송업체 API 호출
      const trackingData = await this.fetchTrackingData(tracking)
      
      if (trackingData) {
        const updatedTracking = this.mergeTrackingData(tracking, trackingData)
        this.activeTrackings.set(trackingId, updatedTracking)
        await this.saveTrackingToStorage(updatedTracking)

        // 상태 변경 시 알림 발송
        await this.checkAndSendNotifications(updatedTracking, tracking)

        return updatedTracking
      }
    } catch (error) {
      console.error(`Failed to update tracking for ${trackingId}:`, error)
    }

    return tracking
  }

  /**
   * 모든 활성 추적 정보 일괄 업데이트
   */
  async updateAllTrackings(): Promise<void> {
    const activeTrackingIds = Array.from(this.activeTrackings.keys())
      .filter(id => !this.activeTrackings.get(id)!.isDelivered)

    console.log(`Updating ${activeTrackingIds.length} active trackings...`)

    // 배치 처리로 API 부하 분산
    const batchSize = 5
    for (let i = 0; i < activeTrackingIds.length; i += batchSize) {
      const batch = activeTrackingIds.slice(i, i + batchSize)
      await Promise.all(batch.map(id => this.updateTrackingInfo(id)))
      
      // API 제한을 위한 딜레이
      if (i + batchSize < activeTrackingIds.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  /**
   * 배송업체별 추적 데이터 조회
   */
  private async fetchTrackingData(tracking: ShippingTracking): Promise<any> {
    // 실제 구현에서는 각 배송업체의 API를 호출
    // 현재는 모의 데이터 반환
    return this.generateMockTrackingData(tracking)
  }

  /**
   * 모의 추적 데이터 생성
   */
  private generateMockTrackingData(tracking: ShippingTracking): any {
    const statuses = [
      { status: 'picked_up', statusKo: '수거완료', location: '발송지 집하센터' },
      { status: 'in_transit', statusKo: '배송중', location: '중간 허브센터' },
      { status: 'out_for_delivery', statusKo: '배송출발', location: '배송지 센터' },
      { status: 'delivered', statusKo: '배송완료', location: '수령인' }
    ]

    const currentIndex = Math.min(
      tracking.events.length,
      statuses.length - 1
    )

    if (currentIndex < statuses.length) {
      const newStatus = statuses[currentIndex]
      return {
        status: newStatus.status,
        statusKo: newStatus.statusKo,
        events: [{
          timestamp: new Date(),
          status: newStatus.status,
          statusKo: newStatus.statusKo,
          location: newStatus.location,
          description: `${newStatus.statusKo} - ${newStatus.location}에서 처리되었습니다.`
        }],
        estimatedDelivery: this.calculateEstimatedDelivery(tracking),
        isDelivered: newStatus.status === 'delivered'
      }
    }

    return null
  }

  /**
   * 예상 배송일 계산
   */
  private calculateEstimatedDelivery(tracking: ShippingTracking): Date {
    const estimatedDays = tracking.provider.estimatedDays.domestic
    const startDate = tracking.events[0].timestamp
    return new Date(startDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000)
  }

  /**
   * 추적 데이터 병합
   */
  private mergeTrackingData(
    existing: ShippingTracking,
    newData: any
  ): ShippingTracking {
    const newEvents = newData.events?.map((event: any) => ({
      ...event,
      id: this.generateEventId()
    })) || []

    // 중복 이벤트 제거
    const allEvents = [...existing.events, ...newEvents]
    const uniqueEvents = allEvents.filter((event, index, array) => 
      array.findIndex(e => 
        e.timestamp.getTime() === event.timestamp.getTime() && 
        e.status === event.status
      ) === index
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return {
      ...existing,
      currentStatus: newData.status || existing.currentStatus,
      currentStatusKo: newData.statusKo || existing.currentStatusKo,
      events: uniqueEvents,
      estimatedDelivery: newData.estimatedDelivery || existing.estimatedDelivery,
      actualDelivery: newData.isDelivered ? new Date() : existing.actualDelivery,
      lastChecked: new Date(),
      isDelivered: newData.isDelivered || existing.isDelivered
    }
  }

  /**
   * 알림 확인 및 발송
   */
  private async checkAndSendNotifications(
    updated: ShippingTracking,
    previous: ShippingTracking
  ): Promise<void> {
    // 상태가 변경된 경우에만 알림 발송
    if (updated.currentStatus !== previous.currentStatus) {
      try {
        // 실제 구현에서는 사용자 ID 조회 필요
        const userId = this.getUserIdFromOrderId(updated.orderId)
        
        // 배송 상태 업데이트 알림 생성
        const statusLabels: Record<string, string> = {
          picked_up: '상품이 수거되었습니다',
          in_transit: '배송이 시작되었습니다',
          out_for_delivery: '배송 출발했습니다',
          delivered: '배송이 완료되었습니다'
        }

        await createShippingUpdateNotification(
          userId,
          { id: updated.orderId } as BuyForMeRequest,
          statusLabels[updated.currentStatus] || updated.currentStatusKo,
          updated.trackingNumber
        )
      } catch (error) {
        console.error('Failed to send shipping notification:', error)
      }
    }

    // 자동화 규칙 적용
    await this.applyAutomationRules(updated)
  }

  /**
   * 자동화 규칙 적용
   */
  private async applyAutomationRules(tracking: ShippingTracking): Promise<void> {
    for (const rule of this.trackingRules.filter(r => r.enabled)) {
      if (this.shouldApplyRule(rule, tracking)) {
        await this.executeRuleActions(rule, tracking)
      }
    }
  }

  /**
   * 규칙 적용 조건 확인
   */
  private shouldApplyRule(rule: AutoTrackingRule, tracking: ShippingTracking): boolean {
    const { conditions } = rule

    // 배송업체 조건 확인
    if (conditions.providers.length > 0 && 
        !conditions.providers.includes(tracking.provider.id)) {
      return false
    }

    // 상태 조건 확인
    if (conditions.statuses.length > 0 && 
        !conditions.statuses.includes(tracking.currentStatus)) {
      return false
    }

    // 지연 임계값 확인
    if (conditions.delayThreshold > 0) {
      const hoursFromLastUpdate = (Date.now() - tracking.lastChecked.getTime()) / (1000 * 60 * 60)
      if (hoursFromLastUpdate < conditions.delayThreshold) {
        return false
      }
    }

    return true
  }

  /**
   * 규칙 액션 실행
   */
  private async executeRuleActions(rule: AutoTrackingRule, tracking: ShippingTracking): Promise<void> {
    const { actions } = rule

    if (actions.notifyCustomer || actions.notifyAdmin) {
      // 알림 발송 로직
      console.log(`Executing rule "${rule.name}" for tracking ${tracking.id}`)
    }

    if (actions.autoRetry) {
      // 자동 재시도 로직
      setTimeout(() => {
        this.updateTrackingInfo(tracking.id)
      }, 30 * 60 * 1000) // 30분 후 재시도
    }

    if (actions.escalateIssue) {
      // 이슈 에스컬레이션 로직
      console.warn(`Escalating issue for tracking ${tracking.id}`)
    }
  }

  /**
   * 자동 추적 시작
   */
  private startAutoTracking(): void {
    // 30분마다 모든 추적 정보 업데이트
    setInterval(() => {
      this.updateAllTrackings()
    }, 30 * 60 * 1000)

    console.log('Shipping automation service started')
  }

  /**
   * 기본 자동화 규칙 초기화
   */
  private initializeDefaultRules(): void {
    this.trackingRules = [
      {
        id: 'rule-delivery-delay',
        name: '배송 지연 알림',
        description: '예상 배송일을 24시간 초과한 경우 알림',
        conditions: {
          providers: [],
          statuses: ['in_transit', 'out_for_delivery'],
          delayThreshold: 24
        },
        actions: {
          notifyCustomer: true,
          notifyAdmin: true,
          autoRetry: true,
          escalateIssue: false
        },
        enabled: true
      },
      {
        id: 'rule-pickup-delay',
        name: '수거 지연 감지',
        description: '접수 후 48시간 동안 수거되지 않은 경우',
        conditions: {
          providers: [],
          statuses: ['registered'],
          delayThreshold: 48
        },
        actions: {
          notifyCustomer: false,
          notifyAdmin: true,
          autoRetry: true,
          escalateIssue: true
        },
        enabled: true
      },
      {
        id: 'rule-international-tracking',
        name: '국제배송 추적 강화',
        description: '국제배송의 경우 더 자주 업데이트',
        conditions: {
          providers: ['dhl', 'fedex'],
          statuses: [],
          delayThreshold: 12
        },
        actions: {
          notifyCustomer: false,
          notifyAdmin: false,
          autoRetry: true,
          escalateIssue: false
        },
        enabled: true
      }
    ]
  }

  /**
   * 유틸리티 메서드들
   */
  private generateTrackingId(): string {
    return `track-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  }

  private getUserIdFromOrderId(orderId: string): string {
    // 실제 구현에서는 DB에서 주문 정보를 조회하여 사용자 ID 반환
    return `user-${orderId.split('-')[1] || 'unknown'}`
  }

  private async saveTrackingToStorage(tracking: ShippingTracking): Promise<void> {
    try {
      const key = `shipping_tracking_${tracking.id}`
      localStorage.setItem(key, JSON.stringify({
        ...tracking,
        events: tracking.events.map(event => ({
          ...event,
          timestamp: event.timestamp.toISOString()
        }))
      }))
    } catch (error) {
      console.error('Failed to save tracking to storage:', error)
    }
  }

  /**
   * 공개 메서드들
   */
  getProviders(): ShippingProvider[] {
    return Object.values(shippingProviders)
  }

  getTracking(trackingId: string): ShippingTracking | null {
    return this.activeTrackings.get(trackingId) || null
  }

  getTrackingByOrderId(orderId: string): ShippingTracking | null {
    return Array.from(this.activeTrackings.values())
      .find(tracking => tracking.orderId === orderId) || null
  }

  getAllActiveTrackings(): ShippingTracking[] {
    return Array.from(this.activeTrackings.values())
      .filter(tracking => !tracking.isDelivered)
  }

  getTrackingUrl(tracking: ShippingTracking): string {
    return tracking.provider.trackingUrlTemplate
      .replace('{trackingNumber}', tracking.trackingNumber)
  }

  addAutomationRule(rule: Omit<AutoTrackingRule, 'id'>): AutoTrackingRule {
    const newRule: AutoTrackingRule = {
      ...rule,
      id: `rule-${Date.now()}`
    }
    this.trackingRules.push(newRule)
    return newRule
  }

  updateAutomationRule(id: string, updates: Partial<AutoTrackingRule>): AutoTrackingRule | null {
    const index = this.trackingRules.findIndex(rule => rule.id === id)
    if (index === -1) return null

    this.trackingRules[index] = { ...this.trackingRules[index], ...updates }
    return this.trackingRules[index]
  }

  deleteAutomationRule(id: string): boolean {
    const index = this.trackingRules.findIndex(rule => rule.id === id)
    if (index === -1) return false

    this.trackingRules.splice(index, 1)
    return true
  }

  getAutomationRules(): AutoTrackingRule[] {
    return [...this.trackingRules]
  }
}

// 싱글톤 인스턴스
export const shippingAutomationService = new ShippingAutomationService()