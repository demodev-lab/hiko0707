import { supabaseAdmin } from '@/lib/supabase/client'
import { HotDeal } from '@/types/hotdeal'
import { Database } from '@/lib/supabase/client'

type HotDealRow = Database['public']['Tables']['hotdeals']['Row']
type HotDealInsert = Database['public']['Tables']['hotdeals']['Insert']

export class SupabaseHotDealRepository {
  private get client() {
    return supabaseAdmin()
  }

  async create(hotdeal: Omit<HotDeal, 'id'>): Promise<HotDeal | null> {
    if (!this.client) {
      console.error('Supabase admin client not initialized')
      return null
    }

    const insertData: HotDealInsert = {
      source: hotdeal.source,
      source_post_id: hotdeal.sourcePostId,
      category: hotdeal.category || '기타',
      title: hotdeal.title,
      description: hotdeal.productComment || null,
      original_price: null,
      sale_price: typeof hotdeal.price === 'number' ? hotdeal.price : null,
      discount_rate: null,
      delivery_fee: null,
      shop_name: hotdeal.seller || null,
      url: hotdeal.originalUrl,
      image_url: hotdeal.imageUrl || null,
      post_date: hotdeal.crawledAt.toISOString(),
      is_hot: hotdeal.isHot || false,
      is_expired: hotdeal.status === 'ended',
      is_nsfw: false,
      view_count: hotdeal.viewCount || 0,
      community_recommend_count: hotdeal.communityRecommendCount || 0,
      community_comment_count: hotdeal.communityCommentCount || 0,
      status: hotdeal.status,
      crawled_at: new Date().toISOString()
    }

    const { data, error } = await this.client
      .from('hotdeals')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating hotdeal:', error)
      return null
    }

    return this.mapToHotDeal(data)
  }

  async update(id: string, hotdeal: Partial<HotDeal>): Promise<HotDeal | null> {
    if (!this.client) return null

    const updateData: any = {}
    
    if (hotdeal.title !== undefined) updateData.title = hotdeal.title
    if (hotdeal.productComment !== undefined) updateData.description = hotdeal.productComment
    if (hotdeal.price !== undefined) updateData.sale_price = hotdeal.price
    if (hotdeal.isHot !== undefined) updateData.is_hot = hotdeal.isHot
    if (hotdeal.status !== undefined) {
      updateData.status = hotdeal.status
      updateData.is_expired = hotdeal.status === 'ended'
    }
    if (hotdeal.viewCount !== undefined) updateData.view_count = hotdeal.viewCount
    if (hotdeal.communityRecommendCount !== undefined) updateData.community_recommend_count = hotdeal.communityRecommendCount
    if (hotdeal.communityCommentCount !== undefined) updateData.community_comment_count = hotdeal.communityCommentCount

    const { data, error } = await this.client
      .from('hotdeals')
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
      .from('hotdeals')
      .select('*')
      .eq('source', source)
      .eq('source_post_id', sourcePostId)
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

    let query = this.client.from('hotdeals').select('*')

    if (options?.source) {
      query = query.eq('source', options.source)
    }
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    if (options?.isHot !== undefined) {
      query = query.eq('is_hot', options.isHot)
    }

    query = query.order('post_date', { ascending: false })

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
      .from('hotdeals')
      .delete()
      .lt('post_date', cutoffDate.toISOString())

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
      sourcePostId: row.source_post_id,
      category: row.category,
      title: row.title,
      price: row.sale_price || 0,
      seller: row.shop_name || '알 수 없음',
      imageUrl: row.image_url || undefined,
      originalUrl: row.url,
      productComment: row.description || '',
      crawledAt: new Date(row.post_date),
      isHot: row.is_hot,
      isPopular: row.is_hot,
      viewCount: row.view_count,
      communityRecommendCount: row.community_recommend_count,
      communityCommentCount: row.community_comment_count,
      status: row.status as HotDeal['status'],
      likeCount: 0,
      commentCount: 0
    }
  }
}