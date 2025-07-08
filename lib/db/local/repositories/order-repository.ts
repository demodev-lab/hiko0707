import { BaseRepository } from './base-repository'
import { Order, OrderStatus } from '@/types/order'

export class OrderRepository extends BaseRepository<Order> {
  protected tableName = 'orders'

  async findByUserId(userId: string): Promise<Order[]> {
    const items = await this.findAll()
    return items.filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    const items = await this.findAll()
    return items.filter(item => item.status === status)
  }

  async findByUserAndStatus(userId: string, status: OrderStatus): Promise<Order[]> {
    const items = await this.findAll()
    return items.filter(item => item.userId === userId && item.status === status)
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const order = await this.findById(id)
    if (!order) return null

    const updates: Partial<Order> = { status }
    const now = new Date()

    // 상태에 따른 타임스탬프 업데이트
    switch (status) {
      case 'confirmed':
        updates.confirmedAt = now
        break
      case 'purchasing':
        updates.purchasedAt = now
        break
      case 'shipping':
        updates.shippedAt = now
        break
      case 'delivered':
        updates.deliveredAt = now
        break
      case 'cancelled':
        updates.cancelledAt = now
        break
    }

    return this.update(id, updates)
  }

  async addTrackingNumber(
    id: string, 
    trackingNumber: string, 
    type: 'korean' | 'international'
  ): Promise<Order | null> {
    const updates: Partial<Order> = {}
    
    if (type === 'korean') {
      updates.koreanTrackingNumber = trackingNumber
    } else {
      updates.internationalTrackingNumber = trackingNumber
    }

    return this.update(id, updates)
  }

  async getActiveOrdersCount(userId?: string): Promise<number> {
    const items = await this.findAll()
    const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'purchasing', 'shipping']
    
    const activeOrders = items.filter(item => 
      activeStatuses.includes(item.status) &&
      (!userId || item.userId === userId)
    )

    return activeOrders.length
  }

  async getOrderStats(userId?: string): Promise<{
    total: number
    pending: number
    processing: number
    completed: number
    cancelled: number
  }> {
    const items = userId ? await this.findByUserId(userId) : await this.findAll()
    
    return {
      total: items.length,
      pending: items.filter(o => o.status === 'pending').length,
      processing: items.filter(o => 
        ['confirmed', 'purchasing', 'shipping'].includes(o.status)
      ).length,
      completed: items.filter(o => o.status === 'delivered').length,
      cancelled: items.filter(o => o.status === 'cancelled').length
    }
  }

  async findWithPagination(
    page: number = 1, 
    limit: number = 20,
    userId?: string,
    status?: OrderStatus
  ): Promise<{
    items: Order[]
    total: number
    page: number
    totalPages: number
  }> {
    let items = await this.findAll()
    
    // 필터링
    if (userId) {
      items = items.filter(item => item.userId === userId)
    }
    if (status) {
      items = items.filter(item => item.status === status)
    }

    // 정렬 (최신순)
    items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const total = items.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit

    return {
      items: items.slice(start, end),
      total,
      page,
      totalPages
    }
  }

  async searchOrders(keyword: string, userId?: string): Promise<Order[]> {
    const items = userId ? await this.findByUserId(userId) : await this.findAll()
    const lowercaseKeyword = keyword.toLowerCase()
    
    return items.filter(order => 
      order.orderNumber.toLowerCase().includes(lowercaseKeyword) ||
      order.items.some(item => 
        item.productName.toLowerCase().includes(lowercaseKeyword)
      ) ||
      order.koreanTrackingNumber?.toLowerCase().includes(lowercaseKeyword) ||
      order.internationalTrackingNumber?.toLowerCase().includes(lowercaseKeyword)
    )
  }

  generateOrderNumber(): string {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    
    return `HK${year}${month}${day}${random}`
  }
}