import { supabase } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/auth'

export class SupabaseSettingsService {
  private static instance: SupabaseSettingsService
  private storagePrefix = 'hiko_settings_'

  static getInstance(): SupabaseSettingsService {
    if (!SupabaseSettingsService.instance) {
      SupabaseSettingsService.instance = new SupabaseSettingsService()
    }
    return SupabaseSettingsService.instance
  }

  /**
   * 특정 설정값 조회
   */
  async getSetting<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // Supabase에서 사용자 설정 조회
        const { data, error } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Supabase settings 조회 오류:', error)
          return this.getLocalSetting(key, defaultValue)
        }

        const settings = data?.preferences?.settings || {}
        return settings[key] !== undefined ? settings[key] : defaultValue
      } else {
        // 비인증 사용자는 localStorage 사용
        return this.getLocalSetting(key, defaultValue)
      }
    } catch (error) {
      console.error('getSetting 오류:', error)
      return this.getLocalSetting(key, defaultValue)
    }
  }

  /**
   * 특정 설정값 저장
   */
  async setSetting<T = any>(key: string, value: T): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // 현재 preferences 조회
        const { data: currentData, error: fetchError } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          console.error('현재 preferences 조회 오류:', fetchError)
          this.setLocalSetting(key, value)
          return false
        }

        // settings 업데이트
        const currentPreferences = currentData?.preferences || {}
        const currentSettings = currentPreferences.settings || {}
        
        const updatedPreferences = {
          ...currentPreferences,
          settings: {
            ...currentSettings,
            [key]: value
          }
        }

        const { error: updateError } = await supabase()
          .from('user_profiles')
          .update({ 
            preferences: updatedPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('설정 업데이트 오류:', updateError)
          this.setLocalSetting(key, value)
          return false
        }

        return true
      } else {
        // 비인증 사용자는 localStorage 사용
        this.setLocalSetting(key, value)
        return true
      }
    } catch (error) {
      console.error('setSetting 오류:', error)
      this.setLocalSetting(key, value)
      return false
    }
  }

  /**
   * 모든 설정 조회
   */
  async getSettings(): Promise<Record<string, any>> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // Supabase에서 모든 설정 조회
        const { data, error } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Supabase 모든 설정 조회 오류:', error)
          return this.getLocalSettings()
        }

        return data?.preferences?.settings || {}
      } else {
        // 비인증 사용자는 localStorage 사용
        return this.getLocalSettings()
      }
    } catch (error) {
      console.error('getSettings 오류:', error)
      return this.getLocalSettings()
    }
  }

  /**
   * 여러 설정값 한번에 업데이트
   */
  async updateSettings(newSettings: Record<string, any>): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // 현재 preferences 조회
        const { data: currentData, error: fetchError } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          console.error('현재 preferences 조회 오류:', fetchError)
          this.updateLocalSettings(newSettings)
          return false
        }

        // settings 병합 업데이트
        const currentPreferences = currentData?.preferences || {}
        const currentSettings = currentPreferences.settings || {}
        
        const updatedPreferences = {
          ...currentPreferences,
          settings: {
            ...currentSettings,
            ...newSettings
          }
        }

        const { error: updateError } = await supabase()
          .from('user_profiles')
          .update({ 
            preferences: updatedPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('설정 대량 업데이트 오류:', updateError)
          this.updateLocalSettings(newSettings)
          return false
        }

        return true
      } else {
        // 비인증 사용자는 localStorage 사용
        this.updateLocalSettings(newSettings)
        return true
      }
    } catch (error) {
      console.error('updateSettings 오류:', error)
      this.updateLocalSettings(newSettings)
      return false
    }
  }

  /**
   * 특정 설정 제거
   */
  async removeSetting(key: string): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // 현재 preferences 조회
        const { data: currentData, error: fetchError } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          console.error('현재 preferences 조회 오류:', fetchError)
          this.removeLocalSetting(key)
          return false
        }

        // settings에서 키 제거
        const currentPreferences = currentData?.preferences || {}
        const currentSettings = currentPreferences.settings || {}
        
        const { [key]: removed, ...remainingSettings } = currentSettings
        
        const updatedPreferences = {
          ...currentPreferences,
          settings: remainingSettings
        }

        const { error: updateError } = await supabase()
          .from('user_profiles')
          .update({ 
            preferences: updatedPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('설정 제거 오류:', updateError)
          this.removeLocalSetting(key)
          return false
        }

        return true
      } else {
        // 비인증 사용자는 localStorage 사용
        this.removeLocalSetting(key)
        return true
      }
    } catch (error) {
      console.error('removeSetting 오류:', error)
      this.removeLocalSetting(key)
      return false
    }
  }

  /**
   * 모든 설정 초기화
   */
  async clearSettings(): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // Supabase에서 settings만 초기화
        const { data: currentData, error: fetchError } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          console.error('현재 preferences 조회 오류:', fetchError)
          this.clearLocalSettings()
          return false
        }

        const currentPreferences = currentData?.preferences || {}
        
        const updatedPreferences = {
          ...currentPreferences,
          settings: {}
        }

        const { error: updateError } = await supabase()
          .from('user_profiles')
          .update({ 
            preferences: updatedPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('설정 전체 초기화 오류:', updateError)
          this.clearLocalSettings()
          return false
        }

        return true
      } else {
        // 비인증 사용자는 localStorage 초기화
        this.clearLocalSettings()
        return true
      }
    } catch (error) {
      console.error('clearSettings 오류:', error)
      this.clearLocalSettings()
      return false
    }
  }

  // localStorage 폴백 메서드들
  private getLocalSetting<T = any>(key: string, defaultValue?: T): T | undefined {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const stored = localStorage.getItem(`${this.storagePrefix}${key}`)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  }

  private setLocalSetting<T = any>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(`${this.storagePrefix}${key}`, JSON.stringify(value))
    } catch (error) {
      console.error('localStorage 설정 저장 오류:', error)
    }
  }

  private getLocalSettings(): Record<string, any> {
    if (typeof window === 'undefined') return {}
    
    const settings: Record<string, any> = {}
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.storagePrefix)) {
          const settingKey = key.replace(this.storagePrefix, '')
          const value = localStorage.getItem(key)
          if (value) {
            settings[settingKey] = JSON.parse(value)
          }
        }
      }
    } catch (error) {
      console.error('localStorage 설정 조회 오류:', error)
    }
    
    return settings
  }

  private updateLocalSettings(newSettings: Record<string, any>): void {
    if (typeof window === 'undefined') return
    
    try {
      Object.entries(newSettings).forEach(([key, value]) => {
        localStorage.setItem(`${this.storagePrefix}${key}`, JSON.stringify(value))
      })
    } catch (error) {
      console.error('localStorage 설정 대량 업데이트 오류:', error)
    }
  }

  private removeLocalSetting(key: string): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(`${this.storagePrefix}${key}`)
    } catch (error) {
      console.error('localStorage 설정 제거 오류:', error)
    }
  }

  private clearLocalSettings(): void {
    if (typeof window === 'undefined') return
    
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.storagePrefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('localStorage 설정 전체 초기화 오류:', error)
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const supabaseSettingsService = SupabaseSettingsService.getInstance()