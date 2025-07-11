import { BaseRepository } from './base-repository'
import type { BuyForMeRequest } from '@/types/buy-for-me'

export class BuyForMeRepository extends BaseRepository<BuyForMeRequest> {
  protected tableName = 'buyForMeRequests'
  
  constructor() {
    super()
  }

  async findByUserId(userId: string): Promise<BuyForMeRequest[]> {
    const items = await this.findAll()
    return items.filter(item => item.userId === userId)
  }

  async findByStatus(status: BuyForMeRequest['status']): Promise<BuyForMeRequest[]> {
    const items = await this.findAll()
    return items.filter(item => item.status === status)
  }

  async findByHotdealId(hotdealId: string): Promise<BuyForMeRequest[]> {
    const items = await this.findAll()
    return items.filter(item => item.hotdealId === hotdealId)
  }

  async updateStatus(id: string, status: BuyForMeRequest['status']): Promise<BuyForMeRequest | null> {
    return this.update(id, { status, updatedAt: new Date() })
  }

  async addQuote(
    id: string, 
    quote: BuyForMeRequest['quote']
  ): Promise<BuyForMeRequest | null> {
    return this.update(id, { 
      quote, 
      status: 'quote_sent',
      updatedAt: new Date() 
    })
  }

  async approveQuote(id: string): Promise<BuyForMeRequest | null> {
    const request = await this.findById(id)
    if (!request || !request.quote) return null

    return this.update(id, {
      quote: {
        ...request.quote,
        quoteApprovedDate: new Date()
      },
      status: 'quote_approved',
      updatedAt: new Date()
    })
  }

  async addOrderInfo(
    id: string,
    orderInfo: BuyForMeRequest['orderInfo']
  ): Promise<BuyForMeRequest | null> {
    return this.update(id, {
      orderInfo,
      status: 'purchasing',
      updatedAt: new Date()
    })
  }

  async updateTrackingInfo(
    id: string,
    trackingNumber: string,
    trackingUrl?: string
  ): Promise<BuyForMeRequest | null> {
    const request = await this.findById(id)
    if (!request || !request.orderInfo) return null

    return this.update(id, {
      orderInfo: {
        ...request.orderInfo,
        trackingNumber,
        trackingUrl
      },
      status: 'shipping',
      updatedAt: new Date()
    })
  }

  // 관리자 대시보드용 통계
  async getStatsByStatus(): Promise<Record<string, number>> {
    const items = await this.findAll()
    const stats: Record<string, number> = {}
    
    items.forEach(item => {
      stats[item.status] = (stats[item.status] || 0) + 1
    })
    
    return stats
  }
}