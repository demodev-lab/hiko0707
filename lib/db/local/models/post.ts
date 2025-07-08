export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
}