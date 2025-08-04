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
import { db } from '@/lib/db/database-service'
import { User } from '@/lib/db/local/models'
import { ROUTES } from '@/lib/constants'

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
      
      // 데모용 계정 체크 (하드코딩)
      if (email === 'admin@hiko.kr' && password === 'admin123') {
        console.log('관리자 계정 로그인 시도')
        
        // 관리자 계정 찾기 또는 생성
        let adminUser = await db.users.findByEmail(email)
        if (!adminUser) {
          console.log('관리자 계정 생성')
          adminUser = await db.users.create({
            email: 'admin@hiko.kr',
            name: '관리자',
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
        setCurrentUser(adminUser)
        
        // 로그인한 사용자 정보를 localStorage에 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(adminUser))
        }
        
        router.push(ROUTES.ADMIN)
        return adminUser
      }
      
      // 일반 사용자 로그인
      const user = await db.users.findByEmail(email)
      if (user) {
        setCurrentUser(user)
        
        // 로그인한 사용자 정보를 localStorage에 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(user))
        }
        
        router.push(ROUTES.HOTDEALS)  // 핫딜 페이지로 이동
        return user
      } else {
        throw new Error('이메일 또는 비밀번호가 일치하지 않습니다')
      }
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
      
      const existingUser = await db.users.findByEmail(userData.email)
      if (existingUser) {
        throw new Error('이미 등록된 이메일입니다')
      }
      
      const { password, ...userDataWithoutPassword } = userData
      const newUser = await db.users.create({
        ...userDataWithoutPassword,
        // TODO: 실제 프로덕션에서는 비밀번호 해싱 필요
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setCurrentUser(newUser)
      router.push(ROUTES.HOTDEALS)  // 핫딜 페이지로 이동
      return newUser
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
      const updatedUser = await db.users.update(currentUser.id, userData)
      if (updatedUser) {
        setCurrentUser(updatedUser)
      }
      return updatedUser
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