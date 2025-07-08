import { BaseRepository } from './base-repository'
import { Post } from '../models/post'

export class PostRepository extends BaseRepository<Post> {
  protected tableName = 'posts'

  async findByAuthor(authorId: string): Promise<Post[]> {
    const posts = await this.findAll()
    return posts.filter(post => post.authorId === authorId)
  }

  async findByStatus(status: Post['status']): Promise<Post[]> {
    const posts = await this.findAll()
    return posts.filter(post => post.status === status)
  }

  async findByTag(tag: string): Promise<Post[]> {
    const posts = await this.findAll()
    return posts.filter(post => post.tags.includes(tag))
  }

  async search(query: string): Promise<Post[]> {
    const posts = await this.findAll()
    return posts.filter(post => 
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.content.toLowerCase().includes(query.toLowerCase())
    )
  }

  async findRecent(limit: number = 10): Promise<Post[]> {
    const posts = await this.findAll()
    return posts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }
}