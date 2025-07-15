import { storage } from '@/lib/db/storage'

export abstract class BaseRepository<T extends { id: string }> {
  protected abstract tableName: string

  async findAll(): Promise<T[]> {
    const data = storage.get<T[]>(this.tableName)
    return data || []
  }

  async findById(id: string): Promise<T | null> {
    const items = await this.findAll()
    return items.find(item => item.id === id) || null
  }

  async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    const items = await this.findAll()
    return items.find(predicate) || null
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.findAll()
    return items.filter(predicate)
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const items = await this.findAll()
    const newItem = {
      ...data,
      id: this.generateId()
    } as T

    storage.set(this.tableName, [...items, newItem])
    return newItem
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const items = await this.findAll()
    const index = items.findIndex(item => item.id === id)
    
    if (index === -1) return null

    const updatedItem = {
      ...items[index],
      ...data,
      id // Ensure ID is not overwritten
    }

    const newItems = [...items]
    newItems[index] = updatedItem
    storage.set(this.tableName, newItems)
    
    return updatedItem
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.findAll()
    const filteredItems = items.filter(item => item.id !== id)
    
    if (items.length === filteredItems.length) return false
    
    storage.set(this.tableName, filteredItems)
    return true
  }

  async deleteAll(): Promise<number> {
    const items = await this.findAll()
    const count = items.length
    storage.set(this.tableName, [])
    return count
  }

  protected generateId(): string {
    return `${this.tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}