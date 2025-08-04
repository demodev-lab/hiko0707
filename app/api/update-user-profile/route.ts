import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, preferred_language } = body

    const supabase = createServerClient()
    
    // Update user data in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .update({
        name: name || undefined,
        phone: phone || undefined,
        preferred_language: preferred_language || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error in update-user-profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}