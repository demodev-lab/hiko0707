export type UserRole = 'guest' | 'member' | 'admin'

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