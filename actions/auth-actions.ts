'use server'

/**
 * @deprecated 이 인증 액션들은 마이그레이션 예정입니다!
 * 
 * ⚠️ DEPRECATED: auth-actions.ts는 쿠키 기반 인증 시스템을 사용합니다.
 * 
 * 🔄 Clerk 기반 인증으로 완전 전환 예정:
 * - Clerk가 인증과 세션 관리를 처리
 * - Server Actions 대신 Clerk 훅 사용
 * 
 * 📋 현재 상태:
 * ✅ Database service → SupabaseUserService 마이그레이션 완료
 * ⏳ Clerk 기반 인증으로 전환 예정 (Phase 4 후반)
 * 
 * 새로운 인증 시스템:
 * - useClerkRole() - 인증 상태
 * - useSupabaseUser() - 사용자 데이터
 * - Clerk SignIn/SignUp 컴포넌트
 */

import { cookies } from 'next/headers'
import { SupabaseUserService } from '@/lib/services/supabase-user-service'

export async function loginAction(email: string, password: string) {
  try {
    // Admin login (hardcoded for demo)
    if (email === 'admin@hiko.kr' && password === 'admin123') {
      const adminUser = {
        id: 'admin-001',
        email: 'admin@hiko.kr',
        username: 'Admin',
        role: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      // Set cookie
      const cookieStore = await cookies()
      cookieStore.set('currentUser', JSON.stringify(adminUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })
      
      return { success: true, user: adminUser }
    }
    
    // Regular user login
    const user = await SupabaseUserService.getUserByEmail(email)
    if (!user) {
      return { success: false, error: '등록되지 않은 이메일입니다' }
    }
    
    // TODO: In production, verify password hash
    // For demo, accept any password
    
    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('currentUser', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    return { success: true, user }
  } catch (error) {
    console.error('Login failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '로그인 실패' 
    }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('currentUser')
  return { success: true }
}

export async function checkAuthAction() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('currentUser')
  
  if (!userCookie) {
    return { authenticated: false, user: null }
  }
  
  try {
    const userData = JSON.parse(userCookie.value)
    const user = await SupabaseUserService.getUser(userData.id)
    return { authenticated: !!user, user }
  } catch {
    return { authenticated: false, user: null }
  }
}