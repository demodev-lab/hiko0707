import { BaseRepository } from './base-repository'
import { Translation, Language } from '@/types/hotdeal'

export class TranslationRepository extends BaseRepository<Translation> {
  protected tableName = 'translations'

  async findByHotDealAndLanguage(hotDealId: string, language: Language): Promise<Translation | null> {
    const translations = await this.findAll()
    return translations.find(t => t.hotDealId === hotDealId && t.language === language) || null
  }

  async findByHotDeal(hotDealId: string): Promise<Translation[]> {
    const translations = await this.findAll()
    return translations.filter(t => t.hotDealId === hotDealId)
  }

  async findByLanguage(language: Language): Promise<Translation[]> {
    const translations = await this.findAll()
    return translations.filter(t => t.language === language)
  }

  async createTranslation(data: {
    hotDealId: string
    language: Language
    title?: string
    description?: string
    status?: Translation['status']
  }): Promise<Translation> {
    const now = new Date()
    const translation: Omit<Translation, 'id'> = {
      hotDealId: data.hotDealId,
      language: data.language,
      title: data.title || '',
      description: data.description,
      status: data.status || 'pending',
      cachedAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7일 후 만료
    }
    
    return await this.create(translation)
  }

  async updateTranslationStatus(
    id: string, 
    status: Translation['status'], 
    data?: { title?: string; description?: string; error?: string }
  ): Promise<Translation | null> {
    const translation = await this.findById(id)
    if (!translation) return null
    
    return await this.update(id, {
      status,
      ...data,
      cachedAt: new Date()
    })
  }

  async getTranslationStatus(hotDealId: string): Promise<Record<Language, Translation['status']>> {
    const translations = await this.findByHotDeal(hotDealId)
    const languages: Language[] = ['ko', 'en', 'zh', 'vi', 'mn', 'th', 'ja', 'ru']
    
    const status: Record<Language, Translation['status']> = {} as Record<Language, Translation['status']>
    
    languages.forEach(lang => {
      const translation = translations.find(t => t.language === lang)
      status[lang] = translation?.status || 'pending'
    })
    
    return status
  }

  async deleteExpiredTranslations(): Promise<number> {
    const now = new Date()
    const translations = await this.findAll()
    const expired = translations.filter(t => new Date(t.expiresAt) < now)
    
    let deletedCount = 0
    for (const translation of expired) {
      const success = await this.delete(translation.id)
      if (success) deletedCount++
    }
    
    return deletedCount
  }
}