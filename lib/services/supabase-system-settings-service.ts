import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/database.types'

// Supabase 테이블 타입 정의
type SystemSettingRow = Database['public']['Tables']['system_settings']['Row']
type SystemSettingInsert = Database['public']['Tables']['system_settings']['Insert']
type SystemSettingUpdate = Database['public']['Tables']['system_settings']['Update']

// 설정 값 타입 정의
interface SystemSettingValue {
  key: string
  value: any
  data_type: 'string' | 'number' | 'boolean' | 'json' | 'array'
  category: string
  description?: string
  is_public: boolean
  is_editable: boolean
  validation_rules?: any
}

/**
 * Supabase 시스템 설정 서비스 (Phase 4)
 * system_settings 테이블 관리
 */
export class SupabaseSystemSettingsService {
  /**
   * 시스템 설정 생성
   */
  static async createSetting(data: {
    key: string
    value: any
    data_type: 'string' | 'number' | 'boolean' | 'json' | 'array'
    category: string
    description?: string
    is_public?: boolean
    is_editable?: boolean
    validation_rules?: any
    default_value?: any
    updated_by: string
  }): Promise<SystemSettingRow | null> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return null
    }

    // 중복 키 확인
    const { data: existing } = await supabaseClient
      .from('system_settings')
      .select('key')
      .eq('key', data.key)
      .single()

    if (existing) {
      console.error(`시스템 설정 키 '${data.key}'가 이미 존재합니다`)
      return null
    }

    const settingData: SystemSettingInsert = {
      key: data.key,
      value: JSON.parse(JSON.stringify(data.value)),
      data_type: data.data_type,
      category: data.category,
      description: data.description || null,
      is_public: data.is_public !== false, // 기본값 true
      is_editable: data.is_editable !== false, // 기본값 true
      validation_rules: data.validation_rules ? JSON.parse(JSON.stringify(data.validation_rules)) : null,
      default_value: data.default_value ? JSON.parse(JSON.stringify(data.default_value)) : null,
      updated_by: data.updated_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: createdSetting, error } = await supabaseClient
      .from('system_settings')
      .insert(settingData)
      .select()
      .single()

    if (error || !createdSetting) {
      console.error('시스템 설정 생성 실패:', error)
      return null
    }

    return createdSetting
  }

  /**
   * 시스템 설정 값 조회
   */
  static async getSetting<T = any>(key: string): Promise<T | null> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return null
    }

    const { data, error } = await supabaseClient
      .from('system_settings')
      .select('value, data_type')
      .eq('key', key)
      .single()

    if (error || !data) {
      console.error(`시스템 설정 '${key}' 조회 실패:`, error)
      return null
    }

    return data.value as T
  }

  /**
   * 시스템 설정 상세 정보 조회
   */
  static async getSettingDetail(key: string): Promise<SystemSettingRow | null> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return null
    }

    const { data, error } = await supabaseClient
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .single()

    if (error || !data) {
      console.error(`시스템 설정 '${key}' 상세 조회 실패:`, error)
      return null
    }

    return data
  }

  /**
   * 공개 설정만 조회 (클라이언트용)
   */
  static async getPublicSettings(): Promise<{ [key: string]: any }> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return {}
    }

    const { data, error } = await supabaseClient
      .from('system_settings')
      .select('key, value')
      .eq('is_public', true)

    if (error) {
      console.error('공개 설정 조회 실패:', error)
      return {}
    }

    const settings: { [key: string]: any } = {}
    data?.forEach(setting => {
      settings[setting.key] = setting.value
    })

    return settings
  }

  /**
   * 카테고리별 설정 조회
   */
  static async getSettingsByCategory(
    category: string,
    includePrivate: boolean = false
  ): Promise<SystemSettingRow[]> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return []
    }

    let query = supabaseClient
      .from('system_settings')
      .select('*')
      .eq('category', category)

    if (!includePrivate) {
      query = query.eq('is_public', true)
    }

    query = query.order('key', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error(`카테고리 '${category}' 설정 조회 실패:`, error)
      return []
    }

    return data || []
  }

  /**
   * 모든 설정 조회 (관리자용)
   */
  static async getAllSettings(options?: {
    category?: string
    is_public?: boolean
    is_editable?: boolean
    search?: string
    limit?: number
    offset?: number
  }): Promise<SystemSettingRow[]> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return []
    }

    let query = supabaseClient
      .from('system_settings')
      .select('*')

    // 필터링 조건 적용
    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.is_public !== undefined) {
      query = query.eq('is_public', options.is_public)
    }

    if (options?.is_editable !== undefined) {
      query = query.eq('is_editable', options.is_editable)
    }

    if (options?.search) {
      query = query.or(`key.ilike.%${options.search}%,description.ilike.%${options.search}%`)
    }

    query = query.order('category', { ascending: true })
      .order('key', { ascending: true })

    if (options?.limit) {
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + options.limit) - 1)
      } else {
        query = query.limit(options.limit)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('전체 설정 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 시스템 설정 값 업데이트
   */
  static async updateSetting(
    key: string,
    value: any,
    updatedBy: string,
    validateValue: boolean = true
  ): Promise<SystemSettingRow | null> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return null
    }

    // 기존 설정 조회
    const existingSetting = await this.getSettingDetail(key)
    if (!existingSetting) {
      console.error(`시스템 설정 '${key}'가 존재하지 않습니다`)
      return null
    }

    if (!existingSetting.is_editable) {
      console.error(`시스템 설정 '${key}'는 편집할 수 없습니다`)
      return null
    }

    // 값 유효성 검증
    if (validateValue && existingSetting.validation_rules) {
      const isValid = this.validateSettingValue(value, existingSetting.validation_rules)
      if (!isValid) {
        console.error(`시스템 설정 '${key}' 값이 유효하지 않습니다`)
        return null
      }
    }

    // 데이터 타입에 따른 값 변환
    const convertedValue = this.convertValueByDataType(value, existingSetting.data_type)

    const updateData: SystemSettingUpdate = {
      value: JSON.parse(JSON.stringify(convertedValue)),
      updated_by: updatedBy,
      updated_at: new Date().toISOString()
    }

    const { data: updatedSetting, error } = await supabaseClient
      .from('system_settings')
      .update(updateData)
      .eq('key', key)
      .select()
      .single()

    if (error || !updatedSetting) {
      console.error(`시스템 설정 '${key}' 업데이트 실패:`, error)
      return null
    }

    return updatedSetting
  }

  /**
   * 여러 설정을 한 번에 업데이트
   */
  static async updateMultipleSettings(
    settings: Array<{ key: string; value: any }>,
    updatedBy: string
  ): Promise<{ success: boolean; updated_count: number; errors: string[] }> {
    const errors: string[] = []
    let updatedCount = 0

    for (const setting of settings) {
      try {
        const result = await this.updateSetting(setting.key, setting.value, updatedBy)
        if (result) {
          updatedCount++
        } else {
          errors.push(`설정 '${setting.key}' 업데이트 실패`)
        }
      } catch (error) {
        errors.push(`설정 '${setting.key}' 업데이트 중 오류: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      updated_count: updatedCount,
      errors
    }
  }

  /**
   * 시스템 설정 삭제
   */
  static async deleteSetting(key: string): Promise<boolean> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return false
    }

    // 기존 설정 조회 (편집 가능 여부 확인)
    const existingSetting = await this.getSettingDetail(key)
    if (!existingSetting) {
      console.error(`시스템 설정 '${key}'가 존재하지 않습니다`)
      return false
    }

    if (!existingSetting.is_editable) {
      console.error(`시스템 설정 '${key}'는 삭제할 수 없습니다`)
      return false
    }

    const { error } = await supabaseClient
      .from('system_settings')
      .delete()
      .eq('key', key)

    if (error) {
      console.error(`시스템 설정 '${key}' 삭제 실패:`, error)
      return false
    }

    return true
  }

  /**
   * 설정 카테고리 목록 조회
   */
  static async getCategories(): Promise<{ category: string; count: number }[]> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabaseClient
      .from('system_settings')
      .select('category')

    if (error) {
      console.error('설정 카테고리 조회 실패:', error)
      return []
    }

    // 카테고리별 개수 집계
    const categoryCount: { [key: string]: number } = {}
    data?.forEach(setting => {
      categoryCount[setting.category] = (categoryCount[setting.category] || 0) + 1
    })

    return Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => a.category.localeCompare(b.category))
  }

  /**
   * 설정 초기화 (기본값으로 복원)
   */
  static async resetSettingToDefault(key: string, updatedBy: string): Promise<SystemSettingRow | null> {
    const existingSetting = await this.getSettingDetail(key)
    if (!existingSetting) {
      console.error(`시스템 설정 '${key}'가 존재하지 않습니다`)
      return null
    }

    if (!existingSetting.default_value) {
      console.error(`시스템 설정 '${key}'에는 기본값이 설정되어 있지 않습니다`)
      return null
    }

    return this.updateSetting(key, existingSetting.default_value, updatedBy, false)
  }

  /**
   * 설정 백업 생성
   */
  static async createSettingsBackup(): Promise<{
    backup_data: SystemSettingRow[]
    backup_timestamp: string
    setting_count: number
  } | null> {
    const allSettings = await this.getAllSettings()
    
    if (allSettings.length === 0) {
      return null
    }

    return {
      backup_data: allSettings,
      backup_timestamp: new Date().toISOString(),
      setting_count: allSettings.length
    }
  }

  /**
   * 설정 값 유효성 검증
   */
  private static validateSettingValue(value: any, validationRules: any): boolean {
    if (!validationRules) {
      return true
    }

    try {
      // 기본 유효성 검증 규칙들
      if (validationRules.required && (value === null || value === undefined || value === '')) {
        return false
      }

      if (validationRules.min !== undefined && typeof value === 'number' && value < validationRules.min) {
        return false
      }

      if (validationRules.max !== undefined && typeof value === 'number' && value > validationRules.max) {
        return false
      }

      if (validationRules.minLength !== undefined && typeof value === 'string' && value.length < validationRules.minLength) {
        return false
      }

      if (validationRules.maxLength !== undefined && typeof value === 'string' && value.length > validationRules.maxLength) {
        return false
      }

      if (validationRules.pattern && typeof value === 'string') {
        const regex = new RegExp(validationRules.pattern)
        if (!regex.test(value)) {
          return false
        }
      }

      if (validationRules.enum && !validationRules.enum.includes(value)) {
        return false
      }

      return true
    } catch (error) {
      console.error('설정 값 유효성 검증 중 오류:', error)
      return false
    }
  }

  /**
   * 데이터 타입에 따른 값 변환
   */
  private static convertValueByDataType(value: any, dataType: string): any {
    switch (dataType) {
      case 'string':
        return String(value)
      case 'number':
        return Number(value)
      case 'boolean':
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true'
        }
        return Boolean(value)
      case 'json':
      case 'array':
        return value
      default:
        return value
    }
  }

  /**
   * 시스템 설정 템플릿 생성
   */
  static async createSettingTemplate(
    category: string,
    settings: Array<{
      key: string
      value: any
      data_type: 'string' | 'number' | 'boolean' | 'json' | 'array'
      description?: string
      is_public?: boolean
      is_editable?: boolean
      validation_rules?: any
      default_value?: any
    }>,
    createdBy: string
  ): Promise<{ success: boolean; created_count: number; errors: string[] }> {
    const errors: string[] = []
    let createdCount = 0

    for (const setting of settings) {
      try {
        const result = await this.createSetting({
          key: setting.key,
          value: setting.value,
          data_type: setting.data_type,
          category,
          description: setting.description,
          is_public: setting.is_public,
          is_editable: setting.is_editable,
          validation_rules: setting.validation_rules,
          default_value: setting.default_value,
          updated_by: createdBy
        })

        if (result) {
          createdCount++
        } else {
          errors.push(`설정 '${setting.key}' 생성 실패`)
        }
      } catch (error) {
        errors.push(`설정 '${setting.key}' 생성 중 오류: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      created_count: createdCount,
      errors
    }
  }
}