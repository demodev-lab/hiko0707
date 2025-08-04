'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'

// Cache for admin status to prevent repeated API calls
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Global promise to prevent concurrent API calls
let checkingPromise: Promise<boolean> | null = null

export function useClerkRole() {
  const { userId, isSignedIn } = useAuth()
  
  // Initialize from cache if available
  const getCachedValue = () => {
    if (!userId) return false
    const cached = adminCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.isAdmin
    }
    return false
  }
  
  const [isAdmin, setIsAdmin] = useState(getCachedValue)
  const [isLoading, setIsLoading] = useState(true) // 항상 로딩으로 시작하여 깜빡임 방지
  const isMountedRef = useRef(true)
  const lastUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    
    // 초기 캐시 확인
    if (userId) {
      const cached = adminCache.get(userId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setIsAdmin(cached.isAdmin)
        setIsLoading(false)
        lastUserIdRef.current = userId
        return
      }
    }
    
    const checkAdminRole = async () => {
      if (!isSignedIn || !userId) {
        if (isMountedRef.current) {
          setIsAdmin(false)
          setIsLoading(false)
        }
        return
      }

      // Skip if userId hasn't changed
      if (lastUserIdRef.current === userId) {
        return
      }

      // Check cache first
      const cached = adminCache.get(userId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        if (isMountedRef.current) {
          setIsAdmin(cached.isAdmin)
          setIsLoading(false)
          lastUserIdRef.current = userId
        }
        return
      }
      
      // 캐시가 없으면 기본값 member로 설정하여 깜빡임 방지
      if (isMountedRef.current) {
        setIsAdmin(false) // 대부분의 사용자는 member이므로 false로 설정
      }

      // If already checking, wait for the existing promise
      if (checkingPromise) {
        try {
          const adminStatus = await checkingPromise
          if (isMountedRef.current) {
            setIsAdmin(adminStatus)
            setIsLoading(false)
            lastUserIdRef.current = userId
          }
        } catch (error) {
          console.error('Error in shared admin check:', error)
          if (isMountedRef.current) {
            setIsAdmin(false)
            setIsLoading(false)
          }
        }
        return
      }

      // Create a new checking promise
      checkingPromise = (async () => {
        try {
          console.log('[useClerkRole] Fetching admin status for user:', userId)
          const response = await fetch('/api/check-admin')
          if (response.ok) {
            const data = await response.json()
            const adminStatus = data.isAdmin || false
            
            // Cache the result
            adminCache.set(userId, { isAdmin: adminStatus, timestamp: Date.now() })
            
            return adminStatus
          } else {
            return false
          }
        } catch (error) {
          console.error('Error checking admin role:', error)
          return false
        } finally {
          checkingPromise = null
        }
      })()

      try {
        const adminStatus = await checkingPromise
        if (isMountedRef.current) {
          setIsAdmin(adminStatus)
          setIsLoading(false)
          lastUserIdRef.current = userId
        }
      } catch (error) {
        if (isMountedRef.current) {
          setIsAdmin(false)
          setIsLoading(false)
        }
      }
    }

    checkAdminRole()
    
    return () => {
      isMountedRef.current = false
    }
  }, [userId, isSignedIn])

  return {
    isAdmin,
    isLoading,
    isAuthenticated: isSignedIn
  }
}