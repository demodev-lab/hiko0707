import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

// Mock 상태 관리를 위한 전역 변수들
let mockSupabaseUserServiceResult: any = null
let mockSupabaseNotificationServiceResult: any = null
let mockClerkAuthResult: any = null
let mockToastCalls: any[] = []

// Mock Clerk useAuth
const mockUseAuth = vi.fn().mockImplementation(() => {
  return mockClerkAuthResult || { userId: null }
})

vi.mock('@clerk/nextjs', () => ({
  useAuth: mockUseAuth
}))

// Mock SupabaseUserService
const mockSupabaseUserServiceMethods = {
  getUserByClerkId: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseUserServiceResult?.getUserByClerkId || null)
  }),
  getUserProfile: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseUserServiceResult?.getUserProfile || null)
  }),
  updateUser: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseUserServiceResult?.updateUser || { id: 'updated-user-id' })
  }),
  updateLanguage: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseUserServiceResult?.updateLanguage || { id: 'updated-user-id' })
  }),
  updateAvatar: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseUserServiceResult?.updateAvatar || { id: 'updated-profile-id' })
  })
}

vi.mock('@/lib/services/supabase-user-service', () => ({
  SupabaseUserService: mockSupabaseUserServiceMethods
}))

// Mock SupabaseNotificationService
const mockSupabaseNotificationServiceMethods = {
  getUserNotifications: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseNotificationServiceResult?.getUserNotifications || [])
  }),
  getUnreadCount: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseNotificationServiceResult?.getUnreadCount || 0)
  }),
  markAsRead: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseNotificationServiceResult?.markAsRead || true)
  }),
  markAllAsRead: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseNotificationServiceResult?.markAllAsRead || true)
  })
}

vi.mock('@/lib/services/supabase-notification-service', () => ({
  SupabaseNotificationService: mockSupabaseNotificationServiceMethods
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn().mockImplementation((message: string) => {
      mockToastCalls.push({ type: 'success', message })
    }),
    error: vi.fn().mockImplementation((message: string) => {
      mockToastCalls.push({ type: 'error', message })
    })
  }
}))

// Import hook after mocking
import { useSupabaseUser } from '@/hooks/use-supabase-user'

// Test wrapper component for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useSupabaseUser hook', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUserServiceResult = null
    mockSupabaseNotificationServiceResult = null
    mockClerkAuthResult = null
    mockToastCalls = []
    
    // Reset mock service methods
    Object.values(mockSupabaseUserServiceMethods).forEach(mock => mock.mockClear())
    Object.values(mockSupabaseNotificationServiceMethods).forEach(mock => mock.mockClear())
    
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('user query', () => {
    it('should fetch user data when Clerk userId is available', async () => {
      const mockUser = {
        id: 'user-123',
        clerk_id: 'clerk-456',
        name: '테스트 사용자',
        email: 'test@example.com',
        preferred_language: 'ko'
      }

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabaseUserServiceMethods.getUserByClerkId).toHaveBeenCalledWith('clerk-456')
    })

    it('should not fetch user data when Clerk userId is not available', () => {
      mockClerkAuthResult = { userId: null }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      expect(result.current.user).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
      expect(mockSupabaseUserServiceMethods.getUserByClerkId).not.toHaveBeenCalled()
    })

    it('should handle user fetch error', async () => {
      const errorMessage = 'Failed to fetch user'
      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceMethods.getUserByClerkId.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // useQuery는 에러를 조용히 처리하고 data는 undefined가 됩니다
      expect(result.current.user).toBeUndefined()
    })
  })

  describe('userProfile query', () => {
    it('should fetch user profile when user ID is available', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: '테스트 프로필'
      }

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser,
        getUserProfile: mockProfile
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.userProfile).toEqual(mockProfile)
      })

      expect(mockSupabaseUserServiceMethods.getUserProfile).toHaveBeenCalledWith('user-123')
    })

    it('should not fetch profile when user is not available', async () => {
      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: null
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      expect(mockSupabaseUserServiceMethods.getUserProfile).not.toHaveBeenCalled()
    })
  })

  describe('notifications query', () => {
    it('should fetch notifications when user ID is available', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const mockNotifications = [
        { id: 'notif-1', title: '알림 1', message: '메시지 1', is_read: false },
        { id: 'notif-2', title: '알림 2', message: '메시지 2', is_read: true }
      ]

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseNotificationServiceResult = {
        getUserNotifications: mockNotifications
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.notifications).toEqual(mockNotifications)
      })

      expect(mockSupabaseNotificationServiceMethods.getUserNotifications).toHaveBeenCalledWith('user-123')
    })

    it('should return empty array as default for notifications', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseNotificationServiceResult = {
        getUserNotifications: undefined // 서비스에서 undefined 반환
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.notifications).toEqual([])
      })
    })

    it('should not fetch notifications when user is not available', async () => {
      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: null
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      expect(mockSupabaseNotificationServiceMethods.getUserNotifications).not.toHaveBeenCalled()
    })
  })

  describe('unreadCount query', () => {
    it('should fetch unread count when user ID is available', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const mockUnreadCount = 5

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseNotificationServiceResult = {
        getUnreadCount: mockUnreadCount
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(mockUnreadCount)
      })

      expect(mockSupabaseNotificationServiceMethods.getUnreadCount).toHaveBeenCalledWith('user-123')
    })

    it('should return 0 as default for unread count', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseNotificationServiceResult = {
        getUnreadCount: undefined // 서비스에서 undefined 반환
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(0)
      })
    })

    it('should not fetch unread count when user is not available', async () => {
      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: null
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      expect(mockSupabaseNotificationServiceMethods.getUnreadCount).not.toHaveBeenCalled()
    })
  })

  describe('updateUser mutation', () => {
    it('should update user information successfully', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const updateData = { name: '새로운 이름', phone: '010-1234-5678' }

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser,
        updateUser: { id: 'user-123', ...updateData }
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // updateUser 실행
      result.current.updateUser(updateData)

      await waitFor(() => {
        expect(result.current.isUpdatingUser).toBe(false)
      })

      expect(mockSupabaseUserServiceMethods.updateUser).toHaveBeenCalledWith('user-123', updateData)
      expect(mockToastCalls).toContainEqual({ type: 'success', message: '사용자 정보가 업데이트되었습니다' })
    })

    it('should handle updateUser error', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const updateData = { name: '새로운 이름' }
      const errorMessage = 'Update failed'

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseUserServiceMethods.updateUser.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // updateUser 실행
      result.current.updateUser(updateData)

      await waitFor(() => {
        expect(result.current.isUpdatingUser).toBe(false)
      })

      expect(mockToastCalls).toContainEqual({ type: 'error', message: '사용자 정보 업데이트에 실패했습니다' })
    })

    it('should throw error when user is not available', async () => {
      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: null
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      // updateUser 실행 시 에러가 발생해야 함
      result.current.updateUser({ name: '테스트' })

      await waitFor(() => {
        expect(result.current.isUpdatingUser).toBe(false)
      })

      expect(mockToastCalls).toContainEqual({ type: 'error', message: '사용자 정보 업데이트에 실패했습니다' })
    })
  })

  describe('updateLanguage mutation', () => {
    it('should update language successfully', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const newLanguage = 'en'

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser,
        updateLanguage: { id: 'user-123', preferred_language: newLanguage }
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // updateLanguage 실행
      result.current.updateLanguage(newLanguage)

      await waitFor(() => {
        expect(result.current.isUpdatingLanguage).toBe(false)
      })

      expect(mockSupabaseUserServiceMethods.updateLanguage).toHaveBeenCalledWith('user-123', newLanguage)
      expect(mockToastCalls).toContainEqual({ type: 'success', message: '언어 설정이 변경되었습니다' })
    })

    it('should handle updateLanguage error', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const newLanguage = 'en'
      const errorMessage = 'Language update failed'

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseUserServiceMethods.updateLanguage.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // updateLanguage 실행
      result.current.updateLanguage(newLanguage)

      await waitFor(() => {
        expect(result.current.isUpdatingLanguage).toBe(false)
      })

      expect(mockToastCalls).toContainEqual({ type: 'error', message: '언어 설정 변경에 실패했습니다' })
    })

    it('should throw error when user is not available', async () => {
      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: null
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      // updateLanguage 실행 시 에러가 발생해야 함
      result.current.updateLanguage('en')

      await waitFor(() => {
        expect(result.current.isUpdatingLanguage).toBe(false)
      })

      expect(mockToastCalls).toContainEqual({ type: 'error', message: '언어 설정 변경에 실패했습니다' })
    })
  })

  describe('updateAvatar mutation', () => {
    it('should update avatar successfully', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const newAvatarUrl = 'https://example.com/new-avatar.jpg'

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser,
        updateAvatar: { id: 'profile-123', avatar_url: newAvatarUrl }
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // updateAvatar 실행
      result.current.updateAvatar(newAvatarUrl)

      await waitFor(() => {
        expect(result.current.isUpdatingAvatar).toBe(false)
      })

      expect(mockSupabaseUserServiceMethods.updateAvatar).toHaveBeenCalledWith('user-123', newAvatarUrl)
      expect(mockToastCalls).toContainEqual({ type: 'success', message: '프로필 사진이 업데이트되었습니다' })
    })

    it('should handle updateAvatar error', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const newAvatarUrl = 'https://example.com/new-avatar.jpg'
      const errorMessage = 'Avatar update failed'

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseUserServiceMethods.updateAvatar.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // updateAvatar 실행
      result.current.updateAvatar(newAvatarUrl)

      await waitFor(() => {
        expect(result.current.isUpdatingAvatar).toBe(false)
      })

      expect(mockToastCalls).toContainEqual({ type: 'error', message: '프로필 사진 업데이트에 실패했습니다' })
    })

    it('should throw error when user is not available', async () => {
      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: null
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      // updateAvatar 실행 시 에러가 발생해야 함
      result.current.updateAvatar('https://example.com/avatar.jpg')

      await waitFor(() => {
        expect(result.current.isUpdatingAvatar).toBe(false)
      })

      expect(mockToastCalls).toContainEqual({ type: 'error', message: '프로필 사진 업데이트에 실패했습니다' })
    })
  })

  describe('markNotificationAsRead mutation', () => {
    it('should mark notification as read successfully', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const notificationId = 'notif-123'

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseNotificationServiceResult = {
        markAsRead: true
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // markNotificationAsRead 실행
      result.current.markNotificationAsRead(notificationId)

      await waitFor(() => {
        // mutation이 완료될 때까지 대기
        expect(mockSupabaseNotificationServiceMethods.markAsRead).toHaveBeenCalledWith(notificationId)
      })
    })

    it('should handle markNotificationAsRead error', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const notificationId = 'notif-123'
      const errorMessage = 'Mark as read failed'

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseNotificationServiceMethods.markAsRead.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // markNotificationAsRead 실행
      result.current.markNotificationAsRead(notificationId)

      await waitFor(() => {
        expect(mockSupabaseNotificationServiceMethods.markAsRead).toHaveBeenCalledWith(notificationId)
      })
    })
  })

  describe('markAllNotificationsAsRead mutation', () => {
    it('should mark all notifications as read successfully', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseNotificationServiceResult = {
        markAllAsRead: true
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // markAllNotificationsAsRead 실행
      result.current.markAllNotificationsAsRead()

      await waitFor(() => {
        expect(mockSupabaseNotificationServiceMethods.markAllAsRead).toHaveBeenCalledWith('user-123')
      })
    })

    it('should handle markAllNotificationsAsRead error', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const errorMessage = 'Mark all as read failed'

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseNotificationServiceMethods.markAllAsRead.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // markAllNotificationsAsRead 실행
      result.current.markAllNotificationsAsRead()

      await waitFor(() => {
        expect(mockSupabaseNotificationServiceMethods.markAllAsRead).toHaveBeenCalledWith('user-123')
      })
    })

    it('should throw error when user is not available', async () => {
      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: null
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      // markAllNotificationsAsRead 실행 시 에러가 발생해야 함
      result.current.markAllNotificationsAsRead()

      await waitFor(() => {
        // 에러 발생 확인
        expect(mockSupabaseNotificationServiceMethods.markAllAsRead).not.toHaveBeenCalled()
      })
    })
  })

  describe('loading states', () => {
    it('should indicate loading when fetching user and notifications', async () => {
      mockClerkAuthResult = { userId: 'clerk-456' }
      
      // 서비스 호출을 지연시켜 로딩 상태 테스트
      let resolveUser: (value: any) => void
      const userPromise = new Promise(resolve => { resolveUser = resolve })
      mockSupabaseUserServiceMethods.getUserByClerkId.mockReturnValue(userPromise)

      let resolveNotifications: (value: any) => void
      const notificationsPromise = new Promise(resolve => { resolveNotifications = resolve })
      mockSupabaseNotificationServiceMethods.getUserNotifications.mockReturnValue(notificationsPromise)

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      // 초기 로딩 상태 확인
      expect(result.current.isLoading).toBe(true)

      // user 요청 완료
      resolveUser({ id: 'user-123', clerk_id: 'clerk-456' })

      await waitFor(() => {
        expect(result.current.user).toBeTruthy()
      })

      // notifications는 아직 로딩 중
      expect(result.current.isLoading).toBe(true)

      // notifications 요청 완료
      resolveNotifications([])

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should show individual mutation loading states', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }

      // updateUser 지연
      let resolveUpdateUser: (value: any) => void
      const updateUserPromise = new Promise(resolve => { resolveUpdateUser = resolve })
      mockSupabaseUserServiceMethods.updateUser.mockReturnValue(updateUserPromise)

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // updateUser 실행
      result.current.updateUser({ name: '새로운 이름' })

      // 로딩 상태 확인
      expect(result.current.isUpdatingUser).toBe(true)
      expect(result.current.isUpdatingLanguage).toBe(false)
      expect(result.current.isUpdatingAvatar).toBe(false)

      // updateUser 완료
      resolveUpdateUser({ id: 'user-123', name: '새로운 이름' })

      await waitFor(() => {
        expect(result.current.isUpdatingUser).toBe(false)
      })
    })
  })

  describe('query invalidation after mutations', () => {
    it('should invalidate user queries after updateUser', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser,
        updateUser: { id: 'user-123', name: '새로운 이름' }
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // updateUser 실행
      result.current.updateUser({ name: '새로운 이름' })

      await waitFor(() => {
        expect(result.current.isUpdatingUser).toBe(false)
      })

      // 성공 후 쿼리 무효화로 인해 재요청이 이루어져야 함
      expect(mockSupabaseUserServiceMethods.getUserByClerkId).toHaveBeenCalledTimes(2) // 초기 + 무효화 후 재요청
    })

    it('should invalidate userProfile query after updateAvatar', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const mockProfile = { id: 'profile-123', user_id: 'user-123' }

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser,
        getUserProfile: mockProfile,
        updateAvatar: { id: 'profile-123', avatar_url: 'new-avatar.jpg' }
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.userProfile).toEqual(mockProfile)
      })

      // updateAvatar 실행
      result.current.updateAvatar('https://example.com/new-avatar.jpg')

      await waitFor(() => {
        expect(result.current.isUpdatingAvatar).toBe(false)
      })

      // 성공 후 userProfile 쿼리 무효화로 인해 재요청이 이루어져야 함
      expect(mockSupabaseUserServiceMethods.getUserProfile).toHaveBeenCalledTimes(2) // 초기 + 무효화 후 재요청
    })

    it('should invalidate notification queries after markNotificationAsRead', async () => {
      const mockUser = { id: 'user-123', clerk_id: 'clerk-456' }
      const mockNotifications = [{ id: 'notif-1', is_read: false }]

      mockClerkAuthResult = { userId: 'clerk-456' }
      mockSupabaseUserServiceResult = {
        getUserByClerkId: mockUser
      }
      mockSupabaseNotificationServiceResult = {
        getUserNotifications: mockNotifications,
        getUnreadCount: 1,
        markAsRead: true
      }

      const { result } = renderHook(() => useSupabaseUser(), { wrapper })

      await waitFor(() => {
        expect(result.current.notifications).toEqual(mockNotifications)
        expect(result.current.unreadCount).toBe(1)
      })

      // markNotificationAsRead 실행
      result.current.markNotificationAsRead('notif-1')

      await waitFor(() => {
        // 무효화 후 notifications와 unreadCount 재요청
        expect(mockSupabaseNotificationServiceMethods.getUserNotifications).toHaveBeenCalledTimes(2)
        expect(mockSupabaseNotificationServiceMethods.getUnreadCount).toHaveBeenCalledTimes(2)
      })
    })
  })
})