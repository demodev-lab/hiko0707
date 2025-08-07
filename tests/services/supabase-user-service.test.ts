import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock query results storage
let mockQueryResult: any = null

// Mock Supabase query builder - 완전한 체이닝 지원
const createMockQuery = () => {
  const query = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    throwOnError: vi.fn().mockImplementation(() => {
      return Promise.resolve(mockQueryResult)
    }),
    single: vi.fn().mockImplementation(() => {
      return Promise.resolve(mockQueryResult)
    }),
    // query 자체를 await할 수 있도록 thenable 객체로 만들기
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(mockQueryResult).then(onFulfilled)
    })
  }
  return query
}

// Mock Supabase clients
const mockSupabaseClient = {
  from: vi.fn(() => createMockQuery())
}

vi.mock('@/lib/supabase/client', () => ({
  supabase: () => mockSupabaseClient
}))

import { SupabaseUserService } from '@/lib/services/supabase-user-service'

describe('SupabaseUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = null
  })

  describe('getUser', () => {
    it('should fetch user by ID successfully', async () => {
      const mockUser = {
        id: 'user-1',
        clerk_user_id: 'clerk-123',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'customer',
        preferred_language: 'ko',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Setup mock response
      mockQueryResult = {
        data: mockUser,
        error: null
      }

      const result = await SupabaseUserService.getUser('user-1')

      expect(result).toEqual(mockUser)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
    })

    it('should return null for non-existent user', async () => {
      // Setup mock error response
      mockQueryResult = {
        data: null,
        error: { message: 'User not found' }
      }

      const result = await SupabaseUserService.getUser('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getUserByClerkId', () => {
    it('should fetch user by Clerk ID successfully', async () => {
      const mockUser = {
        id: 'user-1',
        clerk_user_id: 'clerk-123',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'customer',
        preferred_language: 'ko',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockQueryResult = {
        data: mockUser,
        error: null
      }

      const result = await SupabaseUserService.getUserByClerkId('clerk-123')

      expect(result).toEqual(mockUser)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
    })

    it('should return null for non-existent Clerk ID', async () => {
      mockQueryResult = {
        data: null,
        error: { message: 'User not found' }
      }

      const result = await SupabaseUserService.getUserByClerkId('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('should fetch user by email successfully', async () => {
      const mockUser = {
        id: 'user-1',
        clerk_user_id: 'clerk-123',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'customer',
        preferred_language: 'ko',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockQueryResult = {
        data: mockUser,
        error: null
      }

      const result = await SupabaseUserService.getUserByEmail('test@example.com')

      expect(result).toEqual(mockUser)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
    })

    it('should return null for non-existent email', async () => {
      mockQueryResult = {
        data: null,
        error: { message: 'User not found' }
      }

      const result = await SupabaseUserService.getUserByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updatedUser = {
        id: 'user-1',
        clerk_user_id: 'clerk-123',
        email: 'test@example.com',
        name: '업데이트된 사용자',
        role: 'customer',
        preferred_language: 'en',
        phone: '010-1234-5678',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString()
      }

      mockQueryResult = {
        data: updatedUser,
        error: null
      }

      const result = await SupabaseUserService.updateUser('user-1', {
        name: '업데이트된 사용자',
        preferred_language: 'en',
        phone: '010-1234-5678'
      })

      expect(result).toEqual(updatedUser)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
    })

    it('should handle update error', async () => {
      mockQueryResult = {
        data: null,
        error: { message: 'Update failed' }
      }

      const result = await SupabaseUserService.updateUser('user-1', {
        name: '업데이트된 사용자'
      })

      expect(result).toBeNull()
    })
  })

  describe('updateLanguage', () => {
    it('should update user language successfully', async () => {
      const updatedUser = {
        id: 'user-1',
        preferred_language: 'en',
        updated_at: new Date().toISOString()
      }

      mockQueryResult = {
        data: updatedUser,
        error: null
      }

      const result = await SupabaseUserService.updateLanguage('user-1', 'en')

      expect(result).toBe(true)
    })

    it('should return false on language update failure', async () => {
      mockQueryResult = {
        data: null,
        error: { message: 'Language update failed' }
      }

      const result = await SupabaseUserService.updateLanguage('user-1', 'en')

      expect(result).toBe(false)
    })
  })

  describe('updatePhone', () => {
    it('should update user phone successfully', async () => {
      const updatedUser = {
        id: 'user-1',
        phone: '010-1234-5678',
        updated_at: new Date().toISOString()
      }

      mockQueryResult = {
        data: updatedUser,
        error: null
      }

      const result = await SupabaseUserService.updatePhone('user-1', '010-1234-5678')

      expect(result).toBe(true)
    })

    it('should return false on phone update failure', async () => {
      mockQueryResult = {
        data: null,
        error: { message: 'Phone update failed' }
      }

      const result = await SupabaseUserService.updatePhone('user-1', '010-1234-5678')

      expect(result).toBe(false)
    })
  })

  describe('updateAvatar', () => {
    it('should always return false since user_profiles table does not exist', async () => {
      const result = await SupabaseUserService.updateAvatar('user-1', 'https://example.com/avatar.jpg')
      
      // user_profiles 테이블이 존재하지 않으므로 항상 false 반환
      expect(result).toBe(false)
    })
  })
})