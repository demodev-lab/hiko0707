'use client'

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

  // 클라이언트 사이드에서 로컬 스토리지에서 사용자 정보 복원 (선택적)
  useEffect(() => {
    if (typeof window !== 'undefined' && !currentUser) {
      const savedUser = localStorage.getItem('currentUser')
      // 자동 로그인 활성화 - localStorage에서 사용자 정보 복원
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          setCurrentUser(user)
        } catch (error) {
          localStorage.removeItem('currentUser')
        }
      }
    }
  }, [currentUser, setCurrentUser])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const user = await db.users.findByEmail(email)
      
      if (!user && email !== 'admin@hiko.kr') {
        throw new Error('등록되지 않은 이메일입니다')
      }
      
      // TODO: 실제 프로덕션에서는 bcrypt 등으로 비밀번호 해싱 필요
      // 현재는 개발용으로 단순 비교
      // 데모용 관리자 계정 하드코딩
      if (email === 'admin@hiko.kr' && password === 'admin123') {
        const adminUser = user || await db.users.create({
          email: 'admin@hiko.kr',
          name: '관리자',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        setCurrentUser(adminUser)
        // localStorage에 사용자 정보 저장 (자동 로그인용)
        localStorage.setItem('currentUser', JSON.stringify(adminUser))
        router.push(ROUTES.ADMIN)
        return adminUser
      }
      
      // 일반 사용자 로그인 (데모용으로 비밀번호 체크 생략)
      if (user && user.email === email) {
        setCurrentUser(user)
        // localStorage에 사용자 정보 저장 (자동 로그인용)
        localStorage.setItem('currentUser', JSON.stringify(user))
        router.push(ROUTES.HOTDEALS)  // 핫딜 페이지로 이동
        return user
      } else {
        throw new Error('비밀번호가 일치하지 않습니다')
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
      // localStorage에 사용자 정보 저장 (회원가입 후 자동 로그인)
      localStorage.setItem('currentUser', JSON.stringify(newUser))
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
    // localStorage에서 사용자 정보 제거
    localStorage.removeItem('currentUser')
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