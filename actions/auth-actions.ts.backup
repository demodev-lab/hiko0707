'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db/database-service'

export async function loginAction(email: string, password: string) {
  try {
    // Admin login (hardcoded for demo)
    if (email === 'admin@hiko.kr' && password === 'admin123') {
      const adminUser = {
        id: 'admin-001',
        email: 'admin@hiko.kr',
        username: 'Admin',
        role: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      // Set cookie
      const cookieStore = await cookies()
      cookieStore.set('currentUser', JSON.stringify(adminUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })
      
      return { success: true, user: adminUser }
    }
    
    // Regular user login
    const user = await db.users.findByEmail(email)
    if (!user) {
      return { success: false, error: '등록되지 않은 이메일입니다' }
    }
    
    // TODO: In production, verify password hash
    // For demo, accept any password
    
    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('currentUser', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    return { success: true, user }
  } catch (error) {
    console.error('Login failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '로그인 실패' 
    }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('currentUser')
  return { success: true }
}

export async function checkAuthAction() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('currentUser')
  
  if (!userCookie) {
    return { authenticated: false, user: null }
  }
  
  try {
    const userData = JSON.parse(userCookie.value)
    const user = await db.users.findOne(u => u.id === userData.id)
    return { authenticated: !!user, user }
  } catch {
    return { authenticated: false, user: null }
  }
}