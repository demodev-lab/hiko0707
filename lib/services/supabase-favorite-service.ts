import { supabaseAdmin } from '@/lib/supabase/client'
import type { Database } from '@/database.types'

// Supabase 테이블 타입 정의
type UserFavoriteHotDealRow = Database['public']['Tables']['user_favorite_hotdeals']['Row']
type UserFavoriteHotDealInsert = Database['public']['Tables']['user_favorite_hotdeals']['Insert']

type HotDealRow = Database['public']['Tables']['hot_deals']['Row']

/**
 * Supabase 즐겨찾기 관리 서비스
 * user_favorite_hotdeals 테이블 관리
 */
export class SupabaseFavoriteService {
  /**
   * 핫딜 즐겨찾기 추가
   */
  static async addToFavorites(hotDealId: string, userId: string): Promise<UserFavoriteHotDealRow | null> {
    const supabase = supabaseAdmin()

    // 이미 즐겨찾기에 있는지 확인
    const { data: existingFavorite } = await supabase
      .from('user_favorite_hotdeals')
      .select('id')
      .eq('hotdeal_id', hotDealId)
      .eq('user_id', userId)
      .single()

    if (existingFavorite) {
      console.log('이미 즐겨찾기에 추가된 핫딜입니다')
      return null
    }

    // 즐겨찾기 추가
    const favoriteData: UserFavoriteHotDealInsert = {
      hotdeal_id: hotDealId,
      user_id: userId,
      created_at: new Date().toISOString()
    }

    const { data: newFavorite, error: favoriteError } = await supabase
      .from('user_favorite_hotdeals')
      .insert(favoriteData)
      .select()
      .single()

    if (favoriteError) {
      console.error('즐겨찾기 추가 실패:', favoriteError)
      return null
    }

    return newFavorite
  }

  /**
   * 핫딜 즐겨찾기 제거
   */
  static async removeFromFavorites(hotDealId: string, userId: string): Promise<boolean> {
    const supabase = supabaseAdmin()

    const { data, error } = await supabase
      .from('user_favorite_hotdeals')
      .delete()
      .eq('hotdeal_id', hotDealId)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('즐겨찾기 제거 실패:', error)
      return false
    }

    return data && data.length > 0
  }

  /**
   * 사용자의 핫딜 즐겨찾기 여부 확인
   */
  static async isHotDealFavorited(hotDealId: string, userId: string): Promise<boolean> {
    const supabase = supabaseAdmin()

    const { data, error } = await supabase
      .from('user_favorite_hotdeals')
      .select('id')
      .eq('hotdeal_id', hotDealId)
      .eq('user_id', userId)
      .single()

    if (error) {
      return false
    }

    return !!data
  }

  /**
   * 사용자의 즐겨찾기 핫딜 목록 조회
   */
  static async getFavoriteHotDealsByUser(userId: string, options?: {
    limit?: number
    offset?: number
    category?: string
    sortBy?: 'created_at' | 'hot_deal_created' | 'price' | 'discount'
    sortOrder?: 'asc' | 'desc'
  }): Promise<(UserFavoriteHotDealRow & { hot_deal: HotDealRow })[]> {
    const supabase = supabaseAdmin()
    
    let query = supabase
      .from('user_favorite_hotdeals')
      .select(`
        *,
        hot_deal:hotdeal_id (
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
          shopping_comment,
          seller,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)

    // 카테고리 필터링 (JOIN된 hot_deal에서)
    if (options?.category) {
      // Note: 이 부분은 Supabase에서 nested field filtering이 제한적이므로
      // 클라이언트 사이드에서 필터링할 수도 있습니다
    }

    // 정렬 설정
    const sortBy = options?.sortBy || 'created_at'
    const sortOrder = options?.sortOrder || 'desc'
    const ascending = sortOrder === 'asc'

    switch (sortBy) {
      case 'created_at':
        query = query.order('created_at', { ascending })
        break
      case 'hot_deal_created':
        // hot_deal의 created_at으로 정렬하려면 복잡한 쿼리가 필요하므로
        // 기본 created_at 사용
        query = query.order('created_at', { ascending })
        break
      default:
        query = query.order('created_at', { ascending })
    }

    if (options?.limit) {
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + options.limit) - 1)
      } else {
        query = query.limit(options.limit)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('사용자 즐겨찾기 목록 조회 실패:', error)
      return []
    }

    let result = data || []

    // 클라이언트 사이드 필터링 (카테고리)
    if (options?.category && result.length > 0) {
      result = result.filter(item => 
        item.hot_deal && item.hot_deal.category === options.category
      )
    }

    // 클라이언트 사이드 정렬 (가격, 할인율)
    if (options?.sortBy === 'price' || options?.sortBy === 'discount') {
      result.sort((a, b) => {
        let valueA: number, valueB: number
        
        if (options.sortBy === 'price') {
          valueA = a.hot_deal?.sale_price || 0
          valueB = b.hot_deal?.sale_price || 0
        } else { // discount
          valueA = a.hot_deal?.discount_rate || 0
          valueB = b.hot_deal?.discount_rate || 0
        }

        return ascending ? valueA - valueB : valueB - valueA
      })
    }

    return result
  }

  /**
   * 즐겨찾기 핫딜을 카테고리별로 그룹화
   */
  static async getFavoritesByCategory(userId: string): Promise<{
    [category: string]: (UserFavoriteHotDealRow & { hot_deal: HotDealRow })[]
  }> {
    const allFavorites = await this.getFavoriteHotDealsByUser(userId)
    
    const groupedByCategory: { [category: string]: typeof allFavorites } = {}
    
    allFavorites.forEach(favorite => {
      if (favorite.hot_deal && favorite.hot_deal.category) {
        const category = favorite.hot_deal.category
        if (!groupedByCategory[category]) {
          groupedByCategory[category] = []
        }
        groupedByCategory[category].push(favorite)
      }
    })

    return groupedByCategory
  }

  /**
   * 사용자 즐겨찾기 통계
   */
  static async getUserFavoriteStats(userId: string): Promise<{
    total_favorites: number
    recent_favorites: number // 최근 7일
    categories: { category: string; count: number }[]
    most_expensive_favorite?: {
      title: string
      price: number
      discount_rate: number
    }
    most_discounted_favorite?: {
      title: string
      discount_rate: number
      original_price: number
      sale_price: number
    }
  } | null> {
    const supabase = supabaseAdmin()

    try {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // 병렬 처리로 성능 최적화
      const [
        { count: totalFavorites },
        { count: recentFavorites },
        { data: favoritesData }
      ] = await Promise.all([
        // 전체 즐겨찾기 수
        supabase
          .from('user_favorite_hotdeals')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),

        // 최근 7일 즐겨찾기 수
        supabase
          .from('user_favorite_hotdeals')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', lastWeek),

        // 즐겨찾기 데이터 with hot_deal 정보
        supabase
          .from('user_favorite_hotdeals')
          .select(`
            *,
            hot_deal:hotdeal_id (
              title,
              category,
              sale_price,
              original_price,
              discount_rate
            )
          `)
          .eq('user_id', userId)
      ])

      // 카테고리별 집계
      const categoryCount: { [key: string]: number } = {}
      let mostExpensive: any = null
      let mostDiscounted: any = null

      favoritesData?.forEach(favorite => {
        if (favorite.hot_deal) {
          const hotDeal = favorite.hot_deal
          
          // 카테고리 집계
          if (hotDeal.category) {
            categoryCount[hotDeal.category] = (categoryCount[hotDeal.category] || 0) + 1
          }

          // 가장 비싼 상품
          if (!mostExpensive || (hotDeal.sale_price > mostExpensive.price)) {
            mostExpensive = {
              title: hotDeal.title,
              price: hotDeal.sale_price,
              discount_rate: hotDeal.discount_rate
            }
          }

          // 가장 할인율 높은 상품
          if (!mostDiscounted || (hotDeal.discount_rate > mostDiscounted.discount_rate)) {
            mostDiscounted = {
              title: hotDeal.title,
              discount_rate: hotDeal.discount_rate,
              original_price: hotDeal.original_price,
              sale_price: hotDeal.sale_price
            }
          }
        }
      })

      const categories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)

      return {
        total_favorites: totalFavorites || 0,
        recent_favorites: recentFavorites || 0,
        categories,
        most_expensive_favorite: mostExpensive,
        most_discounted_favorite: mostDiscounted
      }
    } catch (error) {
      console.error('사용자 즐겨찾기 통계 조회 실패:', error)
      return null
    }
  }

  /**
   * 즐겨찾기 기반 추천 핫딜
   */
  static async getRecommendedHotDeals(userId: string, options?: {
    limit?: number
    excludeExpired?: boolean
  }): Promise<HotDealRow[]> {
    const supabase = supabaseAdmin()

    try {
      // 사용자의 즐겨찾기 카테고리 분석
      const favoriteStats = await this.getUserFavoriteStats(userId)
      if (!favoriteStats || favoriteStats.categories.length === 0) {
        return []
      }

      // 선호 카테고리 상위 3개
      const preferredCategories = favoriteStats.categories
        .slice(0, 3)
        .map(cat => cat.category)

      // 해당 카테고리의 인기 핫딜 조회 (사용자가 즐겨찾기하지 않은 것들)
      let query = supabase
        .from('hot_deals')
        .select('*')
        .in('category', preferredCategories)
        .eq('status', 'active')
        .order('like_count', { ascending: false })

      // 만료된 핫딜 제외
      if (options?.excludeExpired !== false) {
        query = query.gte('end_date', new Date().toISOString())
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data: recommendedDeals, error } = await query

      if (error) {
        console.error('추천 핫딜 조회 실패:', error)
        return []
      }

      // 이미 즐겨찾기한 핫딜 제외
      const { data: userFavorites } = await supabase
        .from('user_favorite_hotdeals')
        .select('hotdeal_id')
        .eq('user_id', userId)

      const favoriteIds = new Set(userFavorites?.map(fav => fav.hotdeal_id) || [])
      const filteredDeals = recommendedDeals?.filter(deal => !favoriteIds.has(deal.id)) || []

      return filteredDeals
    } catch (error) {
      console.error('추천 핫딜 조회 실패:', error)
      return []
    }
  }

  /**
   * 즐겨찾기 동기화 (중복 제거, 만료된 핫딜 정리 등)
   */
  static async syncUserFavorites(userId: string): Promise<{
    removed_duplicates: number
    removed_expired: number
    removed_deleted: number
  }> {
    const supabase = supabaseAdmin()

    try {
      let removedDuplicates = 0
      let removedExpired = 0
      let removedDeleted = 0

      // 1. 중복 즐겨찾기 제거
      const { data: duplicates } = await supabase
        .from('user_favorite_hotdeals')
        .select('hotdeal_id, id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (duplicates) {
        const seen = new Set<string>()
        const toDelete = []

        for (const favorite of duplicates) {
          if (seen.has(favorite.hotdeal_id)) {
            toDelete.push(favorite.id)
          } else {
            seen.add(favorite.hotdeal_id)
          }
        }

        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('user_favorite_hotdeals')
            .delete()
            .in('id', toDelete)

          if (!deleteError) {
            removedDuplicates = toDelete.length
          }
        }
      }

      // 2. 만료된 핫딜 제거
      const { data: expiredFavorites } = await supabase
        .from('user_favorite_hotdeals')
        .select(`
          id,
          hot_deal:hotdeal_id (
            end_date,
            status
          )
        `)
        .eq('user_id', userId)

      if (expiredFavorites) {
        const now = new Date().toISOString()
        const expiredIds = expiredFavorites
          .filter(fav => 
            fav.hot_deal && 
            ((fav.hot_deal as any).end_date < now || (fav.hot_deal as any).status !== 'active')
          )
          .map(fav => fav.id)

        if (expiredIds.length > 0) {
          const { error: deleteExpiredError } = await supabase
            .from('user_favorite_hotdeals')
            .delete()
            .in('id', expiredIds)

          if (!deleteExpiredError) {
            removedExpired = expiredIds.length
          }
        }
      }

      // 3. 삭제된 핫딜에 대한 즐겨찾기 제거
      const { data: orphanedFavorites } = await supabase
        .from('user_favorite_hotdeals')
        .select(`
          id,
          hotdeal_id
        `)
        .eq('user_id', userId)

      if (orphanedFavorites) {
        const hotDealIds = orphanedFavorites.map(fav => fav.hotdeal_id)
        
        const { data: existingHotDeals } = await supabase
          .from('hot_deals')
          .select('id')
          .in('id', hotDealIds)

        const existingIds = new Set(existingHotDeals?.map(deal => deal.id) || [])
        const orphanedIds = orphanedFavorites
          .filter(fav => !existingIds.has(fav.hotdeal_id))
          .map(fav => fav.id)

        if (orphanedIds.length > 0) {
          const { error: deleteOrphanedError } = await supabase
            .from('user_favorite_hotdeals')
            .delete()
            .in('id', orphanedIds)

          if (!deleteOrphanedError) {
            removedDeleted = orphanedIds.length
          }
        }
      }

      return {
        removed_duplicates: removedDuplicates,
        removed_expired: removedExpired,
        removed_deleted: removedDeleted
      }
    } catch (error) {
      console.error('즐겨찾기 동기화 실패:', error)
      return {
        removed_duplicates: 0,
        removed_expired: 0,
        removed_deleted: 0
      }
    }
  }
}