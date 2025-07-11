import { UserRepository } from './local/repositories/user-repository'
import { PostRepository } from './local/repositories/post-repository'
import { CommentRepository } from './local/repositories/comment-repository'
import { HotDealRepository } from './local/repositories/hotdeal-repository'
import { HotDealCommentRepository } from './local/repositories/hotdeal-comment-repository'
import { OrderRepository } from './local/repositories/order-repository'
import { PaymentRepository, PaymentRequestRepository } from './local/repositories/payment-repository'
import { FavoriteRepository } from './local/repositories/favorite-repository'
import { BuyForMeRepository } from './local/repositories/buy-for-me-repository'
import { initializeMockData } from './mock-data'
import { LocalStorage } from './storage'

export class DatabaseService {
  private static instance: DatabaseService
  
  public users: UserRepository
  public posts: PostRepository
  public comments: CommentRepository
  public hotdeals: HotDealRepository
  public hotdealComments: HotDealCommentRepository
  public orders: OrderRepository
  public payments: PaymentRepository
  public paymentRequests: PaymentRequestRepository
  public favorites: FavoriteRepository
  public buyForMeRequests: BuyForMeRepository

  private constructor() {
    this.users = new UserRepository()
    this.posts = new PostRepository()
    this.comments = new CommentRepository()
    this.hotdeals = new HotDealRepository()
    this.hotdealComments = new HotDealCommentRepository()
    this.orders = new OrderRepository()
    this.payments = new PaymentRepository()
    this.paymentRequests = new PaymentRequestRepository()
    this.favorites = new FavoriteRepository()
    this.buyForMeRequests = new BuyForMeRepository()
    
    if (typeof window !== 'undefined') {
      initializeMockData()
    }
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async clearAllData(): Promise<void> {
    await this.users.deleteAll()
    await this.posts.deleteAll()
    await this.comments.deleteAll()
    await this.hotdeals.deleteAll()
    await this.hotdealComments.deleteAll()
    await this.orders.deleteAll()
    await this.payments.deleteAll()
    await this.paymentRequests.deleteAll()
    await this.favorites.deleteAll()
    await this.buyForMeRequests.deleteAll()
  }

  async backup(): Promise<string> {
    const data = {
      users: await this.users.findAll(),
      posts: await this.posts.findAll(),
      comments: await this.comments.findAll(),
      hotdeals: await this.hotdeals.findAll(),
      orders: await this.orders.findAll(),
      payments: await this.payments.findAll(),
      paymentRequests: await this.paymentRequests.findAll(),
      favorites: await this.favorites.findAll(),
      buyForMeRequests: await this.buyForMeRequests.findAll(),
      timestamp: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  async restore(backupData: string): Promise<void> {
    try {
      const data = JSON.parse(backupData)
      
      await this.clearAllData()
      
      const storage = LocalStorage.getInstance()
      storage.set('users', data.users)
      storage.set('posts', data.posts)
      storage.set('comments', data.comments)
      storage.set('hotdeals', data.hotdeals)
      storage.set('orders', data.orders)
      storage.set('payments', data.payments)
      storage.set('payment_requests', data.paymentRequests)
      storage.set('favorites', data.favorites || [])
      storage.set('buyForMeRequests', data.buyForMeRequests || [])
      
      console.log('Data restored successfully')
    } catch (error) {
      console.error('Failed to restore data:', error)
      throw error
    }
  }
}

export const db = DatabaseService.getInstance()