import { supabase } from '@/lib/supabase/client'
import { Language } from '@/types/hotdeal'
import { GoogleTranslateClient } from '@/lib/i18n/google-translate'

export interface HotDealTranslation {
  id: string
  hot_deal_id: string
  language: Language
  title: string
  description?: string
  product_comment?: string
  status: 'pending' | 'translating' | 'completed' | 'failed'
  cached_at: string
  expires_at: string
  error?: string
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
      
      // 2. 캐시가 유효한 경우 반환
      if (existing && this.isValid(existing)) {
        return existing
      }

      // 3. 번역 필요한 경우
      if (language === 'ko') {
        // 한국어는 번역하지 않음
        return await this.createTranslation({
          hot_deal_id: hotDealId,
          language: 'ko',
          title: originalTitle,
          product_comment: originalComment,
          status: 'completed'
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
    const { data, error } = await supabase
      .from('hotdeal_translations')
      .select('*')
      .eq('hot_deal_id', hotDealId)
      .eq('language', language)
      .single()

    if (error || !data) return null
    return data
  }

  /**
   * 핫딜의 모든 번역 조회
   */
  async getTranslations(hotDealId: string): Promise<HotDealTranslation[]> {
    const { data, error } = await supabase
      .from('hotdeal_translations')
      .select('*')
      .eq('hot_deal_id', hotDealId)

    if (error || !data) return []
    return data
  }

  /**
   * 번역 생성
   */
  async createTranslation(
    data: {
      hot_deal_id: string
      language: Language
      title: string
      description?: string
      product_comment?: string
      status: HotDealTranslation['status']
      error?: string
    }
  ): Promise<HotDealTranslation | null> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.cacheExpirationDays * 24 * 60 * 60 * 1000)

    const { data: created, error } = await supabase
      .from('hotdeal_translations')
      .insert({
        hot_deal_id: data.hot_deal_id,
        language: data.language,
        title: data.title,
        description: data.description,
        product_comment: data.product_comment,
        status: data.status,
        error: data.error,
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
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
      product_comment: string
      status: HotDealTranslation['status']
      error: string
    }>
  ): Promise<HotDealTranslation | null> {
    const { data: updated, error } = await supabase
      .from('hotdeal_translations')
      .update({
        ...data,
        cached_at: new Date().toISOString(),
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
    // 1. 번역 상태 생성
    const pendingTranslation = await this.createTranslation({
      hot_deal_id: hotDealId,
      language,
      title: originalTitle,
      product_comment: originalComment,
      status: 'translating'
    })

    if (!pendingTranslation) return null

    try {
      // 2. 번역 수행
      const [translatedTitle, translatedComment] = await Promise.all([
        this.googleTranslate.translate(originalTitle, 'ko', language),
        originalComment ? this.googleTranslate.translate(originalComment, 'ko', language) : Promise.resolve(undefined)
      ])

      // 3. 번역 결과 업데이트
      return await this.updateTranslation(pendingTranslation.id, {
        title: translatedTitle,
        product_comment: translatedComment,
        status: 'completed'
      })
    } catch (error) {
      // 4. 번역 실패 처리
      await this.updateTranslation(pendingTranslation.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Translation failed'
      })
      return null
    }
  }

  /**
   * 번역 캐시 유효성 검사
   */
  private isValid(translation: HotDealTranslation): boolean {
    if (translation.status !== 'completed') return false
    
    const expiresAt = new Date(translation.expires_at)
    return expiresAt > new Date()
  }

  /**
   * 만료된 번역 정리
   */
  async cleanupExpiredTranslations(): Promise<number> {
    const { data, error } = await supabase
      .from('hotdeal_translations')
      .delete()
      .lt('expires_at', new Date().toISOString())
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
  ): Promise<Record<Language, HotDealTranslation['status']>> {
    const translations = await this.getTranslations(hotDealId)
    const languages: Language[] = ['ko', 'en', 'zh', 'vi', 'mn', 'th', 'ja', 'ru']
    
    const status: Record<Language, HotDealTranslation['status']> = {} as any
    
    languages.forEach(lang => {
      const translation = translations.find(t => t.language === lang)
      status[lang] = translation?.status || 'pending'
    })
    
    return status
  }
}

export const supabaseTranslationService = new SupabaseTranslationService()