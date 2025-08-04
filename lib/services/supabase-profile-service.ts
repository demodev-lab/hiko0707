import { supabase as getSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/database.types'
import type { UserProfile, UserAddress } from '@/types/user'

// profiles 테이블이 아직 존재하지 않으므로 임시 타입 정의
type ProfileRow = {
  id: string
  user_id: string
  display_name: string | null
  phone_number: string | null
  avatar_url: string | null
  language: string
  notification_enabled: boolean
  notification_types: string[]
  created_at: string
  updated_at: string | null
}

type ProfileInsert = {
  id?: string
  user_id: string
  display_name?: string | null
  phone_number?: string | null
  avatar_url?: string | null
  language?: string
  notification_enabled?: boolean
  notification_types?: string[]
  created_at?: string
}

type ProfileUpdate = {
  display_name?: string | null
  phone_number?: string | null
  avatar_url?: string | null
  language?: string
  notification_enabled?: boolean
  notification_types?: string[]
  updated_at?: string
}

type AddressRow = Database['public']['Tables']['user_addresses']['Row']
type AddressInsert = Database['public']['Tables']['user_addresses']['Insert']
type AddressUpdate = Database['public']['Tables']['user_addresses']['Update']

export class SupabaseProfileService {
  /**
   * 사용자 프로필 조회
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.error('프로필 조회 실패:', error)
      return null
    }

    return this.mapProfileFromDB(data)
  }

  /**
   * 사용자 프로필 생성
   */
  static async createProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    const supabase = getSupabaseClient()
    const insertData: ProfileInsert = {
      user_id: userId,
      display_name: profileData.displayName || null,
      phone_number: profileData.phoneNumber || null,
      avatar_url: profileData.avatarUrl || null,
      language: profileData.language || 'ko',
      notification_enabled: profileData.notificationEnabled ?? true,
      notification_types: profileData.notificationTypes || ['order_status', 'hot_deal'],
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(insertData)
      .select()
      .single()

    if (error || !data) {
      console.error('프로필 생성 실패:', error)
      return null
    }

    return this.mapProfileFromDB(data)
  }

  /**
   * 사용자 프로필 업데이트
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const supabase = getSupabaseClient()
    const updateData: ProfileUpdate = {
      display_name: updates.displayName,
      phone_number: updates.phoneNumber,
      avatar_url: updates.avatarUrl,
      language: updates.language,
      notification_enabled: updates.notificationEnabled,
      notification_types: updates.notificationTypes,
      updated_at: new Date().toISOString()
    }

    // undefined 값 제거
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof ProfileUpdate] === undefined) {
        delete updateData[key as keyof ProfileUpdate]
      }
    })

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) {
      console.error('프로필 업데이트 실패:', error)
      return null
    }

    return this.mapProfileFromDB(data)
  }

  /**
   * 사용자 주소 목록 조회
   */
  static async getAddresses(userId: string): Promise<UserAddress[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('주소 목록 조회 실패:', error)
      return []
    }

    return data.map(this.mapAddressFromDB)
  }

  /**
   * 주소 추가
   */
  static async addAddress(userId: string, addressData: Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserAddress | null> {
    const supabase = getSupabaseClient()
    // 첫 번째 주소인 경우 기본 주소로 설정
    const existingAddresses = await this.getAddresses(userId)
    const isFirstAddress = existingAddresses.length === 0

    const insertData: AddressInsert = {
      user_id: userId,
      name: addressData.name,
      phone: addressData.phone,
      post_code: addressData.postalCode,
      address: addressData.address,
      address_detail: addressData.addressDetail || null,
      is_default: isFirstAddress || addressData.isDefault || false,
      created_at: new Date().toISOString()
    }

    // 새 주소가 기본 주소인 경우 기존 기본 주소 해제
    if (insertData.is_default && !isFirstAddress) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .insert(insertData)
      .select()
      .single()

    if (error || !data) {
      console.error('주소 추가 실패:', error)
      return null
    }

    return this.mapAddressFromDB(data)
  }

  /**
   * 주소 업데이트
   */
  static async updateAddress(addressId: string, updates: Partial<UserAddress>): Promise<UserAddress | null> {
    const supabase = getSupabaseClient()
    const updateData: AddressUpdate = {
      name: updates.name,
      phone: updates.phone,
      post_code: updates.postalCode,
      address: updates.address,
      address_detail: updates.addressDetail,
      is_default: updates.isDefault,
      updated_at: new Date().toISOString()
    }

    // undefined 값 제거
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof AddressUpdate] === undefined) {
        delete updateData[key as keyof AddressUpdate]
      }
    })

    // 기본 주소로 변경하는 경우
    if (updates.isDefault === true) {
      // 먼저 해당 주소의 user_id 조회
      const { data: addressData } = await supabase
        .from('user_addresses')
        .select('user_id')
        .eq('id', addressId)
        .single()

      if (addressData) {
        // 기존 기본 주소 해제
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', addressData.user_id)
          .eq('is_default', true)
          .neq('id', addressId)
      }
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .update(updateData)
      .eq('id', addressId)
      .select()
      .single()

    if (error || !data) {
      console.error('주소 업데이트 실패:', error)
      return null
    }

    return this.mapAddressFromDB(data)
  }

  /**
   * 주소 삭제
   */
  static async deleteAddress(addressId: string): Promise<boolean> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)

    if (error) {
      console.error('주소 삭제 실패:', error)
      return false
    }

    return true
  }

  /**
   * 기본 주소 설정
   */
  static async setDefaultAddress(userId: string, addressId: string): Promise<boolean> {
    const supabase = getSupabaseClient()
    // 트랜잭션 대신 순차 처리
    // 1. 기존 기본 주소 해제
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true)

    // 2. 새로운 기본 주소 설정
    const { error } = await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId)

    if (error) {
      console.error('기본 주소 설정 실패:', error)
      return false
    }

    return true
  }

  /**
   * DB 프로필 데이터를 앱 타입으로 변환
   */
  private static mapProfileFromDB(data: ProfileRow): UserProfile {
    return {
      id: data.id,
      userId: data.user_id,
      displayName: data.display_name || undefined,
      phoneNumber: data.phone_number || undefined,
      avatarUrl: data.avatar_url || undefined,
      language: data.language as 'ko' | 'en' | 'zh' | 'vi' | 'mn' | 'th' | 'ja' | 'ru',
      notificationEnabled: data.notification_enabled,
      notificationTypes: data.notification_types as Array<'order_status' | 'hot_deal' | 'comment' | 'like'>,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    }
  }

  /**
   * DB 주소 데이터를 앱 타입으로 변환
   */
  private static mapAddressFromDB(data: AddressRow): UserAddress {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      phone: data.phone,
      postalCode: data.post_code,
      address: data.address,
      addressDetail: data.address_detail || undefined,
      isDefault: data.is_default,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    }
  }
}