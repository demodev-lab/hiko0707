import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ isAdmin: false })
  }
  
  try {
    const supabase = createServerClient()
    
    // Supabase users 테이블에서 role 확인
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', userId)
      .single()
    
    if (error) {
      console.error('Error checking admin role:', error)
      return NextResponse.json({ isAdmin: false })
    }
    
    const isAdmin = user?.role === 'admin'
    
    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Error checking admin role:', error)
    return NextResponse.json({ isAdmin: false })
  }
}