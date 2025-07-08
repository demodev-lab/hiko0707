import { LocalStorage } from '../../storage'

export abstract class BaseRepository<T extends { id: string }> {
  protected storage = LocalStorage.getInstance()
  protected abstract tableName: string

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  async findAll(): Promise<T[]> {
    const data = this.storage.get<T[]>(this.tableName)
    return data || []
  }

  async findById(id: string): Promise<T | null> {
    const items = await this.findAll()
    return items.find(item => item.id === id) || null
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const items = await this.findAll()
    const newItem = { 
      ...data, 
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as unknown as T
    items.push(newItem)
    this.storage.set(this.tableName, items)
    return newItem
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const items = await this.findAll()
    const index = items.findIndex(item => item.id === id)
    
    if (index === -1) return null
    
    items[index] = { 
      ...items[index], 
      ...data,
      updatedAt: new Date()
    }
    this.storage.set(this.tableName, items)
    return items[index]
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.findAll()
    const filteredItems = items.filter(item => item.id !== id)
    
    if (filteredItems.length === items.length) return false
    
    this.storage.set(this.tableName, filteredItems)
    return true
  }

  async deleteAll(): Promise<void> {
    this.storage.remove(this.tableName)
  }
}