export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  phone?: string
  address?: string
  preferredLanguage?: string
  likedHotdeals?: string[]
  createdAt: Date
  updatedAt: Date
}