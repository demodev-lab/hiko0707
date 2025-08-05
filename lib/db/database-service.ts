/**
 * @deprecated This file is deprecated and will be removed soon.
 * All LocalStorage functionality has been migrated to Supabase.
 * 
 * This is a dummy file to prevent import errors during the migration period.
 * Please use Supabase services instead:
 * - SupabaseHotDealService
 * - SupabaseOrderService
 * - SupabasePaymentService
 * - SupabaseProfileService
 * - etc.
 */

// Dummy interface to prevent TypeScript errors
interface DummyRepository {
  findAll: () => Promise<any[]>
  findById: (id: string) => Promise<any | null>
  create: (data: any) => Promise<any>
  update: (id: string, data: any) => Promise<any>
  delete: (id: string) => Promise<boolean>
  deleteAll: () => Promise<void>
  findByUserId?: (userId: string) => Promise<any[]>
  findDefaultByUserId?: (userId: string) => Promise<any | null>
  findByEmail?: (email: string) => Promise<any | null>
  findByExternalTransactionId?: (id: string) => Promise<any | null>
  updateStatus?: (id: string, status: string, metadata?: any) => Promise<any>
  getNestedComments?: (id: string) => Promise<any[]>
  toggleLike?: (commentId: string, userId: string) => Promise<boolean>
}

// Dummy DatabaseService class
export class DatabaseService {
  private static instance: DatabaseService
  
  public users: DummyRepository = createDummyRepository('users')
  public posts: DummyRepository = createDummyRepository('posts')
  public comments: DummyRepository = createDummyRepository('comments')
  public hotdeals: DummyRepository = createDummyRepository('hotdeals')
  public hotdealComments: DummyRepository = createDummyRepository('hotdealComments')
  public orders: DummyRepository = createDummyRepository('orders')
  public payments: DummyRepository = createDummyRepository('payments')
  public paymentRequests: DummyRepository = createDummyRepository('paymentRequests')
  public favorites: DummyRepository = createDummyRepository('favorites')
  public buyForMeRequests: DummyRepository = createDummyRepository('buyForMeRequests')
  public translations: DummyRepository = createDummyRepository('translations')
  public addresses: DummyRepository = createDummyRepository('addresses')

  private constructor() {
    console.warn('DatabaseService is deprecated. Please use Supabase services instead.')
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async clearAllData(): Promise<void> {
    console.warn('clearAllData is deprecated')
  }

  async backup(): Promise<string> {
    console.warn('backup is deprecated')
    return '{}'
  }

  async restore(backupData: string): Promise<void> {
    console.warn('restore is deprecated')
  }
}

// Helper function to create dummy repositories
function createDummyRepository(name: string): DummyRepository {
  return {
    findAll: async () => {
      console.warn(`${name}.findAll() is deprecated. Use Supabase services.`)
      return []
    },
    findById: async (id: string) => {
      console.warn(`${name}.findById() is deprecated. Use Supabase services.`)
      return null
    },
    create: async (data: any) => {
      console.warn(`${name}.create() is deprecated. Use Supabase services.`)
      return { id: 'dummy', ...data }
    },
    update: async (id: string, data: any) => {
      console.warn(`${name}.update() is deprecated. Use Supabase services.`)
      return { id, ...data }
    },
    delete: async (id: string) => {
      console.warn(`${name}.delete() is deprecated. Use Supabase services.`)
      return true
    },
    deleteAll: async () => {
      console.warn(`${name}.deleteAll() is deprecated. Use Supabase services.`)
    },
    findByUserId: async (userId: string) => {
      console.warn(`${name}.findByUserId() is deprecated. Use Supabase services.`)
      return []
    },
    findDefaultByUserId: async (userId: string) => {
      console.warn(`${name}.findDefaultByUserId() is deprecated. Use Supabase services.`)
      return null
    },
    findByEmail: async (email: string) => {
      console.warn(`${name}.findByEmail() is deprecated. Use Supabase services.`)
      return null
    },
    findByExternalTransactionId: async (id: string) => {
      console.warn(`${name}.findByExternalTransactionId() is deprecated. Use Supabase services.`)
      return null
    },
    updateStatus: async (id: string, status: string, metadata?: any) => {
      console.warn(`${name}.updateStatus() is deprecated. Use Supabase services.`)
      return { id, status, ...metadata }
    },
    getNestedComments: async (id: string) => {
      console.warn(`${name}.getNestedComments() is deprecated. Use Supabase services.`)
      return []
    },
    toggleLike: async (commentId: string, userId: string) => {
      console.warn(`${name}.toggleLike() is deprecated. Use Supabase services.`)
      return true
    }
  }
}

export const db = DatabaseService.getInstance()