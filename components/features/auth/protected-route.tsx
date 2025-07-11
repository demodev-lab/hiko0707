'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { PageLoading } from '@/components/ui/loading'
import { ROUTES } from '@/lib/constants'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'admin'
  fallbackPath?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'user', 
  fallbackPath = ROUTES.LOGIN 
}: ProtectedRouteProps) {
  const { currentUser, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(fallbackPath)
        return
      }

      // 관리자 권한이 필요한 경우 체크
      if (requiredRole === 'admin' && currentUser?.role !== 'admin') {
        router.push(ROUTES.DASHBOARD)
        return
      }
    }
  }, [isAuthenticated, currentUser, isLoading, requiredRole, fallbackPath, router])

  if (isLoading) {
    return <PageLoading message="권한을 확인하는 중..." />
  }

  if (!isAuthenticated) {
    return <PageLoading message="로그인 페이지로 이동 중..." />
  }

  if (requiredRole === 'admin' && currentUser?.role !== 'admin') {
    return <PageLoading message="대시보드로 이동 중..." />
  }

  return <>{children}</>
}

interface PublicOnlyRouteProps {
  children: React.ReactNode
  redirectPath?: string
}

export function PublicOnlyRoute({ 
  children, 
  redirectPath = ROUTES.DASHBOARD 
}: PublicOnlyRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectPath)
    }
  }, [isAuthenticated, isLoading, redirectPath, router])

  if (isLoading) {
    return <PageLoading message="로딩 중..." />
  }

  if (isAuthenticated) {
    return <PageLoading message="대시보드로 이동 중..." />
  }

  return <>{children}</>
}