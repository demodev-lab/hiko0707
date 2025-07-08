import { BaseRepository } from './base-repository'

export interface Favorite {
  id: string
  userId: string
  itemId: string
  itemType: 'hotdeal' | 'product'
  createdAt: Date
  metadata?: {
    title?: string
    image?: string
    price?: number
    discount?: number
  }
}

export class FavoriteRepository extends BaseRepository<Favorite> {
  protected tableName = 'favorites'

  async findByUserId(userId: string): Promise<Favorite[]> {
    const favorites = await this.findAll()
    return favorites.filter(fav => fav.userId === userId)
  }

  async findByUserAndItem(userId: string, itemId: string, itemType: 'hotdeal' | 'product'): Promise<Favorite | null> {
    const favorites = await this.findAll()
    return favorites.find(fav => 
      fav.userId === userId && 
      fav.itemId === itemId && 
      fav.itemType === itemType
    ) || null
  }

  async toggle(userId: string, itemId: string, itemType: 'hotdeal' | 'product', metadata?: Favorite['metadata']): Promise<{ added: boolean; favorite?: Favorite }> {
    const existing = await this.findByUserAndItem(userId, itemId, itemType)
    
    if (existing) {
      await this.delete(existing.id)
      return { added: false }
    } else {
      const newFavorite = await this.create({
        userId,
        itemId,
        itemType,
        createdAt: new Date(),
        metadata
      })
      return { added: true, favorite: newFavorite }
    }
  }

  async isFavorited(userId: string, itemId: string, itemType: 'hotdeal' | 'product'): Promise<boolean> {
    const favorite = await this.findByUserAndItem(userId, itemId, itemType)
    return !!favorite
  }

  async getFavoriteIds(userId: string, itemType?: 'hotdeal' | 'product'): Promise<string[]> {
    const favorites = await this.findByUserId(userId)
    const filtered = itemType 
      ? favorites.filter(fav => fav.itemType === itemType)
      : favorites
    return filtered.map(fav => fav.itemId)
  }

  async countByItem(itemId: string, itemType: 'hotdeal' | 'product'): Promise<number> {
    const favorites = await this.findAll()
    return favorites.filter(fav => 
      fav.itemId === itemId && 
      fav.itemType === itemType
    ).length
  }
}