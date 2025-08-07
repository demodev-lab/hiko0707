import { auth, currentUser } from '@clerk/nextjs/server'

// User 타입 정의 (기존 코드와의 호환성을 위해)
interface User {
  id: string
  email: string
  name: string
  role: 'guest' | 'customer' | 'admin'
  createdAt: Date
  updatedAt: Date
}

// 서버 액션에서 사용할 인증 유틸리티
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()
  
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

// 인증이 필요한 서버 액션을 위한 래퍼
export async function withAuth<T>(
  handler: (user: User) => Promise<T>
): Promise<T> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('인증이 필요합니다. 로그인해주세요.')
  }
  
  return handler(user)
}

// 특정 역할이 필요한 서버 액션을 위한 래퍼
export async function withRole<T>(
  role: User['role'],
  handler: (user: User) => Promise<T>
): Promise<T> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('인증이 필요합니다. 로그인해주세요.')
  }
  
  if (user.role !== role) {
    throw new Error(`${role} 권한이 필요합니다.`)
  }
  
  return handler(user)
}

// 관리자 권한이 필요한 서버 액션을 위한 래퍼
export async function withAdmin<T>(
  handler: (user: User) => Promise<T>
): Promise<T> {
  return withRole('admin', handler)
}