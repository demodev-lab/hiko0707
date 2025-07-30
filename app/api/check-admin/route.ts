import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ isAdmin: false })
  }
  
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Private Metadata에서 role 확인
    const isAdmin = user.privateMetadata?.role === 'admin'
    
    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Error checking admin role:', error)
    return NextResponse.json({ isAdmin: false })
  }
}