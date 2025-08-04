import { supabase as getSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/database.types'

type UserRow = Database['public']['Tables']['users']['Row']
type UserUpdate = Database['public']['Tables']['users']['Update']

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
   * 사용자 프로필 사진 업데이트 (user_profiles 테이블 사용)
   */
  static async updateAvatar(userId: string, avatarUrl: string): Promise<boolean> {
    const supabase = getSupabaseClient()
    
    // user_profiles 테이블에 레코드가 있는지 확인
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('아바타 업데이트 실패:', error)
        return false
      }
    } else {
      // 생성
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          avatar_url: avatarUrl,
          date_of_birth: '', // 필수 필드이므로 빈 문자열로 설정
          gender: '' // 필수 필드이므로 빈 문자열로 설정
        })

      if (error) {
        console.error('아바타 생성 실패:', error)
        return false
      }
    }

    return true
  }

  /**
   * 사용자 추가 프로필 정보 조회 (user_profiles 테이블)
   */
  static async getUserProfile(userId: string): Promise<Database['public']['Tables']['user_profiles']['Row'] | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows
      console.error('프로필 조회 실패:', error)
      return null
    }

    return data
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