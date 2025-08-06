import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock query results storage - 전역 사용 지양
let mockQueryResult: any = null

// Mock Supabase query builder - 완전한 체이닝 지원
const createMockQuery = () => {
  const query = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
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

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  key: vi.fn(),
  length: 0
}

// Window mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

import { SupabaseSettingsService } from '@/lib/services/supabase-settings-service'

describe('SupabaseSettingsService', () => {
  let settingsService: SupabaseSettingsService

  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = null
    settingsService = SupabaseSettingsService.getInstance()
    mockLocalStorage.length = 0
  })

  describe('getSetting', () => {
    it('should get setting from Supabase for authenticated user', async () => {
      const userId = 'user-123'
      const settingKey = 'theme'
      const settingValue = 'dark'

      const mockProfile = {
        preferences: {
          settings: {
            [settingKey]: settingValue
          }
        }
      }

      // 격리된 mock 설정
      const getMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      }

      mockSupabaseClient.from = vi.fn(() => getMockQuery)

      const result = await settingsService.getSetting(settingKey, 'light', userId)

      expect(result).toBe(settingValue)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should return default value when setting not found in Supabase', async () => {
      const userId = 'user-123'
      const settingKey = 'theme'
      const defaultValue = 'light'

      const mockProfile = {
        preferences: {
          settings: {}
        }
      }

      // 격리된 mock 설정
      const getMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      }

      mockSupabaseClient.from = vi.fn(() => getMockQuery)

      const result = await settingsService.getSetting(settingKey, defaultValue, userId)

      expect(result).toBe(defaultValue)
    })

    it('should fallback to localStorage when Supabase query fails', async () => {
      const userId = 'user-123'
      const settingKey = 'theme'
      const localValue = 'dark'

      // Supabase 에러 mock
      const errorMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }

      mockSupabaseClient.from = vi.fn(() => errorMockQuery)
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(localValue))

      const result = await settingsService.getSetting(settingKey, 'light', userId)

      expect(result).toBe(localValue)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`hiko_settings_${settingKey}`)
    })

    it('should use localStorage for non-authenticated user', async () => {
      const settingKey = 'theme'
      const localValue = 'dark'

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(localValue))

      const result = await settingsService.getSetting(settingKey, 'light')

      expect(result).toBe(localValue)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`hiko_settings_${settingKey}`)
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })

  describe('setSetting', () => {
    it('should set setting in Supabase for authenticated user', async () => {
      const userId = 'user-123'
      const settingKey = 'theme'
      const settingValue = 'dark'

      const currentProfile = {
        preferences: {
          settings: {}
        }
      }

      // 격리된 mock 설정 - setSetting은 2번의 쿼리 필요
      let callCount = 0
      const setMockQuery = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            // 첫 번째 호출: 현재 preferences 조회
            return Promise.resolve({ data: currentProfile, error: null })
          } else {
            // 두 번째 호출: 업데이트
            return Promise.resolve({ data: null, error: null })
          }
        })
      }

      mockSupabaseClient.from = vi.fn(() => setMockQuery)

      const result = await settingsService.setSetting(settingKey, settingValue, userId)

      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should handle Supabase fetch error and fallback to localStorage', async () => {
      const userId = 'user-123'
      const settingKey = 'theme'
      const settingValue = 'dark'

      // 격리된 에러 mock 설정
      const errorMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }

      mockSupabaseClient.from = vi.fn(() => errorMockQuery)

      const result = await settingsService.setSetting(settingKey, settingValue, userId)

      expect(result).toBe(false)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `hiko_settings_${settingKey}`,
        JSON.stringify(settingValue)
      )
    })

    it('should handle Supabase update error and fallback to localStorage', async () => {
      const userId = 'user-123'
      const settingKey = 'theme'
      const settingValue = 'dark'

      const currentProfile = {
        preferences: {
          settings: {}
        }
      }

      // 격리된 mock 설정 - 조회는 성공, 업데이트는 실패
      let callCount = 0
      const updateErrorMockQuery = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            // 첫 번째 호출: 현재 preferences 조회 성공
            return Promise.resolve({ data: currentProfile, error: null })
          } else {
            // 두 번째 호출: 업데이트 실패
            return Promise.resolve({ data: null, error: { message: 'Update failed' } })
          }
        })
      }

      mockSupabaseClient.from = vi.fn(() => updateErrorMockQuery)

      const result = await settingsService.setSetting(settingKey, settingValue, userId)

      expect(result).toBe(false)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `hiko_settings_${settingKey}`,
        JSON.stringify(settingValue)
      )
    })

    it('should use localStorage for non-authenticated user', async () => {
      const settingKey = 'theme'
      const settingValue = 'dark'

      const result = await settingsService.setSetting(settingKey, settingValue)

      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `hiko_settings_${settingKey}`,
        JSON.stringify(settingValue)
      )
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })

  describe('getSettings', () => {
    it('should get all settings from Supabase for authenticated user', async () => {
      const userId = 'user-123'
      const allSettings = {
        theme: 'dark',
        language: 'ko',
        notifications: true
      }

      const mockProfile = {
        preferences: {
          settings: allSettings
        }
      }

      // 격리된 mock 설정
      const getAllMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      }

      mockSupabaseClient.from = vi.fn(() => getAllMockQuery)

      const result = await settingsService.getSettings(userId)

      expect(result).toEqual(allSettings)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should return empty object when no settings found in Supabase', async () => {
      const userId = 'user-123'

      const mockProfile = {
        preferences: {}
      }

      // 격리된 mock 설정
      const emptyMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      }

      mockSupabaseClient.from = vi.fn(() => emptyMockQuery)

      const result = await settingsService.getSettings(userId)

      expect(result).toEqual({})
    })

    it('should use localStorage for non-authenticated user', async () => {
      const localSettings = {
        theme: 'dark',
        language: 'ko'
      }

      // Mock localStorage keys and values
      mockLocalStorage.length = 2
      mockLocalStorage.key.mockImplementation((index) => {
        const keys = ['hiko_settings_theme', 'hiko_settings_language']
        return keys[index] || null
      })
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'hiko_settings_theme') return JSON.stringify('dark')
        if (key === 'hiko_settings_language') return JSON.stringify('ko')
        return null
      })

      const result = await settingsService.getSettings()

      expect(result).toEqual(localSettings)
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })

  describe('updateSettings', () => {
    it('should update multiple settings in Supabase for authenticated user', async () => {
      const userId = 'user-123'
      const newSettings = {
        theme: 'dark',
        language: 'en',
        notifications: false
      }

      const currentProfile = {
        preferences: {
          settings: {
            theme: 'light'
          }
        }
      }

      // 격리된 mock 설정 - updateSettings는 2번의 쿼리 필요
      let callCount = 0
      const updateMockQuery = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            // 첫 번째 호출: 현재 preferences 조회
            return Promise.resolve({ data: currentProfile, error: null })
          } else {
            // 두 번째 호출: 업데이트
            return Promise.resolve({ data: null, error: null })
          }
        })
      }

      mockSupabaseClient.from = vi.fn(() => updateMockQuery)

      const result = await settingsService.updateSettings(newSettings, userId)

      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should use localStorage for non-authenticated user', async () => {
      const newSettings = {
        theme: 'dark',
        language: 'en'
      }

      const result = await settingsService.updateSettings(newSettings)

      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'hiko_settings_theme',
        JSON.stringify('dark')
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'hiko_settings_language',
        JSON.stringify('en')
      )
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })

  describe('removeSetting', () => {
    it('should remove setting from Supabase for authenticated user', async () => {
      const userId = 'user-123'
      const settingKey = 'theme'

      const currentProfile = {
        preferences: {
          settings: {
            theme: 'dark',
            language: 'ko'
          }
        }
      }

      // 격리된 mock 설정 - removeSetting는 2번의 쿼리 필요
      let callCount = 0
      const removeMockQuery = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            // 첫 번째 호출: 현재 preferences 조회
            return Promise.resolve({ data: currentProfile, error: null })
          } else {
            // 두 번째 호출: 업데이트 (theme 키 제거됨)
            return Promise.resolve({ data: null, error: null })
          }
        })
      }

      mockSupabaseClient.from = vi.fn(() => removeMockQuery)

      const result = await settingsService.removeSetting(settingKey, userId)

      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should use localStorage for non-authenticated user', async () => {
      const settingKey = 'theme'

      const result = await settingsService.removeSetting(settingKey)

      expect(result).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(`hiko_settings_${settingKey}`)
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })

  describe('clearSettings', () => {
    it('should clear all settings in Supabase for authenticated user', async () => {
      const userId = 'user-123'

      const currentProfile = {
        preferences: {
          settings: {
            theme: 'dark',
            language: 'ko'
          },
          other: 'data'
        }
      }

      // 격리된 mock 설정 - clearSettings는 2번의 쿼리 필요
      let callCount = 0
      const clearMockQuery = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            // 첫 번째 호출: 현재 preferences 조회
            return Promise.resolve({ data: currentProfile, error: null })
          } else {
            // 두 번째 호출: 업데이트 (settings 초기화)
            return Promise.resolve({ data: null, error: null })
          }
        })
      }

      mockSupabaseClient.from = vi.fn(() => clearMockQuery)

      const result = await settingsService.clearSettings(userId)

      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should clear localStorage for non-authenticated user', async () => {
      // Mock localStorage keys
      mockLocalStorage.length = 3
      mockLocalStorage.key.mockImplementation((index) => {
        const keys = ['hiko_settings_theme', 'hiko_settings_language', 'other_key']
        return keys[index] || null
      })

      const result = await settingsService.clearSettings()

      expect(result).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('hiko_settings_theme')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('hiko_settings_language')
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other_key')
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SupabaseSettingsService.getInstance()
      const instance2 = SupabaseSettingsService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })
})