'use server'

import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/database.types'

export type User = Tables<'users'>

export async function getUsers() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    throw new Error('유저 목록을 불러오는데 실패했습니다.')
  }

  return users
}

export async function getUserById(userId: string) {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    throw new Error('유저 정보를 불러오는데 실패했습니다.')
  }

  return user
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    throw new Error('유저 권한 변경에 실패했습니다.')
  }
}

export async function updateUserStatus(userId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user status:', error)
    throw new Error('유저 상태 변경에 실패했습니다.')
  }
}