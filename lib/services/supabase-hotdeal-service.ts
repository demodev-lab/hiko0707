import { supabase, supabaseAdmin } from '@/lib/supabase/client'
import type { Database } from '@/database.types'

type Tables = Database['public']['Tables']
type HotDealRow = Tables['hot_deals']['Row']
type HotDealInsert = Tables['hot_deals']['Insert']
type HotDealUpdate = Tables['hot_deals']['Update']
type TranslationRow = Tables['hotdeal_translations']['Row']
type TranslationInsert = Tables['hotdeal_translations']['Insert']

export interface HotDealQueryOptions {
  page?: number
  limit?: number
  category?: string
  status?: string
  sortBy?: 'created_at' | 'sale_price' | 'discount_rate' | 'end_date'
  sortOrder?: 'asc' | 'desc'
  searchTerm?: string
}

export interface HotDealWithTranslation extends HotDealRow {
  translations?: TranslationRow[]
}

export class SupabaseHotDealService {
  // ===== 기본 CRUD 작업 =====
  
  /**
   * 새로운 핫딜 생성
   */
  static async createHotDeal(data: HotDealInsert): Promise<HotDealRow | null> {
    try {
      const { data: hotdeal, error } = await supabaseAdmin()
        .from('hot_deals')
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error('핫딜 생성 오류:', error)
        return null
      }

      return hotdeal
    } catch (error) {
      console.error('핫딜 생성 중 예외 발생:', error)
      return null
    }
  }

  /**
   * 핫딜 목록 조회 (페이지네이션, 필터링, 정렬 지원)
   */
  static async getHotDeals(options: HotDealQueryOptions = {}): Promise<{
    data: HotDealRow[]
    count: number
    error?: string
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        status = 'active',
        sortBy = 'created_at',
        sortOrder = 'desc',
        searchTerm
      } = options

      const offset = (page - 1) * limit

      // 기본 쿼리 빌더
      let query = supabase()
        .from('hot_deals')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .eq('status', status)

      // 카테고리 필터
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      // 검색어 필터
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      // 정렬
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // 페이지네이션
      query = query.range(offset, offset + limit - 1)

      const { data, count, error } = await query

      if (error) {
        console.error('핫딜 목록 조회 오류:', error)
        return { data: [], count: 0, error: error.message }
      }

      return { data: data || [], count: count || 0 }
    } catch (error) {
      console.error('핫딜 목록 조회 중 예외 발생:', error)
      return { data: [], count: 0, error: String(error) }
    }
  }

  /**
   * 특정 핫딜 조회
   */
  static async getHotDealById(id: string): Promise<HotDealRow | null> {
    try {
      const { data, error } = await supabase()
        .from('hot_deals')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (error) {
        console.error('핫딜 조회 오류:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('핫딜 조회 중 예외 발생:', error)
      return null
    }
  }

  /**
   * 핫딜 업데이트
   */
  static async updateHotDeal(id: string, updates: HotDealUpdate): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin()
        .from('hot_deals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .is('deleted_at', null)

      if (error) {
        console.error('핫딜 업데이트 오류:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('핫딜 업데이트 중 예외 발생:', error)
      return false
    }
  }

  /**
   * 핫딜 삭제 (Soft Delete)
   */
  static async deleteHotDeal(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin()
        .from('hot_deals')
        .update({
          deleted_at: new Date().toISOString(),
          status: 'deleted'
        })
        .eq('id', id)

      if (error) {
        console.error('핫딜 삭제 오류:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('핫딜 삭제 중 예외 발생:', error)
      return false
    }
  }

  // ===== 크롤링 통합 =====

  /**
   * 크롤러에서 가져온 데이터 임포트
   */
  static async importFromCrawler(source: string, crawledData: any[]): Promise<{
    added: number
    updated: number
    duplicates: number
    errors: string[]
  }> {
    const results = {
      added: 0,
      updated: 0,
      duplicates: 0,
      errors: [] as string[]
    }

    for (const item of crawledData) {
      try {
        // 중복 체크
        const exists = await this.checkDuplicate(source, item.sourceId || item.source_id)
        
        if (exists) {
          // 기존 데이터 업데이트
          const updated = await this.updateExistingHotDeal(source, item)
          if (updated) {
            results.updated++
          } else {
            results.errors.push(`Failed to update: ${item.title}`)
          }
        } else {
          // 새 데이터 추가
          const created = await this.createHotDeal(this.transformCrawledData(source, item))
          if (created) {
            results.added++
          } else {
            results.errors.push(`Failed to create: ${item.title}`)
          }
        }
      } catch (error) {
        results.errors.push(`Error processing ${item.title}: ${error}`)
      }
    }

    return results
  }

  /**
   * 중복 체크 (source + source_id)
   */
  static async checkDuplicate(source: string, sourceId: string): Promise<boolean> {
    try {
      const { count } = await supabase()
        .from('hot_deals')
        .select('id', { count: 'exact', head: true })
        .eq('source', source)
        .eq('source_id', sourceId)

      return (count || 0) > 0
    } catch (error) {
      console.error('중복 체크 오류:', error)
      return false
    }
  }

  /**
   * 기존 핫딜 업데이트 (크롤링 데이터로)
   */
  private static async updateExistingHotDeal(source: string, crawledData: any): Promise<boolean> {
    try {
      const { data: existing } = await supabase()
        .from('hot_deals')
        .select('id')
        .eq('source', source)
        .eq('source_id', crawledData.sourceId || crawledData.source_id)
        .single()

      if (!existing) return false

      const updates = this.transformCrawledData(source, crawledData)
      delete (updates as any).id // ID는 업데이트하지 않음
      delete (updates as any).created_at // 생성일시는 업데이트하지 않음

      return await this.updateHotDeal(existing.id, updates)
    } catch (error) {
      console.error('기존 핫딜 업데이트 오류:', error)
      return false
    }
  }

  /**
   * 크롤링 데이터를 Supabase 형식으로 변환
   */
  private static transformCrawledData(source: string, data: any): HotDealInsert {
    return {
      title: data.title || '',
      description: data.description || null,
      original_price: data.originalPrice || 0,
      sale_price: data.salePrice || 0,
      discount_rate: data.discountRate || 0,
      thumbnail_url: data.thumbnailUrl || '',
      image_url: data.imageUrl || data.thumbnailUrl || '',
      original_url: data.originalUrl || data.url || '',
      category: data.category || 'general',
      source: source,
      source_id: data.sourceId || data.source_id || data.sourcePostId || '',
      seller: data.shopName || data.seller || null,
      is_free_shipping: data.deliveryFee === 0 || data.isFreeShipping || false,
      status: 'active',
      end_date: data.endDate || data.postDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      views: 0,
      comment_count: 0,
      like_count: 0,
      author_name: data.authorName || 'Unknown',
      shopping_comment: data.shoppingComment || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // ===== 번역 관리 =====

  /**
   * 특정 언어의 번역 조회
   */
  static async getTranslation(hotdealId: string, language: string): Promise<TranslationRow | null> {
    try {
      const { data, error } = await supabase()
        .from('hotdeal_translations')
        .select('*')
        .eq('hotdeal_id', hotdealId)
        .eq('language', language)
        .single()

      if (error) {
        console.error('번역 조회 오류:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('번역 조회 중 예외 발생:', error)
      return null
    }
  }

  /**
   * 번역 생성
   */
  static async createTranslation(data: TranslationInsert): Promise<TranslationRow | null> {
    try {
      const { data: translation, error } = await supabaseAdmin()
        .from('hotdeal_translations')
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error('번역 생성 오류:', error)
        return null
      }

      return translation
    } catch (error) {
      console.error('번역 생성 중 예외 발생:', error)
      return null
    }
  }

  /**
   * 번역된 핫딜 목록 조회 - 최적화된 JOIN 쿼리
   */
  static async getTranslatedHotDeals(
    language: string, 
    options: HotDealQueryOptions = {}
  ): Promise<{
    data: HotDealWithTranslation[]
    count: number
    error?: string
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        status = 'active',
        sortBy = 'created_at',
        sortOrder = 'desc',
        searchTerm
      } = options

      const offset = (page - 1) * limit

      // 한 번의 쿼리로 핫딜과 번역 데이터를 함께 가져오기
      let query = supabase()
        .from('hot_deals')
        .select(`
          *,
          translations:hotdeal_translations!left(
            id,
            language,
            title,
            description,
            translated_at,
            is_auto_translated
          )
        `, { count: 'exact' })
        .is('deleted_at', null)
        .eq('status', status)

      // 번역 필터 (언어별)
      if (language !== 'ko') {
        query = query.eq('translations.language', language)
      }

      // 카테고리 필터
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      // 검색어 필터
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      // 정렬
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // 페이지네이션
      query = query.range(offset, offset + limit - 1)

      const { data, count, error } = await query

      if (error) {
        console.error('번역된 핫딜 목록 조회 오류:', error)
        return { data: [], count: 0, error: error.message }
      }

      // 결과 변환
      const translatedHotDeals: HotDealWithTranslation[] = (data || []).map(hotdeal => ({
        ...hotdeal,
        translations: (hotdeal as any).translations || []
      }))

      return {
        data: translatedHotDeals,
        count: count || 0
      }
    } catch (error) {
      console.error('번역된 핫딜 목록 조회 중 예외 발생:', error)
      return { data: [], count: 0, error: String(error) }
    }
  }

  // ===== 통계 및 분석 =====

  /**
   * 조회수 증가
   */
  static async incrementViews(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin()
        .rpc('increment_views', { hotdeal_id: id })

      if (error) {
        // RPC 함수가 없는 경우 직접 업데이트
        await supabaseAdmin()
          .from('hot_deals')
          .update({ views: supabase().raw('views + 1') })
          .eq('id', id)
      }
    } catch (error) {
      console.error('조회수 증가 오류:', error)
    }
  }

  /**
   * 댓글 수, 좋아요 수 업데이트
   */
  static async updateCounts(id: string): Promise<void> {
    try {
      // 댓글 수 계산
      const { count: commentCount } = await supabase()
        .from('hot_deal_comments')
        .select('id', { count: 'exact', head: true })
        .eq('hotdeal_id', id)
        .is('is_deleted', false)

      // 좋아요 수 계산
      const { count: likeCount } = await supabase()
        .from('hot_deal_likes')
        .select('id', { count: 'exact', head: true })
        .eq('hot_deal_id', id)

      // 업데이트
      await supabaseAdmin()
        .from('hot_deals')
        .update({
          comment_count: commentCount || 0,
          like_count: likeCount || 0
        })
        .eq('id', id)
    } catch (error) {
      console.error('카운트 업데이트 오류:', error)
    }
  }

  /**
   * 인기 핫딜 조회 (오늘의 핫딜 포함) - 최적화된 버전
   */
  static async getPopularHotDeals(
    limit: number = 10,
    options?: {
      prioritizeToday?: boolean
      minViews?: number
    }
  ): Promise<HotDealRow[]> {
    try {
      const { prioritizeToday = true, minViews = 0 } = options || {}
      
      // 하나의 복합 쿼리로 최적화
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      
      let query = supabase()
        .from('hot_deals')
        .select('*')
        .is('deleted_at', null)
        .eq('status', 'active')
        .gte('views', minViews)

      if (prioritizeToday) {
        // 오늘 생성된 것과 인기순을 가중치를 두어 정렬
        query = query
          .order('created_at', { ascending: false }) // 최신순 우선
          .order('views', { ascending: false }) // 조회수 순
          .order('like_count', { ascending: false }) // 좋아요 순
      } else {
        // 순수 인기순
        query = query
          .order('views', { ascending: false })
          .order('like_count', { ascending: false })
          .order('created_at', { ascending: false })
      }

      const { data, error } = await query.limit(limit * 2) // 여유분 확보

      if (error) {
        console.error('인기 핫딜 조회 오류:', error)
        return []
      }

      if (!data) return []

      // prioritizeToday가 true면 오늘 것들에 가중치 부여
      if (prioritizeToday) {
        const todayDeals = data.filter(deal => deal.created_at >= todayStart)
        const otherDeals = data.filter(deal => deal.created_at < todayStart)
        
        // 오늘 딜 중 조회수 높은 것들 우선, 부족하면 전체에서 인기순으로 채움
        const result = [
          ...todayDeals.slice(0, Math.min(limit, todayDeals.length)),
          ...otherDeals.slice(0, Math.max(0, limit - todayDeals.length))
        ]
        
        return result.slice(0, limit)
      }

      return data.slice(0, limit)
    } catch (error) {
      console.error('인기 핫딜 조회 중 예외 발생:', error)
      return []
    }
  }

  /**
   * 만료 예정 핫딜 조회
   */
  static async getExpiringHotDeals(): Promise<HotDealRow[]> {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data, error } = await supabase()
        .from('hot_deals')
        .select('*')
        .is('deleted_at', null)
        .eq('status', 'active')
        .lte('end_date', tomorrow.toISOString())
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: true })

      if (error) {
        console.error('만료 예정 핫딜 조회 오류:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('만료 예정 핫딜 조회 중 예외 발생:', error)
      return []
    }
  }

  // ===== 상태 관리 =====

  /**
   * 만료된 핫딜 상태 업데이트
   */
  static async updateExpiredDeals(): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin()
        .from('hot_deals')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('end_date', new Date().toISOString())
        .select('id')

      if (error) {
        console.error('만료 핫딜 업데이트 오류:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('만료 핫딜 업데이트 중 예외 발생:', error)
      return 0
    }
  }

  /**
   * 활성 핫딜 조회
   */
  static async getActiveDeals(): Promise<HotDealRow[]> {
    try {
      const { data, error } = await supabase()
        .from('hot_deals')
        .select('*')
        .is('deleted_at', null)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('활성 핫딜 조회 오류:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('활성 핫딜 조회 중 예외 발생:', error)
      return []
    }
  }

  /**
   * 카테고리별 핫딜 수 조회
   */
  static async getCategoryCounts(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase()
        .from('hot_deals')
        .select('category')
        .is('deleted_at', null)
        .eq('status', 'active')

      if (error) {
        console.error('카테고리 카운트 조회 오류:', error)
        return {}
      }

      const counts: Record<string, number> = {}
      data?.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1
      })

      return counts
    } catch (error) {
      console.error('카테고리 카운트 조회 중 예외 발생:', error)
      return {}
    }
  }

  // ===== 사용자 상호작용 =====

  /**
   * 핫딜 좋아요 토글
   */
  static async toggleLike(hotdealId: string, userId: string): Promise<boolean> {
    try {
      // 이미 좋아요했는지 확인
      const { data: existing, error: checkError } = await supabase()
        .from('hot_deal_likes')
        .select('id')
        .eq('hot_deal_id', hotdealId)
        .eq('user_id', userId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        // 좋아요 취소
        const { error } = await supabase()
          .from('hot_deal_likes')
          .delete()
          .eq('id', existing.id)

        if (error) throw error
        await this.updateCounts(hotdealId)
        return false
      } else {
        // 좋아요 추가
        const { error } = await supabase()
          .from('hot_deal_likes')
          .insert({
            hot_deal_id: hotdealId,
            user_id: userId
          })

        if (error) throw error
        await this.updateCounts(hotdealId)
        return true
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error)
      throw error
    }
  }

  /**
   * 사용자가 좋아요했는지 확인
   */
  static async hasUserLiked(hotdealId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase()
        .from('hot_deal_likes')
        .select('id')
        .eq('hot_deal_id', hotdealId)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return !!data
    } catch (error) {
      console.error('좋아요 확인 오류:', error)
      return false
    }
  }

  /**
   * 사용자 즐겨찾기 목록 조회
   */
  static async getUserFavorites(userId: string): Promise<HotDealRow[]> {
    try {
      const { data, error } = await supabase()
        .from('user_favorite_hotdeals')
        .select(`
          hot_deals (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(item => (item as any).hot_deals).filter(Boolean) || []
    } catch (error) {
      console.error('즐겨찾기 조회 오류:', error)
      return []
    }
  }

  /**
   * 즐겨찾기 토글
   */
  static async toggleFavorite(hotdealId: string, userId: string): Promise<boolean> {
    try {
      // 이미 즐겨찾기했는지 확인
      const { data: existing, error: checkError } = await supabase()
        .from('user_favorite_hotdeals')
        .select('id')
        .eq('hotdeal_id', hotdealId)
        .eq('user_id', userId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        // 즐겨찾기 제거
        const { error } = await supabase()
          .from('user_favorite_hotdeals')
          .delete()
          .eq('id', existing.id)

        if (error) throw error
        return false
      } else {
        // 즐겨찾기 추가
        const { error } = await supabase()
          .from('user_favorite_hotdeals')
          .insert({
            hotdeal_id: hotdealId,
            user_id: userId
          })

        if (error) throw error
        return true
      }
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error)
      throw error
    }
  }

  /**
   * 핫딜 검색
   */
  static async searchHotDeals(searchTerm: string, options: HotDealQueryOptions = {}): Promise<{ data: HotDealRow[], count: number }> {
    try {
      let query = supabase()
        .from('hot_deals')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

      // 검색어 필터
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      // 추가 옵션 적용
      if (options.source) query = query.eq('source', options.source)
      if (options.status) query = query.eq('status', options.status)
      if (options.category) query = query.eq('category', options.category)
      if (options.seller) query = query.eq('seller', options.seller)
      if (options.minPrice !== undefined) query = query.gte('price', options.minPrice)
      if (options.maxPrice !== undefined) query = query.lte('price', options.maxPrice)

      // 정렬
      const sortBy = options.sortBy || 'created_at'
      const sortOrder = options.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // 페이지네이션
      if (options.limit) {
        query = query.limit(options.limit)
        if (options.offset) {
          query = query.range(options.offset, options.offset + options.limit - 1)
        }
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        count: count || 0
      }
    } catch (error) {
      console.error('핫딜 검색 오류:', error)
      return { data: [], count: 0 }
    }
  }

  /**
   * 핫딜 통계 조회
   */
  static async getHotDealStats(period: 'today' | 'week' | 'month' | 'all' = 'today'): Promise<any> {
    try {
      let dateFilter: Date | null = null
      const now = new Date()

      switch (period) {
        case 'today':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          dateFilter = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
      }

      let query = supabase()
        .from('hot_deals')
        .select('id, status, category, source, views, like_count, created_at')
        .is('deleted_at', null)

      if (dateFilter) {
        query = query.gte('created_at', dateFilter.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      const stats = {
        totalDeals: data?.length || 0,
        activeDeals: data?.filter(d => d.status === 'active').length || 0,
        endedDeals: data?.filter(d => d.status === 'ended').length || 0,
        totalViews: data?.reduce((sum, d) => sum + (d.views || 0), 0) || 0,
        totalLikes: data?.reduce((sum, d) => sum + (d.like_count || 0), 0) || 0,
        byCategory: {} as Record<string, number>,
        bySource: {} as Record<string, number>
      }

      // 카테고리별, 소스별 통계
      data?.forEach(deal => {
        stats.byCategory[deal.category] = (stats.byCategory[deal.category] || 0) + 1
        stats.bySource[deal.source] = (stats.bySource[deal.source] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('핫딜 통계 조회 오류:', error)
      return {
        totalDeals: 0,
        activeDeals: 0,
        endedDeals: 0,
        totalViews: 0,
        totalLikes: 0,
        byCategory: {},
        bySource: {}
      }
    }
  }

  /**
   * 번역 상태 조회
   */
  static async getTranslationStatus(hotdealId: string): Promise<Record<string, TranslationRow>> {
    const { data, error } = await supabase()
      .from('hotdeal_translations')
      .select('*')
      .eq('hotdeal_id', hotdealId)

    if (error) throw error

    const status: Record<string, TranslationRow> = {}
    data?.forEach((translation) => {
      status[translation.language] = translation
    })

    return status
  }

  /**
   * 핫딜 및 번역 조합 조회
   */
  static async getHotDealWithTranslation(id: string, language: string): Promise<{
    hotdeal: HotDealRow
    translation: TranslationRow | null
  } | null> {
    const hotdeal = await this.getHotDealById(id)
    if (!hotdeal) return null

    const translation = language === 'ko' ? null : await this.getTranslation(id, language)

    return { hotdeal, translation }
  }

  /**
   * 번역 시작/재시도
   */
  static async startTranslation(hotdealId: string, language: string): Promise<TranslationRow | null> {
    // 기존 번역 확인
    const existing = await this.getTranslation(hotdealId, language)
    
    if (existing?.status === 'translating') {
      return existing // 이미 번역 중
    }

    if (existing) {
      // 상태를 translating으로 업데이트
      const { data, error } = await supabase()
        .from('hotdeal_translations')
        .update({
          status: 'translating',
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // 새 번역 생성
      return await this.createTranslation({
        hotdeal_id: hotdealId,
        language: language as TranslationInsert['language'],
        status: 'translating',
        translated_title: null,
        translated_description: null,
        error_message: null
      })
    }
  }

  /**
   * 번역 업데이트
   */
  static async updateTranslation(id: string, updates: TranslationUpdate): Promise<TranslationRow | null> {
    try {
      const { data, error } = await supabase()
        .from('hotdeal_translations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('번역 업데이트 오류:', error)
      return null
    }
  }

  /**
   * 모든 핫딜 조회 (관리자용) - 최적화된 버전
   */
  static async getAllHotdeals(options?: {
    limit?: number
    status?: string
    includeInactive?: boolean
  }): Promise<HotDealRow[]> {
    try {
      const { 
        limit = 1000, // 기본값을 1000으로 제한
        status = 'active',
        includeInactive = false 
      } = options || {}

      // 비활성 포함 시 status 필터 제거
      const queryOptions = includeInactive 
        ? { limit, sortBy: 'created_at' as const, sortOrder: 'desc' as const }
        : { limit, status, sortBy: 'created_at' as const, sortOrder: 'desc' as const }

      const result = await this.getHotDeals(queryOptions)
      
      if (result.error) {
        console.error('전체 핫딜 조회 실패:', result.error)
        return []
      }

      return result.data || []
    } catch (error) {
      console.error('전체 핫딜 조회 중 예외 발생:', error)
      return []
    }
  }
}