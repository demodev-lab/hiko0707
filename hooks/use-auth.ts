'use client'

/**
 * @deprecated 이 훅은 더 이상 사용하지 마세요!
 * 
 * ⚠️ DEPRECATED: use-auth.ts는 LocalStorage 기반 인증 시스템을 사용합니다.
 * 
 * 🔄 대신 사용할 훅들:
 * - useClerkRole() - 인증 상태 및 역할 확인
 * - useSupabaseUser() - 사용자 정보 및 프로필 관리
 * - useClerk().signOut() - 로그아웃
 * 
 * 📋 마이그레이션 가이드:
 * 기존: const { currentUser, isAuthenticated, login, logout } = useAuth()
 * 신규: 
 *   const { isAuthenticated, isAdmin } = useClerkRole()
 *   const { user: currentUser } = useSupabaseUser()
 *   const { signOut } = useClerk()
 * 
 * 이 파일은 Phase 4에서 완전히 제거될 예정입니다.
 */

import { useAtom } from 'jotai'
import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { currentUserAtom, setCurrentUserAtom, isAuthenticatedAtom, isLoadingAuthAtom } from '@/states/auth-store'
import { ROUTES } from '@/lib/constants'

// Temporary User type definition (after LocalStorage removal)
interface User {
  id: string
  email: string
  name: string
  role?: 'guest' | 'member' | 'admin'
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export function useAuth() {
  const [currentUser] = useAtom(currentUserAtom)
  const [, setCurrentUser] = useAtom(setCurrentUserAtom)
  const [isAuthenticated] = useAtom(isAuthenticatedAtom)
  const [isLoading, setIsLoading] = useAtom(isLoadingAuthAtom)
  const router = useRouter()

  // 클라이언트 사이드에서 로컬 스토리지에서 사용자 정보 복원
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          setCurrentUser(user)
          console.log('저장된 사용자 정보로 자동 로그인:', user.email)
        } catch (error) {
          console.error('저장된 사용자 정보 파싱 오류:', error)
          localStorage.removeItem('currentUser')
        }
      }
      // 로딩 완료 - 항상 false로 설정
      setIsLoading(false)
    }
  }, [setCurrentUser, setIsLoading]) // 필요한 의존성 추가

  const login = useCallback(async (email: string, password: string) => {
    console.log('로그인 시도:', email)
    try {
      setIsLoading(true)
      
      // Deprecated - LocalStorage authentication removed
      console.warn('useAuth.login is deprecated. Use Clerk authentication instead.')
      
      // Demo account simulation for backwards compatibility
      if (email === 'admin@hiko.kr' && password === 'admin123') {
        console.log('Demo admin login - this is deprecated')
        const adminUser: User = {
          id: 'demo-admin',
          email: 'admin@hiko.kr',
          name: '관리자',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setCurrentUser(adminUser)
        
        // Legacy localStorage save (will be removed)
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(adminUser))
        }
        
        router.push(ROUTES.ADMIN)
        return adminUser
      }
      
      // All other logins fail with deprecation warning
      console.warn('LocalStorage authentication is deprecated. Please use Clerk authentication.')
      throw new Error('LocalStorage authentication is no longer supported. Please use Clerk.')
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [setCurrentUser, setIsLoading, router])

  const register = useCallback(async (userData: Omit<User, 'id'> & { password: string }) => {
    try {
      setIsLoading(true)
      
      // Deprecated - LocalStorage registration removed
      console.warn('useAuth.register is deprecated. Use Clerk authentication instead.')
      throw new Error('LocalStorage registration is no longer supported. Please use Clerk.')
      
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [setCurrentUser, setIsLoading, router])

  const logout = useCallback(() => {
    setCurrentUser(null)
    // localStorage 정리도 확실히 하기
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser')
    }
    router.push(ROUTES.HOME)
  }, [setCurrentUser, router])

  const updateProfile = useCallback(async (userData: Partial<User>) => {
    if (!currentUser) {
      throw new Error('No user logged in')
    }
    
    try {
      setIsLoading(true)
      // Deprecated - LocalStorage profile update removed
      console.warn('useAuth.updateProfile is deprecated. Use useSupabaseUser instead.')
      throw new Error('LocalStorage profile update is no longer supported. Please use Supabase.')
    } catch (error) {
      console.error('Profile update failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, setCurrentUser, setIsLoading])

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  }
}