import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }
  
  const user = await currentUser()
  
  if (!user) {
    return null
  }
  
  // Clerk 사용자 정보를 기존 형식으로 변환
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || '',
    role: (user.publicMetadata?.role as string) || 'customer',
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt)
  }
}

export async function requireAdmin() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await currentUser()
  const role = user?.publicMetadata?.role as string | undefined
  
  if (role !== 'admin') {
    throw new Error('권한이 없습니다. 관리자로 로그인해주세요.')
  }
  
  return await getCurrentUser()
}