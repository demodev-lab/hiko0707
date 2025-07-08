import { BaseRepository } from './base-repository'
import { Comment } from '../models/comment'

export class CommentRepository extends BaseRepository<Comment> {
  protected tableName = 'comments'

  async findByPost(postId: string): Promise<Comment[]> {
    const comments = await this.findAll()
    return comments.filter(comment => comment.postId === postId)
  }

  async findByAuthor(authorId: string): Promise<Comment[]> {
    const comments = await this.findAll()
    return comments.filter(comment => comment.authorId === authorId)
  }

  async findReplies(parentId: string): Promise<Comment[]> {
    const comments = await this.findAll()
    return comments.filter(comment => comment.parentId === parentId)
  }
}