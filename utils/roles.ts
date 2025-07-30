import { auth, clerkClient } from '@clerk/nextjs/server'
import { AdminRole } from '@/types/clerk'

/**
 * 서버 사이드에서 사용자의 Private Metadata 역할을 확인
 * Private Metadata는 서버에서만 접근 가능하므로 보안상 안전
 */
export const checkRole = async (role: AdminRole): Promise<boolean> => {
  const { userId } = await auth()
  
  if (!userId) return false
  
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Private Metadata에서 role 확인
    return user.privateMetadata?.role === role
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

/**
 * 관리자 권한이 있는지 확인
 */
export const isAdmin = async (): Promise<boolean> => {
  return checkRole('admin')
}

/**
 * 관리자 권한 요구 (권한이 없으면 에러 발생)
 */
export const requireAdmin = async (): Promise<void> => {
  const hasAdminRole = await isAdmin()
  
  if (!hasAdminRole) {
    throw new Error('Unauthorized: Admin access required')
  }
}

/**
 * 현재 사용자의 Private Metadata 가져오기
 */
export const getUserPrivateMetadata = async () => {
  const { userId } = await auth()
  
  if (!userId) return null
  
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return user.privateMetadata
  } catch (error) {
    console.error('Error getting user private metadata:', error)
    return null
  }
}