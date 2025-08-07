import { supabase as getSupabaseClient } from '@/lib/supabase/client'
import type { UserRow, UserUpdate, UserProfileRow } from '@/lib/types/supabase'

export class SupabaseUserService {
  /**
   * 사용자 정보 조회
   */
  static async getUser(userId: string): Promise<UserRow | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.error('사용자 조회 실패:', error)
      return null
    }

    return data
  }

  /**
   * Clerk ID로 사용자 조회
   */
  static async getUserByClerkId(clerkUserId: string): Promise<UserRow | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error || !data) {
      console.error('사용자 조회 실패:', error)
      return null
    }

    return data
  }

  /**
   * 이메일로 사용자 조회
   */
  static async getUserByEmail(email: string): Promise<UserRow | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      console.error('이메일로 사용자 조회 실패:', error)
      return null
    }

    return data
  }

  /**
   * 사용자 정보 업데이트
   */
  static async updateUser(userId: string, updates: Partial<UserUpdate>): Promise<UserRow | null> {
    const supabase = getSupabaseClient()
    
    // 업데이트 데이터 준비
    const updateData: UserUpdate = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // undefined 값 제거
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UserUpdate] === undefined) {
        delete updateData[key as keyof UserUpdate]
      }
    })

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error || !data) {
      console.error('사용자 업데이트 실패:', error)
      return null
    }

    return data
  }

  /**
   * 사용자 언어 설정 업데이트
   */
  static async updateLanguage(userId: string, language: string): Promise<boolean> {
    const result = await this.updateUser(userId, { preferred_language: language })
    return result !== null
  }

  /**
   * 사용자 전화번호 업데이트
   */
  static async updatePhone(userId: string, phone: string | undefined): Promise<boolean> {
    const result = await this.updateUser(userId, { phone })
    return result !== null
  }

  /**
   * @deprecated user_profiles 테이블이 존재하지 않음 - 사용 금지
   * 대신 users 테이블의 avatar_url 필드를 직접 업데이트하세요
   */
  static async updateAvatar(userId: string, avatarUrl: string): Promise<boolean> {
    const supabase = getSupabaseClient()
    
    // ⚠️ user_profiles 테이블이 존재하지 않으므로 항상 false 반환
    console.warn('updateAvatar: user_profiles 테이블이 존재하지 않습니다. users 테이블을 직접 업데이트하세요.')
    return false
  }

  /**
   * @deprecated user_profiles 테이블이 존재하지 않음 - 사용 금지
   * 프로필 정보는 users 테이블에서 직접 조회하세요
   */
  static async getUserProfile(userId: string): Promise<UserProfileRow | null> {
    const supabase = getSupabaseClient()
    // ⚠️ user_profiles 테이블이 존재하지 않으므로 항상 null 반환
    console.warn('getUserProfile: user_profiles 테이블이 존재하지 않습니다. users 테이블을 직접 조회하세요.')
    return null
  }

  /**
   * 모든 사용자 조회 (관리자용) - 최적화된 버전
   */
  static async getAllUsers(options?: {
    limit?: number
    offset?: number
    status?: string
    role?: string
  }): Promise<UserRow[]> {
    const supabase = getSupabaseClient()
    
    // 기본값 설정으로 성능 최적화
    const { 
      limit = 5000, // 기본 5000명으로 제한
      offset = 0,
      status,
      role 
    } = options || {}

    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // 상태 필터
    if (status) {
      query = query.eq('status', status)
    }

    // 역할 필터
    if (role) {
      query = query.eq('role', role)
    }

    // 오프셋 적용
    if (offset > 0) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('전체 사용자 조회 실패:', error)
      return []
    }

    return data || []
  }
}