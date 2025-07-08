export interface Comment {
  id: string
  content: string
  postId: string
  authorId: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
}