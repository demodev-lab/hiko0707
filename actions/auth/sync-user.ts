'use server'

import { createServerClient } from '@/lib/supabase/server'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function syncClerkUserToSupabase() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'No authenticated user' }
    }

    const user = await currentUser()
    
    if (!user) {
      return { success: false, error: 'Failed to fetch user details' }
    }

    const supabase = createServerClient()
    
    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Error other than "no rows"
      console.error('Error fetching user:', fetchError)
      return { success: false, error: 'Failed to check existing user' }
    }

    if (existingUser) {
      // Get role from Clerk privateMetadata
      const clerkRole = (user.privateMetadata?.role as string) || 'customer'
      
      // Check if role needs to be synced
      const needsRoleUpdate = existingUser.role !== clerkRole
      
      // Update last login time and sync role if needed
      const updateData: any = {
        last_logined_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      if (needsRoleUpdate) {
        updateData.role = clerkRole
        console.log(`Syncing role from Clerk (${clerkRole}) to Supabase for user ${user.id}`)
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('clerk_user_id', user.id)

      if (updateError) {
        console.error('Error updating user:', updateError)
        return { success: false, error: 'Failed to update user' }
      }

      return { success: true, isNewUser: false, roleUpdated: needsRoleUpdate }
    }

    // Create new user
    // Get role from Clerk privateMetadata or use default
    const clerkRole = (user.privateMetadata?.role as string) || 'customer'
    
    const userData = {
      clerk_user_id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown',
      phone: user.phoneNumbers[0]?.phoneNumber || null,
      preferred_language: 'ko', // Default language
      role: clerkRole, // Use role from Clerk metadata
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_logined_at: new Date().toISOString()
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      console.error('User data attempted:', userData)
      return { success: false, error: `Failed to create user: ${insertError.message}` }
    }

    return { success: true, isNewUser: true }
  } catch (error) {
    console.error('Error syncing user to Supabase:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}