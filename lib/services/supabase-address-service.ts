import { supabase } from '@/lib/supabase/client'
import type { 
  UserAddressRow, 
  UserAddressInsert, 
  UserAddressUpdate,
  ProxyPurchaseAddressRow,
  ProxyPurchaseAddressInsert,
  ProxyPurchaseAddressUpdate
} from '@/lib/types/supabase'

/**
 * Supabase 주소 관리 서비스
 * user_addresses, proxy_purchase_addresses 테이블 관리
 */
export class SupabaseAddressService {
  /**
   * 사용자 주소 생성
   */
  static async createUserAddress(addressData: Omit<UserAddressInsert, 'created_at' | 'updated_at'>): Promise<UserAddressRow | null> {
    const supabaseClient = supabase()
    
    const insertData: UserAddressInsert = {
      ...addressData,
      is_default: addressData.is_default || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 기본 주소로 설정하는 경우, 기존 기본 주소 해제
    if (insertData.is_default) {
      await this.clearDefaultAddress(addressData.user_id)
    }

    const { data, error } = await supabaseClient
      .from('user_addresses')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('사용자 주소 생성 실패:', error)
      return null
    }

    return data
  }

  /**
   * 사용자별 주소 목록 조회
   */
  static async getUserAddresses(userId: string): Promise<UserAddressRow[]> {
    const supabaseClient = supabase()

    const { data, error } = await supabaseClient
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('사용자 주소 목록 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 기본 주소 조회
   */
  static async getDefaultAddress(userId: string): Promise<UserAddressRow | null> {
    const supabaseClient = supabase()

    const { data, error } = await supabaseClient
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle()

    if (error) {
      console.error('기본 주소 조회 실패:', error)
      return null
    }

    return data
  }

  /**
   * 주소 ID로 주소 정보 조회
   */
  static async getUserAddressById(addressId: string): Promise<UserAddressRow | null> {
    const supabaseClient = supabase()

    const { data, error } = await supabaseClient
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .single()

    if (error) {
      console.error('주소 정보 조회 실패:', error)
      return null
    }

    return data
  }

  /**
   * 사용자 주소 업데이트
   */
  static async updateUserAddress(addressId: string, updates: UserAddressUpdate): Promise<UserAddressRow | null> {
    const supabaseClient = supabase()

    const updateData: UserAddressUpdate = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // 기본 주소로 변경하는 경우, 기존 기본 주소 해제
    if (updateData.is_default) {
      const { data: currentAddress } = await supabaseClient
        .from('user_addresses')
        .select('user_id')
        .eq('id', addressId)
        .single()

      if (currentAddress) {
        await this.clearDefaultAddress(currentAddress.user_id)
      }
    }

    // undefined 값 제거
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UserAddressUpdate] === undefined) {
        delete updateData[key as keyof UserAddressUpdate]
      }
    })

    const { data, error } = await supabaseClient
      .from('user_addresses')
      .update(updateData)
      .eq('id', addressId)
      .select()
      .single()

    if (error) {
      console.error('사용자 주소 업데이트 실패:', error)
      return null
    }

    return data
  }

  /**
   * 사용자 주소 삭제
   */
  static async deleteUserAddress(addressId: string): Promise<boolean> {
    const supabaseClient = supabase()

    const { error } = await supabaseClient
      .from('user_addresses')
      .delete()
      .eq('id', addressId)

    if (error) {
      console.error('사용자 주소 삭제 실패:', error)
      return false
    }

    return true
  }

  /**
   * 기존 기본 주소 해제
   */
  private static async clearDefaultAddress(userId: string): Promise<void> {
    const supabaseClient = supabase()

    await supabaseClient
      .from('user_addresses')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_default', true)
  }

  /**
   * 기본 주소로 설정
   */
  static async setDefaultAddress(addressId: string): Promise<UserAddressRow | null> {
    const supabaseClient = supabase()

    // 먼저 해당 주소의 사용자 ID 조회
    const { data: address } = await supabaseClient
      .from('user_addresses')
      .select('user_id')
      .eq('id', addressId)
      .single()

    if (!address) {
      console.error('주소를 찾을 수 없습니다')
      return null
    }

    // 기존 기본 주소 해제
    await this.clearDefaultAddress(address.user_id)

    // 새로운 기본 주소 설정
    return await this.updateUserAddress(addressId, { is_default: true })
  }

  /**
   * 프록시 구매 주소 생성 (주문 전용 배송지)
   * proxy_purchase_addresses 테이블은 email 필드를 포함
   */
  static async createProxyPurchaseAddress(addressData: ProxyPurchaseAddressInsert): Promise<ProxyPurchaseAddressRow | null> {
    const supabaseClient = supabase()

    const { data, error } = await supabaseClient
      .from('proxy_purchase_addresses')
      .insert(addressData)
      .select()
      .single()

    if (error) {
      console.error('프록시 구매 주소 생성 실패:', error)
      return null
    }

    return data
  }

  /**
   * 프록시 구매 주소 조회 (주문별)
   */
  static async getProxyPurchaseAddress(proxyPurchaseId: string): Promise<ProxyPurchaseAddressRow | null> {
    const supabaseClient = supabase()

    const { data, error } = await supabaseClient
      .from('proxy_purchase_addresses')
      .select('*')
      .eq('proxy_purchase_id', proxyPurchaseId)
      .single()

    if (error) {
      console.error('프록시 구매 주소 조회 실패:', error)
      return null
    }

    return data
  }

  /**
   * 프록시 구매 주소 업데이트
   */
  static async updateProxyPurchaseAddress(addressId: string, updates: ProxyPurchaseAddressUpdate): Promise<ProxyPurchaseAddressRow | null> {
    const supabaseClient = supabase()

    // undefined 값 제거
    const updateData = { ...updates }
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof ProxyPurchaseAddressUpdate] === undefined) {
        delete updateData[key as keyof ProxyPurchaseAddressUpdate]
      }
    })

    const { data, error } = await supabaseClient
      .from('proxy_purchase_addresses')
      .update(updateData)
      .eq('id', addressId)
      .select()
      .single()

    if (error) {
      console.error('프록시 구매 주소 업데이트 실패:', error)
      return null
    }

    return data
  }

  /**
   * 사용자 주소를 프록시 구매 주소로 복사
   * email 필드는 별도로 제공해야 함 (user_addresses 테이블에 email 없음)
   */
  static async copyUserAddressToProxyPurchase(
    userAddressId: string, 
    proxyPurchaseId: string,
    email: string
  ): Promise<ProxyPurchaseAddressRow | null> {
    const userAddress = await this.getUserAddressById(userAddressId)
    
    if (!userAddress) {
      console.error('복사할 사용자 주소를 찾을 수 없습니다')
      return null
    }

    const proxyAddressData: ProxyPurchaseAddressInsert = {
      proxy_purchase_id: proxyPurchaseId,
      recipient_name: userAddress.name,
      email: email,
      phone_number: userAddress.phone,
      address: userAddress.address,
      detail_address: userAddress.address_detail || ''
    }

    return await this.createProxyPurchaseAddress(proxyAddressData)
  }

  /**
   * 주소 검증 및 정규화
   */
  static validateAddress(address: {
    name: string
    phone: string
    address: string
    post_code: string
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // 이름 검증
    if (!address.name || address.name.trim().length < 2) {
      errors.push('받는 분 이름은 2자 이상이어야 합니다')
    }

    // 전화번호 검증 (한국 휴대폰 번호 형식)
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/
    if (!address.phone || !phoneRegex.test(address.phone.replace(/-/g, ''))) {
      errors.push('올바른 휴대폰 번호를 입력해주세요')
    }

    // 주소 검증
    if (!address.address || address.address.trim().length < 5) {
      errors.push('주소는 5자 이상이어야 합니다')
    }

    // 우편번호 검증 (한국 우편번호 형식: 5자리)
    const postCodeRegex = /^[0-9]{5}$/
    if (!address.post_code || !postCodeRegex.test(address.post_code)) {
      errors.push('올바른 우편번호를 입력해주세요 (5자리 숫자)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 전화번호 정규화 (하이픈 추가)
   */
  static normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '')
    
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
    }
    
    return phone
  }

  /**
   * 우편번호로 주소 검색 (다음 주소 API 연동 시 사용)
   */
  static async searchAddressByPostCode(postCode: string): Promise<{
    address: string
    roadAddress: string
    jibunAddress: string
  } | null> {
    // 실제 구현 시에는 다음 주소 API 또는 기타 주소 검색 서비스 연동
    // 현재는 기본 구조만 제공
    console.log('주소 검색 기능은 다음 주소 API 연동 후 구현됩니다:', postCode)
    return null
  }
}