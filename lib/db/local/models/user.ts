export interface User {
  id: string
  email: string
  name: string
  role?: 'customer' | 'admin'
  avatar?: string
  phone?: string
  address?: string
  preferredLanguage?: string
  likedHotdeals?: string[]
  createdAt: Date
  updatedAt: Date
}