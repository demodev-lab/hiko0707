'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types/user'

interface RoleBasedContentProps {
  guest?: ReactNode
  member?: ReactNode
  admin?: ReactNode
  fallback?: ReactNode
}

export function RoleBasedContent({
  guest,
  member,
  admin,
  fallback
}: RoleBasedContentProps) {
  const { currentUser, isAuthenticated } = useAuth()
  
  // 비로그인 상태 (Guest)
  if (!isAuthenticated || !currentUser) {
    return <>{guest || fallback}</>
  }
  
  // 로그인 상태 - 역할별 콘텐츠 표시
  switch (currentUser.role) {
    case 'admin':
      return <>{admin || member || fallback}</>
    case 'member':
      return <>{member || fallback}</>
    default:
      return <>{fallback}</>
  }
}

// 특정 역할에게만 보이는 컴포넌트
interface ShowForRoleProps {
  children: ReactNode
  roles: UserRole[]
  includeHigherRoles?: boolean
}

export function ShowForRole({ 
  children, 
  roles,
  includeHigherRoles = true 
}: ShowForRoleProps) {
  const { currentUser, isAuthenticated } = useAuth()
  
  if (!isAuthenticated || !currentUser) {
    // guest를 허용하는 경우
    if (roles.includes('guest' as UserRole)) {
      return <>{children}</>
    }
    return null
  }
  
  // 현재 사용자의 역할이 허용된 역할에 포함되는지 확인
  const userRole = currentUser.role || 'guest'
  let hasPermission = roles.includes(userRole)
  
  // includeHigherRoles가 true이고 admin인 경우 모든 권한 허용
  if (includeHigherRoles && userRole === 'admin' && !roles.includes('admin')) {
    hasPermission = true
  }
  
  return hasPermission ? <>{children}</> : null
}

// 특정 역할을 제외하고 보이는 컴포넌트
interface HideForRoleProps {
  children: ReactNode
  roles: UserRole[]
}

export function HideForRole({ children, roles }: HideForRoleProps) {
  const { currentUser, isAuthenticated } = useAuth()
  
  // 비로그인 상태
  if (!isAuthenticated || !currentUser) {
    // guest를 숨기려는 경우
    if (roles.includes('guest' as UserRole)) {
      return null
    }
    return <>{children}</>
  }
  
  // 현재 사용자의 역할이 숨겨야 할 역할에 포함되는지 확인
  const userRole = currentUser.role || 'guest'
  const shouldHide = roles.includes(userRole)
  
  return shouldHide ? null : <>{children}</>
}