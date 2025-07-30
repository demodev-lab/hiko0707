'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { syncClerkUserToSupabase } from '@/actions/auth/sync-user'

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId } = useAuth()

  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && userId) {
        try {
          const result = await syncClerkUserToSupabase()
          
          if (result.success) {
            console.log(result.isNewUser ? 'New user created in Supabase' : 'User synced with Supabase')
          } else {
            console.error('Failed to sync user:', result.error)
          }
        } catch (error) {
          console.error('Error during user sync:', error)
        }
      }
    }

    syncUser()
  }, [isSignedIn, userId])

  return <>{children}</>
}