/**
 * Inventory Automation Service
 * 재고 확인 자동화 서비스
 */

import { BuyForMeRequest } from '@/types/buy-for-me'
import { HotDeal } from '@/types/hotdeal'

export interface InventoryStatus {
  id: string
  productId: string
  productUrl: string
  productTitle: string
  currentStock: number
  previousStock: number
  stockLevel: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown'
  isAvailable: boolean
  price: number
  priceChanged: boolean
  lastChecked: Date
  nextCheckAt: Date
  checkInterval: number // minutes
  site: string
  metadata?: {
    variant?: string
    seller?: string
    category?: string
    brand?: string
  }
}

export interface InventoryAlert {
  id: string
  inventoryId: string
  alertType: 'out_of_stock' | 'low_stock' | 'back_in_stock' | 'price_change'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  triggered: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  relatedOrders: string[] // Order IDs that might be affected
}

export interface InventoryRule {
  id: string
  name: string
  description: string
  conditions: {
    sites: string[]
    categories: string[]
    stockThreshold: number
    priceChangePercent: number
  }
  actions: {
    alertAdmin: boolean
    alertCustomers: boolean
    pauseOrders: boolean
    findAlternatives: boolean
  }
  checkInterval: number // minutes
  enabled: boolean
  priority: number
}

export interface StockCheckResult {
  productId: string
  stock: number
  isAvailable: boolean
  price: number
  lastModified: Date
  checkSuccessful: boolean
  errorMessage?: string
  detectedChanges: {
    stockChanged: boolean
    priceChanged: boolean
    availabilityChanged: boolean
  }
}

/**
 * 재고 자동화 서비스
 */
export class InventoryAutomationService {
  private inventoryStatuses: Map<string, InventoryStatus> = new Map()
  private inventoryRules: InventoryRule[] = []
  private alerts: InventoryAlert[] = []
  private checkQueue: Set<string> = new Set()
  private isRunning = false

  constructor() {
    this.initializeDefaultRules()
    this.startInventoryMonitoring()
  }

  /**
   * 새 상품 재고 모니터링 등록
   */
  async registerInventoryTracking(
    productUrl: string,
    productTitle: string,
    site: string,
    metadata?: {
      variant?: string
      seller?: string
      category?: string
      brand?: string
    }
  ): Promise<InventoryStatus> {
    const productId = this.generateProductId(productUrl)
    
    // 기존 등록 여부 확인
    if (this.inventoryStatuses.has(productId)) {
      return this.inventoryStatuses.get(productId)!
    }

    const inventory: InventoryStatus = {
      id: this.generateInventoryId(),
      productId,
      productUrl,
      productTitle,
      currentStock: -1, // 초기값 (미확인)
      previousStock: -1,
      stockLevel: 'unknown',
      isAvailable: false,
      price: 0,
      priceChanged: false,
      lastChecked: new Date(0), // 아직 체크하지 않음
      nextCheckAt: new Date(),
      checkInterval: this.determineCheckInterval(site, metadata?.category),
      site,
      metadata
    }

    this.inventoryStatuses.set(productId, inventory)
    await this.saveInventoryToStorage(inventory)

    // 즉시 첫 번째 재고 확인 실행
    await this.checkInventoryStatus(productId)

    return inventory
  }

  /**
   * 재고 상태 확인
   */
  async checkInventoryStatus(productId: string): Promise<StockCheckResult | null> {
    const inventory = this.inventoryStatuses.get(productId)
    if (!inventory) return null

    try {
      const checkResult = await this.performStockCheck(inventory)
      
      if (checkResult.checkSuccessful) {
        const updatedInventory = this.updateInventoryStatus(inventory, checkResult)
        this.inventoryStatuses.set(productId, updatedInventory)
        await this.saveInventoryToStorage(updatedInventory)

        // 변경사항 확인 및 알림 생성
        await this.processInventoryChanges(updatedInventory, checkResult)

        // 다음 체크 시간 설정
        updatedInventory.nextCheckAt = new Date(
          Date.now() + updatedInventory.checkInterval * 60 * 1000
        )
      }

      return checkResult
    } catch (error) {
      console.error(`Failed to check inventory for ${productId}:`, error)
      
      // 에러 발생 시 다음 체크를 지연
      inventory.nextCheckAt = new Date(Date.now() + 30 * 60 * 1000) // 30분 후
      
      return {
        productId,
        stock: -1,
        isAvailable: false,
        price: inventory.price,
        lastModified: new Date(),
        checkSuccessful: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        detectedChanges: {
          stockChanged: false,
          priceChanged: false,
          availabilityChanged: false
        }
      }
    }
  }

  /**
   * 실제 재고 체크 수행 (웹 스크래핑)
   */
  private async performStockCheck(inventory: InventoryStatus): Promise<StockCheckResult> {
    // 실제 구현에서는 각 사이트별로 웹 스크래핑 또는 API 호출
    // 현재는 모의 데이터 생성
    return this.generateMockStockCheck(inventory)
  }

  /**
   * 모의 재고 체크 데이터 생성
   */
  private generateMockStockCheck(inventory: InventoryStatus): StockCheckResult {
    // 이전 상태를 기반으로 변화 시뮬레이션
    const random = Math.random()
    let newStock = inventory.currentStock
    let newPrice = inventory.price || 50000 + Math.random() * 200000
    let isAvailable = inventory.isAvailable

    // 재고 변화 시뮬레이션
    if (inventory.currentStock === -1) {
      // 첫 번째 체크
      newStock = Math.floor(Math.random() * 100) + 1
      isAvailable = newStock > 0
    } else {
      // 기존 재고를 기반으로 변화
      if (random < 0.1) {
        // 10% 확률로 품절
        newStock = 0
        isAvailable = false
      } else if (random < 0.2) {
        // 10% 확률로 재고 감소
        newStock = Math.max(0, inventory.currentStock - Math.floor(Math.random() * 5) - 1)
        isAvailable = newStock > 0
      } else if (random < 0.05) {
        // 5% 확률로 재고 증가 (재입고)
        newStock = inventory.currentStock + Math.floor(Math.random() * 20) + 10
        isAvailable = true
      } else {
        // 나머지는 변화 없음
        newStock = inventory.currentStock
      }
    }

    // 가격 변화 시뮬레이션 (5% 확률)
    if (Math.random() < 0.05) {
      const priceChangePercent = (Math.random() - 0.5) * 0.2 // ±10%
      newPrice = inventory.price * (1 + priceChangePercent)
    }

    const stockChanged = newStock !== inventory.currentStock
    const priceChanged = Math.abs(newPrice - inventory.price) > inventory.price * 0.01 // 1% 이상 변화
    const availabilityChanged = isAvailable !== inventory.isAvailable

    return {
      productId: inventory.productId,
      stock: newStock,
      isAvailable,
      price: newPrice,
      lastModified: new Date(),
      checkSuccessful: true,
      detectedChanges: {
        stockChanged,
        priceChanged,
        availabilityChanged
      }
    }
  }

  /**
   * 재고 상태 업데이트
   */
  private updateInventoryStatus(
    inventory: InventoryStatus,
    checkResult: StockCheckResult
  ): InventoryStatus {
    const updated: InventoryStatus = {
      ...inventory,
      previousStock: inventory.currentStock,
      currentStock: checkResult.stock,
      stockLevel: this.determineStockLevel(checkResult.stock),
      isAvailable: checkResult.isAvailable,
      price: checkResult.price,
      priceChanged: checkResult.detectedChanges.priceChanged,
      lastChecked: new Date()
    }

    return updated
  }

  /**
   * 재고 수준 결정
   */
  private determineStockLevel(stock: number): 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown' {
    if (stock === -1) return 'unknown'
    if (stock === 0) return 'out_of_stock'
    if (stock <= 5) return 'low_stock'
    return 'in_stock'
  }

  /**
   * 재고 변화 처리 및 알림 생성
   */
  private async processInventoryChanges(
    inventory: InventoryStatus,
    checkResult: StockCheckResult
  ): Promise<void> {
    const { detectedChanges } = checkResult

    // 품절 알림
    if (detectedChanges.availabilityChanged && !inventory.isAvailable) {
      await this.createAlert(inventory, 'out_of_stock', 'critical')
    }

    // 재입고 알림
    if (detectedChanges.availabilityChanged && inventory.isAvailable && inventory.previousStock === 0) {
      await this.createAlert(inventory, 'back_in_stock', 'high')
    }

    // 재고 부족 알림
    if (detectedChanges.stockChanged && inventory.stockLevel === 'low_stock') {
      await this.createAlert(inventory, 'low_stock', 'medium')
    }

    // 가격 변동 알림
    if (detectedChanges.priceChanged) {
      await this.createAlert(inventory, 'price_change', 'medium')
    }

    // 자동화 규칙 적용
    await this.applyInventoryRules(inventory)
  }

  /**
   * 알림 생성
   */
  private async createAlert(
    inventory: InventoryStatus,
    alertType: InventoryAlert['alertType'],
    severity: InventoryAlert['severity']
  ): Promise<void> {
    const message = this.generateAlertMessage(inventory, alertType)
    const relatedOrders = await this.findRelatedOrders(inventory.productId)

    const alert: InventoryAlert = {
      id: this.generateAlertId(),
      inventoryId: inventory.id,
      alertType,
      message,
      severity,
      triggered: new Date(),
      acknowledged: false,
      relatedOrders
    }

    this.alerts.push(alert)
    await this.saveAlertToStorage(alert)

    // 실시간 알림 발송 (실제 구현에서는 notification service 사용)
    console.log(`Inventory Alert [${severity.toUpperCase()}]: ${message}`)
  }

  /**
   * 알림 메시지 생성
   */
  private generateAlertMessage(
    inventory: InventoryStatus,
    alertType: InventoryAlert['alertType']
  ): string {
    const product = inventory.productTitle
    
    switch (alertType) {
      case 'out_of_stock':
        return `${product}이(가) 품절되었습니다. 관련 주문을 확인해주세요.`
      case 'low_stock':
        return `${product}의 재고가 부족합니다 (현재 ${inventory.currentStock}개).`
      case 'back_in_stock':
        return `${product}이(가) 재입고되었습니다 (현재 ${inventory.currentStock}개).`
      case 'price_change':
        const priceChange = inventory.price - (inventory.previousStock || inventory.price)
        const direction = priceChange > 0 ? '상승' : '하락'
        return `${product}의 가격이 ${direction}했습니다 (₩${inventory.price.toLocaleString()}).`
      default:
        return `${product}에 변동사항이 있습니다.`
    }
  }

  /**
   * 관련 주문 찾기
   */
  private async findRelatedOrders(productId: string): Promise<string[]> {
    // 실제 구현에서는 DB에서 해당 상품과 관련된 주문 조회
    // 현재는 모의 데이터 반환
    return [`order-${productId.slice(-6)}`, `order-${Date.now().toString().slice(-6)}`]
  }

  /**
   * 자동화 규칙 적용
   */
  private async applyInventoryRules(inventory: InventoryStatus): Promise<void> {
    for (const rule of this.inventoryRules.filter(r => r.enabled)) {
      if (this.shouldApplyRule(rule, inventory)) {
        await this.executeRuleActions(rule, inventory)
      }
    }
  }

  /**
   * 규칙 적용 조건 확인
   */
  private shouldApplyRule(rule: InventoryRule, inventory: InventoryStatus): boolean {
    const { conditions } = rule

    // 사이트 조건 확인
    if (conditions.sites.length > 0 && !conditions.sites.includes(inventory.site)) {
      return false
    }

    // 카테고리 조건 확인
    if (conditions.categories.length > 0) {
      const category = inventory.metadata?.category || 'unknown'
      if (!conditions.categories.includes(category)) {
        return false
      }
    }

    // 재고 임계값 확인
    if (conditions.stockThreshold > 0 && inventory.currentStock > conditions.stockThreshold) {
      return false
    }

    return true
  }

  /**
   * 규칙 액션 실행
   */
  private async executeRuleActions(rule: InventoryRule, inventory: InventoryStatus): Promise<void> {
    const { actions } = rule

    if (actions.alertAdmin) {
      console.log(`Admin alert triggered by rule "${rule.name}" for ${inventory.productTitle}`)
    }

    if (actions.alertCustomers) {
      console.log(`Customer alert triggered by rule "${rule.name}" for ${inventory.productTitle}`)
    }

    if (actions.pauseOrders && !inventory.isAvailable) {
      console.log(`Orders paused for ${inventory.productTitle} due to stock unavailability`)
    }

    if (actions.findAlternatives && !inventory.isAvailable) {
      console.log(`Finding alternatives for ${inventory.productTitle}`)
    }
  }

  /**
   * 체크 간격 결정
   */
  private determineCheckInterval(site: string, category?: string): number {
    // 사이트별, 카테고리별 체크 간격 설정
    const intervals: Record<string, number> = {
      // 사이트별 기본 간격
      coupang: 30,
      gmarket: 45,
      auction: 45,
      '11st': 60,
      default: 60
    }

    // 카테고리별 조정
    const categoryMultipliers: Record<string, number> = {
      electronics: 0.5, // 전자제품은 더 자주 체크
      fashion: 1.5,     // 패션은 덜 자주
      beauty: 1.0,      // 뷰티는 기본
      default: 1.0
    }

    const baseInterval = intervals[site] || intervals.default
    const multiplier = categoryMultipliers[category || 'default'] || categoryMultipliers.default

    return Math.round(baseInterval * multiplier)
  }

  /**
   * 재고 모니터링 시작
   */
  private startInventoryMonitoring(): void {
    if (this.isRunning) return

    this.isRunning = true
    
    // 1분마다 체크할 항목들을 큐에 추가
    setInterval(() => {
      this.processCheckQueue()
    }, 60 * 1000)

    console.log('Inventory monitoring service started')
  }

  /**
   * 체크 큐 처리
   */
  private async processCheckQueue(): Promise<void> {
    const now = new Date()
    const itemsToCheck: string[] = []

    // 체크가 필요한 항목들을 찾아서 큐에 추가
    for (const [productId, inventory] of this.inventoryStatuses) {
      if (now >= inventory.nextCheckAt && !this.checkQueue.has(productId)) {
        itemsToCheck.push(productId)
        this.checkQueue.add(productId)
      }
    }

    // 배치 처리 (한 번에 최대 5개)
    const batchSize = 5
    for (let i = 0; i < itemsToCheck.length; i += batchSize) {
      const batch = itemsToCheck.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (productId) => {
        try {
          await this.checkInventoryStatus(productId)
        } catch (error) {
          console.error(`Failed to process inventory check for ${productId}:`, error)
        } finally {
          this.checkQueue.delete(productId)
        }
      }))

      // API 부하 분산을 위한 딜레이
      if (i + batchSize < itemsToCheck.length) {
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }

  /**
   * 기본 규칙 초기화
   */
  private initializeDefaultRules(): void {
    this.inventoryRules = [
      {
        id: 'rule-critical-stock',
        name: '긴급 재고 부족',
        description: '재고가 3개 이하로 떨어진 경우 즉시 알림',
        conditions: {
          sites: [],
          categories: [],
          stockThreshold: 3,
          priceChangePercent: 0
        },
        actions: {
          alertAdmin: true,
          alertCustomers: true,
          pauseOrders: false,
          findAlternatives: true
        },
        checkInterval: 15, // 15분마다 체크
        enabled: true,
        priority: 10
      },
      {
        id: 'rule-electronics-monitoring',
        name: '전자제품 집중 모니터링',
        description: '전자제품 카테고리는 더 자주 체크하고 품절 시 즉시 대응',
        conditions: {
          sites: [],
          categories: ['electronics'],
          stockThreshold: 0,
          priceChangePercent: 0
        },
        actions: {
          alertAdmin: true,
          alertCustomers: false,
          pauseOrders: true,
          findAlternatives: true
        },
        checkInterval: 10, // 10분마다 체크
        enabled: true,
        priority: 8
      },
      {
        id: 'rule-price-change',
        name: '가격 변동 모니터링',
        description: '10% 이상 가격 변동 시 알림',
        conditions: {
          sites: [],
          categories: [],
          stockThreshold: -1, // 재고와 무관
          priceChangePercent: 10
        },
        actions: {
          alertAdmin: true,
          alertCustomers: false,
          pauseOrders: false,
          findAlternatives: false
        },
        checkInterval: 30, // 30분마다 체크
        enabled: true,
        priority: 5
      }
    ]
  }

  /**
   * 유틸리티 메서드들
   */
  private generateProductId(url: string): string {
    // URL을 기반으로 고유 ID 생성
    return `prod-${Buffer.from(url).toString('base64').slice(0, 8)}`
  }

  private generateInventoryId(): string {
    return `inv-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  }

  private async saveInventoryToStorage(inventory: InventoryStatus): Promise<void> {
    try {
      const key = `inventory_${inventory.productId}`
      localStorage.setItem(key, JSON.stringify({
        ...inventory,
        lastChecked: inventory.lastChecked.toISOString(),
        nextCheckAt: inventory.nextCheckAt.toISOString()
      }))
    } catch (error) {
      console.error('Failed to save inventory to storage:', error)
    }
  }

  private async saveAlertToStorage(alert: InventoryAlert): Promise<void> {
    try {
      const key = `inventory_alert_${alert.id}`
      localStorage.setItem(key, JSON.stringify({
        ...alert,
        triggered: alert.triggered.toISOString(),
        acknowledgedAt: alert.acknowledgedAt?.toISOString()
      }))
    } catch (error) {
      console.error('Failed to save alert to storage:', error)
    }
  }

  /**
   * 공개 메서드들
   */
  getAllInventoryStatuses(): InventoryStatus[] {
    return Array.from(this.inventoryStatuses.values())
  }

  getInventoryStatus(productId: string): InventoryStatus | null {
    return this.inventoryStatuses.get(productId) || null
  }

  getAlerts(acknowledged?: boolean): InventoryAlert[] {
    if (acknowledged !== undefined) {
      return this.alerts.filter(alert => alert.acknowledged === acknowledged)
    }
    return [...this.alerts]
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId)
    if (!alert) return false

    alert.acknowledged = true
    alert.acknowledgedBy = acknowledgedBy
    alert.acknowledgedAt = new Date()

    await this.saveAlertToStorage(alert)
    return true
  }

  addRule(rule: Omit<InventoryRule, 'id'>): InventoryRule {
    const newRule: InventoryRule = {
      ...rule,
      id: `rule-${Date.now()}`
    }
    this.inventoryRules.push(newRule)
    return newRule
  }

  updateRule(id: string, updates: Partial<InventoryRule>): InventoryRule | null {
    const index = this.inventoryRules.findIndex(rule => rule.id === id)
    if (index === -1) return null

    this.inventoryRules[index] = { ...this.inventoryRules[index], ...updates }
    return this.inventoryRules[index]
  }

  deleteRule(id: string): boolean {
    const index = this.inventoryRules.findIndex(rule => rule.id === id)
    if (index === -1) return false

    this.inventoryRules.splice(index, 1)
    return true
  }

  getRules(): InventoryRule[] {
    return [...this.inventoryRules]
  }

  async forceCheckAll(): Promise<void> {
    const allProductIds = Array.from(this.inventoryStatuses.keys())
    console.log(`Force checking ${allProductIds.length} inventory items...`)

    // 모든 항목을 즉시 체크하도록 설정
    for (const productId of allProductIds) {
      const inventory = this.inventoryStatuses.get(productId)!
      inventory.nextCheckAt = new Date()
    }

    // 체크 큐 처리
    await this.processCheckQueue()
  }
}

// 싱글톤 인스턴스
export const inventoryAutomationService = new InventoryAutomationService()