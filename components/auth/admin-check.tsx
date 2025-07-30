'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { Loading } from '@/components/ui/loading'

interface AdminCheckProps {
  children: React.ReactNode
  fallbackUrl?: string
}

/**
 * 클라이언트 사이드 관리자 권한 체크 컴포넌트
 * 서버 컴포넌트에서는 isAdmin() 유틸리티 사용을 권장
 */
export function AdminCheck({ children, fallbackUrl = '/sign-in' }: AdminCheckProps) {
  const { isLoaded, userId } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdminRole() {
      if (!isLoaded) return
      
      if (!userId) {
        redirect(fallbackUrl)
        return
      }

      try {
        // API 라우트를 통해 Private Metadata 확인
        const response = await fetch('/api/check-admin')
        const data = await response.json()
        
        if (data.isAdmin) {
          setIsAdmin(true)
        } else {
          redirect(fallbackUrl)
        }
      } catch (error) {
        console.error('Failed to check admin role:', error)
        redirect(fallbackUrl)
      } finally {
        setChecking(false)
      }
    }

    checkAdminRole()
  }, [isLoaded, userId, fallbackUrl])

  if (!isLoaded || checking || isAdmin === null) {
    return <Loading />
  }

  return <>{children}</>
}