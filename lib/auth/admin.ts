import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  
  // Clerk의 publicMetadata에서 role 확인
  const role = user?.publicMetadata?.role as string | undefined
  
  if (role !== 'admin') {
    redirect('/')
  }
  
  return { userId, user }
}

export async function isAdmin() {
  const { userId } = await auth()
  
  if (!userId) {
    return false
  }

  const user = await currentUser()
  const role = user?.publicMetadata?.role as string | undefined
  
  return role === 'admin'
}