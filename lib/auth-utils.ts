import { db } from '@/lib/db/database-service'
import { User } from '@/lib/db/local/models'

// 서버 액션에서 사용할 인증 유틸리티
export async function getCurrentUser(): Promise<User | null> {
  // 실제 프로덕션에서는 세션/JWT 토큰 등을 확인해야 함
  // 개발 환경에서는 localStorage에서 currentUser 확인
  if (typeof window !== 'undefined') {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        // DB에서 최신 정보 확인
        const dbUser = await db.users.findByEmail(user.email)
        return dbUser
      } catch (error) {
        return null
      }
    }
  }
  
  // 서버 사이드에서는 임시로 admin 계정 반환 (개발용)
  // TODO: 실제 프로덕션에서는 세션/쿠키 기반 인증 구현 필요
  if (process.env.NODE_ENV === 'development') {
    return await db.users.findByEmail('admin@hiko.kr')
  }
  
  return null
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