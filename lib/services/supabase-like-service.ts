import { supabase } from '@/lib/supabase/client'
import type { 
  HotDealLikeRow, 
  HotDealLikeInsert, 
  HotDealRow, 
  HotDealUpdate 
} from '@/lib/types/supabase'

/**
 * Supabase 핫딜 좋아요 관리 서비스
 * hot_deal_likes 테이블과 hot_deals의 like_count 관리
 */
export class SupabaseLikeService {
  /**
   * 핫딜 좋아요 추가
   */
  static async likeHotDeal(hotDealId: string, userId: string): Promise<HotDealLikeRow | null> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return null
    }

    // 이미 좋아요 했는지 확인
    const { data: existingLike } = await supabaseClient
      .from('hot_deal_likes')
      .select('id')
      .eq('hot_deal_id', hotDealId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      console.log('이미 좋아요 한 핫딜입니다')
      return null
    }

    // 좋아요 추가
    const likeData: HotDealLikeInsert = {
      hot_deal_id: hotDealId,
      user_id: userId,
      created_at: new Date().toISOString()
    }

    const { data: newLike, error: likeError } = await supabaseClient
      .from('hot_deal_likes')
      .insert(likeData)
      .select()
      .single()

    if (likeError) {
      console.error('핫딜 좋아요 추가 실패:', likeError)
      return null
    }

    // 핫딜의 좋아요 카운트 증가
    await this.updateHotDealLikeCount(hotDealId)

    return newLike
  }

  /**
   * 핫딜 좋아요 제거
   */
  static async unlikeHotDeal(hotDealId: string, userId: string): Promise<boolean> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return false
    }

    const { data, error } = await supabaseClient
      .from('hot_deal_likes')
      .delete()
      .eq('hot_deal_id', hotDealId)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('핫딜 좋아요 제거 실패:', error)
      return false
    }

    if (data && data.length > 0) {
      // 핫딜의 좋아요 카운트 감소
      await this.updateHotDealLikeCount(hotDealId)
      return true
    }

    return false
  }

  /**
   * 핫딜 좋아요 카운트 업데이트
   */
  static async updateHotDealLikeCount(hotDealId: string): Promise<void> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return
    }

    // 현재 좋아요 수 카운트
    const { count } = await supabaseClient
      .from('hot_deal_likes')
      .select('id', { count: 'exact' })
      .eq('hot_deal_id', hotDealId)

    // 핫딜의 like_count 업데이트
    await supabaseClient
      .from('hot_deals')
      .update({ 
        like_count: count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', hotDealId)
  }

  /**
   * 사용자의 핫딜 좋아요 여부 확인
   */
  static async isHotDealLikedByUser(hotDealId: string, userId: string): Promise<boolean> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return false
    }

    const { data, error } = await supabaseClient
      .from('hot_deal_likes')
      .select('id')
      .eq('hot_deal_id', hotDealId)
      .eq('user_id', userId)
      .single()

    if (error) {
      return false
    }

    return !!data
  }

  /**
   * 사용자가 좋아요한 핫딜 목록 조회
   */
  static async getLikedHotDealsByUser(userId: string, options?: {
    limit?: number
    offset?: number
  }): Promise<(HotDealLikeRow & { hot_deal: HotDealRow })[]> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return []
    }
    
    let query = supabaseClient
      .from('hot_deal_likes')
      .select(`
        *,
        hot_deal:hot_deal_id (
          id,
          title,
          description,
          image_url,
          thumbnail_url,
          sale_price,
          original_price,
          discount_rate,
          like_count,
          comment_count,
          views,
          source,
          category,
          status,
          end_date,
          is_free_shipping,
          original_url,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + options.limit) - 1)
      } else {
        query = query.limit(options.limit)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('사용자 좋아요 핫딜 목록 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 특정 핫딜을 좋아요한 사용자 목록 조회
   */
  static async getUsersWhoLikedHotDeal(hotDealId: string, options?: {
    limit?: number
    offset?: number
  }): Promise<(HotDealLikeRow & { user: { id: string; name: string; email: string } })[]> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return []
    }
    
    let query = supabaseClient
      .from('hot_deal_likes')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email
        )
      `)
      .eq('hot_deal_id', hotDealId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + options.limit) - 1)
      } else {
        query = query.limit(options.limit)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('핫딜 좋아요 사용자 목록 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 핫딜 좋아요 통계 조회
   */
  static async getHotDealLikeStats(hotDealId?: string): Promise<{
    total_likes: number
    recent_likes: number // 최근 24시간
    top_liked_hotdeal?: {
      hot_deal_id: string
      title: string
      like_count: number
    }
  } | null> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return null
    }

    try {
      // 전체 좋아요 수
      let totalQuery = supabaseClient
        .from('hot_deal_likes')
        .select('id', { count: 'exact' })

      if (hotDealId) {
        totalQuery = totalQuery.eq('hot_deal_id', hotDealId)
      }

      const { count: totalLikes } = await totalQuery

      // 최근 24시간 좋아요 수
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      let recentQuery = supabaseClient
        .from('hot_deal_likes')
        .select('id', { count: 'exact' })
        .gte('created_at', yesterday)

      if (hotDealId) {
        recentQuery = recentQuery.eq('hot_deal_id', hotDealId)
      }

      const { count: recentLikes } = await recentQuery

      // 가장 좋아요가 많은 핫딜 (전체 통계일 때만)
      let topLikedHotdeal
      if (!hotDealId) {
        const { data: topHotdeal } = await supabaseClient
          .from('hot_deals')
          .select(`
            id,
            title,
            like_count
          `)
          .order('like_count', { ascending: false })
          .limit(1)
          .single()

        if (topHotdeal) {
          topLikedHotdeal = {
            hot_deal_id: topHotdeal.id,
            title: topHotdeal.title,
            like_count: topHotdeal.like_count
          }
        }
      }

      return {
        total_likes: totalLikes || 0,
        recent_likes: recentLikes || 0,
        top_liked_hotdeal: topLikedHotdeal
      }
    } catch (error) {
      console.error('핫딜 좋아요 통계 조회 실패:', error)
      return null
    }
  }

  /**
   * 사용자별 좋아요 활동 통계
   */
  static async getUserLikeStats(userId: string): Promise<{
    total_likes: number
    recent_likes: number // 최근 7일
    favorite_categories: string[]
  } | null> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return null
    }

    try {
      // 전체 좋아요 수
      const { count: totalLikes } = await supabaseClient
        .from('hot_deal_likes')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      // 최근 7일 좋아요 수
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: recentLikes } = await supabaseClient
        .from('hot_deal_likes')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', lastWeek)

      // 선호 카테고리 (좋아요 많이 한 카테고리 순)
      const { data: categoryData } = await supabaseClient
        .from('hot_deal_likes')
        .select(`
          hot_deal:hot_deal_id (
            category
          )
        `)
        .eq('user_id', userId)

      const categoryCount: { [key: string]: number } = {}
      categoryData?.forEach(item => {
        if (item.hot_deal && (item.hot_deal as any).category) {
          const category = (item.hot_deal as any).category
          categoryCount[category] = (categoryCount[category] || 0) + 1
        }
      })

      const favoriteCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category)

      return {
        total_likes: totalLikes || 0,
        recent_likes: recentLikes || 0,
        favorite_categories: favoriteCategories
      }
    } catch (error) {
      console.error('사용자 좋아요 통계 조회 실패:', error)
      return null
    }
  }

  /**
   * 인기 핫딜 목록 조회 (좋아요 기준)
   */
  static async getPopularHotDeals(options?: {
    limit?: number
    category?: string
    timeframe?: 'day' | 'week' | 'month' | 'all'
  }): Promise<HotDealRow[]> {
    const supabaseClient = supabase()
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return []
    }
    
    let query = supabaseClient
      .from('hot_deals')
      .select('*')
      .eq('status', 'active')
      .order('like_count', { ascending: false })

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.timeframe && options.timeframe !== 'all') {
      let timeThreshold: Date
      const now = new Date()
      
      switch (options.timeframe) {
        case 'day':
          timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          timeThreshold = new Date(0)
      }
      
      query = query.gte('created_at', timeThreshold.toISOString())
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('인기 핫딜 목록 조회 실패:', error)
      return []
    }

    return data || []
  }
}