import { supabaseAdmin } from '@/lib/supabase/client'
import { HotDeal } from '@/types/hotdeal'
import { Database } from '@/lib/supabase/client'

type HotDealRow = Database['public']['Tables']['hot_deals']['Row']
type HotDealInsert = Database['public']['Tables']['hot_deals']['Insert']

export class SupabaseHotDealRepository {
  private get client() {
    return supabaseAdmin()
  }

  async create(hotdeal: Omit<HotDeal, 'id'>): Promise<HotDeal | null> {
    console.log('🟦 SupabaseHotDealRepository.create() 호출됨')
    
    if (!this.client) {
      console.error('❌ Supabase admin client not initialized')
      return null
    }

    console.log('🟩 Supabase client 초기화됨')

    const insertData: HotDealInsert = {
      source: hotdeal.source,
      source_id: hotdeal.sourcePostId,
      category: hotdeal.category || '기타',
      title: hotdeal.title,
      description: hotdeal.productComment || null,
      original_price: typeof hotdeal.price === 'number' ? hotdeal.price : 0, // NOT NULL 제약조건 해결
      sale_price: typeof hotdeal.price === 'number' ? hotdeal.price : 0, // NOT NULL 제약조건 해결
      discount_rate: 0, // NOT NULL 제약조건 해결
      seller: hotdeal.seller || null,
      original_url: hotdeal.originalUrl,
      thumbnail_url: hotdeal.imageUrl || null, // 썸네일 URL 매핑 추가
      image_url: hotdeal.imageUrl || null,
      is_free_shipping: hotdeal.shipping?.isFree || false,
      status: hotdeal.status,
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후 만료
      views: hotdeal.viewCount || 0,
      comment_count: hotdeal.communityCommentCount || 0,
      like_count: hotdeal.communityRecommendCount || 0,
      author_name: hotdeal.userId || 'Unknown',
      shopping_comment: hotdeal.productComment || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    }

    console.log('📤 Supabase에 삽입할 데이터:', {
      source: insertData.source,
      source_id: insertData.source_id,
      title: insertData.title?.substring(0, 50) + '...',
      thumbnail_url: insertData.thumbnail_url ? '✅' : '❌',
      image_url: insertData.image_url ? '✅' : '❌'
    })

    try {
      const { data, error } = await this.client
        .from('hot_deals')
        .insert(insertData)
        .select()
        .single()

      console.log('🔍 Supabase 응답:', { data: !!data, error: !!error })

      if (error) {
        console.error('❌ Supabase 삽입 오류:', JSON.stringify(error, null, 2))
        return null
      }

      console.log('✅ Supabase 삽입 성공!')
      console.log('✅ 삽입된 데이터 ID:', data?.id)
      console.log('✅ 삽입된 데이터 제목:', data?.title)
      return this.mapToHotDeal(data)
    } catch (err) {
      console.error('❌ 예외 발생:', err)
      return null
    }
  }

  async update(id: string, hotdeal: Partial<HotDeal>): Promise<HotDeal | null> {
    if (!this.client) return null

    const updateData: any = {}
    
    if (hotdeal.title !== undefined) updateData.title = hotdeal.title
    if (hotdeal.productComment !== undefined) updateData.description = hotdeal.productComment
    if (hotdeal.price !== undefined) updateData.sale_price = hotdeal.price
    if (hotdeal.status !== undefined) updateData.status = hotdeal.status
    if (hotdeal.viewCount !== undefined) updateData.views = hotdeal.viewCount
    if (hotdeal.communityRecommendCount !== undefined) updateData.like_count = hotdeal.communityRecommendCount
    if (hotdeal.communityCommentCount !== undefined) updateData.comment_count = hotdeal.communityCommentCount

    const { data, error } = await this.client
      .from('hot_deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating hotdeal:', error)
      return null
    }

    return this.mapToHotDeal(data)
  }

  async findBySourceAndPostId(source: string, sourcePostId: string): Promise<HotDeal | null> {
    if (!this.client) return null

    const { data, error } = await this.client
      .from('hot_deals')
      .select('*')
      .eq('source', source)
      .eq('source_id', sourcePostId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null
      }
      console.error('Error finding hotdeal:', error)
      return null
    }

    return this.mapToHotDeal(data)
  }

  async findAll(options?: {
    source?: string
    status?: string
    isHot?: boolean
    limit?: number
    offset?: number
  }): Promise<HotDeal[]> {
    if (!this.client) return []

    let query = this.client.from('hot_deals').select('*')

    if (options?.source) {
      query = query.eq('source', options.source)
    }
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    if (options?.isHot !== undefined) {
      query = query.eq('is_hot', options.isHot)
    }

    query = query.order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching hotdeals:', error)
      return []
    }

    return data.map(this.mapToHotDeal)
  }

  async deleteExpired(days: number = 30): Promise<number> {
    if (!this.client) return 0

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { error, count } = await this.client
      .from('hot_deals')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('Error deleting expired hotdeals:', error)
      return 0
    }

    return count || 0
  }

  private mapToHotDeal(row: HotDealRow): HotDeal {
    return {
      id: row.id,
      source: row.source as HotDeal['source'],
      sourcePostId: row.source_id,
      category: row.category,
      title: row.title,
      price: row.sale_price || 0,
      seller: row.seller || '알 수 없음',
      imageUrl: row.image_url || undefined,
      originalUrl: row.original_url,
      productComment: row.description || '',
      crawledAt: new Date(row.created_at),
      isHot: false, // hot_deals 테이블에 is_hot 필드가 없음
      isPopular: false,
      viewCount: row.views || 0,
      communityRecommendCount: row.like_count || 0,
      communityCommentCount: row.comment_count || 0,
      status: row.status as HotDeal['status'],
      likeCount: row.like_count || 0,
      commentCount: row.comment_count || 0,
      shipping: {
        isFree: row.is_free_shipping || false,
        fee: row.is_free_shipping ? 0 : null
      },
      userId: row.author_name || 'Unknown'
    }
  }
}