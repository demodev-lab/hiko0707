'use client'

import { ReactNode } from 'react'
import { useClerkRole } from '@/hooks/use-clerk-role'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { UserRole } from '@/types/user'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
  showMessage?: boolean
  redirectTo?: string
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback,
  showMessage = true,
  redirectTo = '/login'
}: RoleGuardProps) {
  const { isAuthenticated, isAdmin } = useClerkRole()
  const { user: currentUser } = useSupabaseUser()
  
  // 비로그인 상태
  if (!isAuthenticated || !currentUser) {
    if (fallback) return <>{fallback}</>
    
    if (!showMessage) return null
    
    return (
      <Alert className="max-w-md mx-auto mt-8">
        <Lock className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p>이 콘텐츠를 보려면 로그인이 필요합니다.</p>
          <Link href={redirectTo}>
            <Button size="sm" className="mt-2">
              로그인하기
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }
  
  // 권한 확인
  const userRole = isAdmin ? 'admin' : (currentUser.role || 'guest')
  const hasPermission = allowedRoles.includes(userRole)
  
  if (!hasPermission) {
    if (fallback) return <>{fallback}</>
    
    if (!showMessage) return null
    
    return (
      <Alert className="max-w-md mx-auto mt-8" variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          이 페이지에 접근할 권한이 없습니다.
        </AlertDescription>
      </Alert>
    )
  }
  
  return <>{children}</>
}