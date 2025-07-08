'use client'

import { useAtom } from 'jotai'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { currentUserAtom, isAuthenticatedAtom, isLoadingAuthAtom } from '@/states/auth-store'
import { db } from '@/lib/db/database-service'
import { User } from '@/lib/db/local/models'
import { ROUTES } from '@/lib/constants'

export function useAuth() {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom)
  const [isAuthenticated] = useAtom(isAuthenticatedAtom)
  const [isLoading, setIsLoading] = useAtom(isLoadingAuthAtom)
  const router = useRouter()

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const user = await db.users.findByEmail(email)
      
      if (!user) {
        throw new Error('등록되지 않은 이메일입니다')
      }
      
      // TODO: 실제 프로덕션에서는 bcrypt 등으로 비밀번호 해싱 필요
      // 현재는 개발용으로 단순 비교
      if (user.email === email) {
        setCurrentUser(user)
        router.push(ROUTES.DASHBOARD)
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

  const register = useCallback(async (userData: Omit<User, 'id'>) => {
    try {
      setIsLoading(true)
      
      const existingUser = await db.users.findByEmail(userData.email)
      if (existingUser) {
        throw new Error('이미 등록된 이메일입니다')
      }
      
      const newUser = await db.users.create({
        ...userData,
        // TODO: 실제 프로덕션에서는 비밀번호 해싱 필요
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setCurrentUser(newUser)
      router.push(ROUTES.DASHBOARD)
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