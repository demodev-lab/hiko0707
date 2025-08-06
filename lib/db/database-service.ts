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
    // 개발 환경에서만 경고 출력
    if (process.env.NODE_ENV === 'development') {
      console.warn('DatabaseService is deprecated. Please use Supabase services instead.')
    }
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
  const warnIfDev = (methodName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`${name}.${methodName}() is deprecated. Use Supabase services.`)
    }
  }

  return {
    findAll: async () => {
      warnIfDev('findAll')
      return []
    },
    findById: async (id: string) => {
      warnIfDev('findById')
      return null
    },
    create: async (data: any) => {
      warnIfDev('create')
      return { id: 'dummy', ...data }
    },
    update: async (id: string, data: any) => {
      warnIfDev('update')
      return { id, ...data }
    },
    delete: async (id: string) => {
      warnIfDev('delete')
      return true
    },
    deleteAll: async () => {
      warnIfDev('deleteAll')
    },
    findByUserId: async (userId: string) => {
      warnIfDev('findByUserId')
      return []
    },
    findDefaultByUserId: async (userId: string) => {
      warnIfDev('findDefaultByUserId')
      return null
    },
    findByEmail: async (email: string) => {
      warnIfDev('findByEmail')
      return null
    },
    findByExternalTransactionId: async (id: string) => {
      warnIfDev('findByExternalTransactionId')
      return null
    },
    updateStatus: async (id: string, status: string, metadata?: any) => {
      warnIfDev('updateStatus')
      return { id, status, ...metadata }
    },
    getNestedComments: async (id: string) => {
      warnIfDev('getNestedComments')
      return []
    },
    toggleLike: async (commentId: string, userId: string) => {
      warnIfDev('toggleLike')
      return true
    }
  }
}

export const db = DatabaseService.getInstance()