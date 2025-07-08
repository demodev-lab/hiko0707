import { BaseRepository } from './base-repository'
import { User } from '../models/user'

export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users'

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findAll()
    return users.find(user => user.email === email) || null
  }

  async findByName(name: string): Promise<User[]> {
    const users = await this.findAll()
    return users.filter(user => 
      user.name.toLowerCase().includes(name.toLowerCase())
    )
  }
}