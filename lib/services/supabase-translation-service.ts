import { supabase } from '@/lib/supabase/client'
import { Language } from '@/types/hotdeal'
import { GoogleTranslateClient } from '@/lib/i18n/google-translate'

export interface HotDealTranslation {
  id: string
  hotdeal_id: string
  language: string
  title: string
  description?: string
  is_auto_translated: boolean
  translated_at: string
  created_at: string
  updated_at: string
}

export class SupabaseTranslationService {
  private googleTranslate: GoogleTranslateClient
  private cacheExpirationDays = 7

  constructor() {
    this.googleTranslate = new GoogleTranslateClient()
  }

  /**
   * 핫딜 번역 조회 또는 생성
   */
  async getOrCreateTranslation(
    hotDealId: string,
    language: Language,
    originalTitle: string,
    originalComment?: string
  ): Promise<HotDealTranslation | null> {
    try {
      // 1. 기존 번역 확인
      const existing = await this.getTranslation(hotDealId, language)
      
      // 2. 기존 번역이 있고 최근 것이면 반환 (7일 이내)
      if (existing && this.isRecentTranslation(existing)) {
        return existing
      }

      // 3. 번역 필요한 경우
      if (language === 'ko') {
        // 한국어는 번역하지 않음
        return await this.createTranslation({
          hotdeal_id: hotDealId,
          language: 'ko',
          title: originalTitle,
          description: originalComment,
          is_auto_translated: false
        })
      }

      // 4. 새로운 번역 생성
      return await this.translateAndSave(
        hotDealId,
        language,
        originalTitle,
        originalComment
      )
    } catch (error) {
      console.error('Translation error:', error)
      return null
    }
  }

  /**
   * 번역 조회
   */
  async getTranslation(
    hotDealId: string,
    language: Language
  ): Promise<HotDealTranslation | null> {
    const { data, error } = await supabase()
      .from('hotdeal_translations')
      .select('*')
      .eq('hotdeal_id', hotDealId)
      .eq('language', language)
      .single()

    if (error || !data) return null
    return data
  }

  /**
   * 핫딜의 모든 번역 조회
   */
  async getTranslations(hotDealId: string): Promise<HotDealTranslation[]> {
    const { data, error } = await supabase()
      .from('hotdeal_translations')
      .select('*')
      .eq('hotdeal_id', hotDealId)

    if (error || !data) return []
    return data
  }

  /**
   * 번역 생성
   */
  async createTranslation(
    data: {
      hotdeal_id: string
      language: string
      title: string
      description?: string
      is_auto_translated?: boolean
    }
  ): Promise<HotDealTranslation | null> {
    const now = new Date()

    const { data: created, error } = await supabase()
      .from('hotdeal_translations')
      .insert({
        hotdeal_id: data.hotdeal_id,
        language: data.language,
        title: data.title,
        description: data.description,
        is_auto_translated: data.is_auto_translated ?? true,
        translated_at: now.toISOString()
      })
      .select()
      .single()

    if (error || !created) {
      console.error('Create translation error:', error)
      return null
    }

    return created
  }

  /**
   * 번역 업데이트
   */
  async updateTranslation(
    id: string,
    data: Partial<{
      title: string
      description: string
      is_auto_translated: boolean
    }>
  ): Promise<HotDealTranslation | null> {
    const { data: updated, error } = await supabase()
      .from('hotdeal_translations')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !updated) {
      console.error('Update translation error:', error)
      return null
    }

    return updated
  }

  /**
   * 번역 수행 및 저장
   */
  private async translateAndSave(
    hotDealId: string,
    language: Language,
    originalTitle: string,
    originalComment?: string
  ): Promise<HotDealTranslation | null> {
    try {
      // 1. 번역 수행
      const [translatedTitle, translatedComment] = await Promise.all([
        this.googleTranslate.translate(originalTitle, 'ko', language),
        originalComment ? this.googleTranslate.translate(originalComment, 'ko', language) : Promise.resolve(undefined)
      ])

      // 2. 번역 결과 저장
      return await this.createTranslation({
        hotdeal_id: hotDealId,
        language,
        title: translatedTitle,
        description: translatedComment,
        is_auto_translated: true
      })
    } catch (error) {
      console.error('Translation failed:', error)
      return null
    }
  }

  /**
   * 번역이 최근 것인지 확인 (7일 이내)
   */
  private isRecentTranslation(translation: HotDealTranslation): boolean {
    const translatedAt = new Date(translation.translated_at)
    const expirationTime = this.cacheExpirationDays * 24 * 60 * 60 * 1000
    return (Date.now() - translatedAt.getTime()) < expirationTime
  }

  /**
   * 만료된 번역 정리 (7일 이상 된 번역 삭제)
   */
  async cleanupExpiredTranslations(): Promise<number> {
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() - this.cacheExpirationDays)

    const { data, error } = await supabase()
      .from('hotdeal_translations')
      .delete()
      .lt('translated_at', expirationDate.toISOString())
      .select()

    if (error) {
      console.error('Cleanup error:', error)
      return 0
    }

    return data?.length || 0
  }

  /**
   * 일괄 번역 (크롤러에서 사용)
   */
  async batchTranslate(
    hotDeals: Array<{
      id: string
      title: string
      productComment?: string
    }>,
    languages: Language[] = ['en', 'zh', 'vi', 'mn', 'th', 'ja', 'ru']
  ): Promise<void> {
    const translations = []

    for (const hotDeal of hotDeals) {
      for (const language of languages) {
        translations.push(
          this.getOrCreateTranslation(
            hotDeal.id,
            language,
            hotDeal.title,
            hotDeal.productComment
          )
        )
      }
    }

    // 병렬 처리로 성능 향상
    await Promise.allSettled(translations)
  }

  /**
   * 번역 상태 조회
   */
  async getTranslationStatus(
    hotDealId: string
  ): Promise<Record<Language, 'pending' | 'completed' | 'expired'>> {
    const translations = await this.getTranslations(hotDealId)
    const languages: Language[] = ['ko', 'en', 'zh', 'vi', 'mn', 'th', 'ja', 'ru']
    
    const status: Record<Language, 'pending' | 'completed' | 'expired'> = {} as any
    
    languages.forEach(lang => {
      const translation = translations.find(t => t.language === lang)
      if (!translation) {
        status[lang] = 'pending'
      } else if (this.isRecentTranslation(translation)) {
        status[lang] = 'completed'
      } else {
        status[lang] = 'expired'
      }
    })
    
    return status
  }
}

export const supabaseTranslationService = new SupabaseTranslationService()