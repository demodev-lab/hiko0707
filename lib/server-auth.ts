import { cookies } from 'next/headers'
import { db } from '@/lib/db/database-service'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('currentUser')
  
  if (!userCookie) {
    return null
  }
  
  try {
    const userData = JSON.parse(userCookie.value)
    // Verify user still exists in database
    const user = await db.users.findOne(u => u.id === userData.id)
    return user
  } catch (error) {
    return null
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'admin') {
    throw new Error('권한이 없습니다. 관리자로 로그인해주세요.')
  }
  
  return user
}