// User 관련 타입 정의 (LocalStorage 의존성 제거)
export type UserRole = 'guest' | 'customer' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role?: UserRole
  avatar?: string
  phone?: string
  address?: string
  preferredLanguage?: string
  likedHotdeals?: string[]
  createdAt: Date
  updatedAt: Date
}

// Supabase 관련 타입 정의 (snake_case 필드명 사용)
export interface UserProfile {
  id: string
  user_id: string
  display_name?: string
  phone_number?: string
  avatar_url?: string
  language: string
  notification_enabled: boolean
  notification_types: string[]
  created_at: string
  updated_at?: string
}

export interface UserAddress {
  id: string
  user_id: string
  name: string
  phone: string
  post_code: string
  address: string
  address_detail?: string
  is_default: boolean
  created_at: string
  updated_at?: string
}