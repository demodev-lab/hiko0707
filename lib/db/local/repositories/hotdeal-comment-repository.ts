import { BaseRepository } from './base-repository'
import { storage } from '@/lib/db/storage'

export interface HotDealComment {
  id: string
  hotdealId: string
  userId: string
  content: string
  parentId?: string // For nested comments
  likeCount: number
  likedByUsers?: string[] // Array of user IDs who liked this comment
  createdAt: Date
  updatedAt: Date
  isDeleted?: boolean
  deletedAt?: Date
  user?: {
    id: string
    name: string
    image?: string
  }
}

export class HotDealCommentRepository extends BaseRepository<HotDealComment> {
  protected tableName = 'hotdeal_comments'

  async findByHotDealId(hotdealId: string): Promise<HotDealComment[]> {
    const comments = await this.findAll()
    return comments
      .filter(comment => comment.hotdealId === hotdealId && !comment.isDeleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async findByUserId(userId: string): Promise<HotDealComment[]> {
    const comments = await this.findAll()
    return comments
      .filter(comment => comment.userId === userId && !comment.isDeleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async findWithUser(commentId: string): Promise<HotDealComment | null> {
    const comment = await this.findById(commentId)
    if (!comment || comment.isDeleted) return null
    
    // In a real app, we'd join with users table
    // For now, we'll return the comment with minimal user info
    return {
      ...comment,
      user: {
        id: comment.userId,
        name: 'User ' + comment.userId.slice(0, 6),
        image: undefined
      }
    }
  }

  async findAllWithUsers(hotdealId: string): Promise<HotDealComment[]> {
    const comments = await this.findByHotDealId(hotdealId)
    
    // Add user info to each comment
    return comments.map(comment => ({
      ...comment,
      user: {
        id: comment.userId,
        name: 'User ' + comment.userId.slice(0, 6),
        image: undefined
      }
    }))
  }

  async createComment(data: {
    hotdealId: string
    userId: string
    content: string
    parentId?: string
  }): Promise<HotDealComment> {
    const now = new Date()
    const comment: Omit<HotDealComment, 'id'> = {
      ...data,
      likeCount: 0,
      likedByUsers: [],
      createdAt: now,
      updatedAt: now,
      isDeleted: false
    }
    
    const created = await this.create(comment)
    
    // Update hotdeal comment count
    const hotdeals = (storage.get<any[]>('hotdeals')) || []
    const hotdealIndex = hotdeals.findIndex((d: any) => d.id === data.hotdealId)
    if (hotdealIndex !== -1) {
      hotdeals[hotdealIndex].commentCount = (hotdeals[hotdealIndex].commentCount || 0) + 1
      storage.set('hotdeals', hotdeals)
    }
    
    return created
  }

  async updateComment(id: string, content: string): Promise<HotDealComment | null> {
    const comment = await this.findById(id)
    if (!comment || comment.isDeleted) return null
    
    const updated = await this.update(id, {
      content,
      updatedAt: new Date()
    })
    
    return updated
  }

  async deleteComment(id: string): Promise<boolean> {
    const comment = await this.findById(id)
    if (!comment || comment.isDeleted) return false
    
    // Soft delete
    await this.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
      content: '[삭제된 댓글입니다]'
    })
    
    // Update hotdeal comment count
    const hotdeals = (storage.get<any[]>('hotdeals')) || []
    const hotdealIndex = hotdeals.findIndex((d: any) => d.id === comment.hotdealId)
    if (hotdealIndex !== -1) {
      hotdeals[hotdealIndex].commentCount = Math.max(0, (hotdeals[hotdealIndex].commentCount || 1) - 1)
      storage.set('hotdeals', hotdeals)
    }
    
    return true
  }

  async likeComment(id: string, userId: string): Promise<HotDealComment | null> {
    const comment = await this.findById(id)
    if (!comment || comment.isDeleted) return null
    
    const likedByUsers = comment.likedByUsers || []
    if (likedByUsers.includes(userId)) {
      // Already liked
      return comment
    }
    
    return await this.update(id, {
      likeCount: comment.likeCount + 1,
      likedByUsers: [...likedByUsers, userId]
    })
  }

  async unlikeComment(id: string, userId: string): Promise<HotDealComment | null> {
    const comment = await this.findById(id)
    if (!comment || comment.isDeleted) return null
    
    const likedByUsers = comment.likedByUsers || []
    if (!likedByUsers.includes(userId)) {
      // Not liked
      return comment
    }
    
    return await this.update(id, {
      likeCount: Math.max(0, comment.likeCount - 1),
      likedByUsers: likedByUsers.filter(uid => uid !== userId)
    })
  }

  async countByHotDeal(hotdealId: string): Promise<number> {
    const comments = await this.findByHotDealId(hotdealId)
    return comments.length
  }

  async getNestedComments(hotdealId: string): Promise<(HotDealComment & { replies?: HotDealComment[] })[]> {
    const allComments = await this.findAllWithUsers(hotdealId)
    
    // Organize comments into a tree structure
    const commentMap = new Map<string, HotDealComment & { replies?: HotDealComment[] }>()
    const rootComments: (HotDealComment & { replies?: HotDealComment[] })[] = []
    
    // First pass: create map
    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })
    
    // Second pass: build tree
    allComments.forEach(comment => {
      const mappedComment = commentMap.get(comment.id)!
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          parent.replies = parent.replies || []
          parent.replies.push(mappedComment)
        }
      } else {
        rootComments.push(mappedComment)
      }
    })
    
    return rootComments
  }
}