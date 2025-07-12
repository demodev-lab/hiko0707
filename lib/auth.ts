import { db } from '@/lib/db/database-service'
import { User } from '@/types/user'

export async function getCurrentUser(): Promise<User | null> {
  // In a real app, this would get the user from the session/cookie
  // For now, we'll return the first admin user as a mock
  try {
    const users = await db.users.findAll()
    const adminUser = users.find(u => u.role === 'admin')
    return adminUser || null
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized: No user found')
  }
  
  return user
}

export function checkRole(user: User | null, requiredRoles: string[]): boolean {
  if (!user) return false
  const userRole = user.role || 'guest'
  return requiredRoles.includes(userRole)
}

// 더미 auth 함수 - 실제 구현 필요
export async function auth(): Promise<{ user?: { id: string; email: string; role: string } } | null> {
  // TODO: 실제 인증 로직 구현
  // 임시로 관리자 세션 반환 (테스트용)
  if (typeof window === 'undefined') {
    return {
      user: {
        id: 'admin',
        email: 'admin@hiko.kr',
        role: 'admin'
      }
    }
  }
  return null
}