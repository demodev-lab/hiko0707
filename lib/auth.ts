import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server'
import { User } from '@/types/user'

export async function getCurrentUser(): Promise<User | null> {
  // Clerk 인증 확인
  const { userId } = await clerkAuth()
  
  if (!userId) {
    return null
  }
  
  const user = await currentUser()
  
  if (!user) {
    return null
  }
  
  // Clerk 사용자 정보를 기존 User 타입으로 변환
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || '',
    role: (user.publicMetadata?.role as User['role']) || 'customer',
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt)
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('인증이 필요합니다. 로그인해주세요.')
  }
  
  return user
}

export function checkRole(user: User | null, requiredRoles: string[]): boolean {
  if (!user) return false
  const userRole = user.role || 'guest'
  return requiredRoles.includes(userRole)
}

// Clerk auth 함수 래퍼 - 기존 코드와의 호환성을 위해 유지
export async function auth(): Promise<{ user?: { id: string; email: string; role: string } } | null> {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role || 'guest'
    }
  }
}