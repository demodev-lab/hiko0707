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
      source_id: hotdeal.source_id,
      category: hotdeal.category || '기타',
      title: hotdeal.title,
      description: hotdeal.description || null,
      original_price: typeof hotdeal.sale_price === 'number' ? hotdeal.sale_price : 0, // NOT NULL 제약조건 해결
      sale_price: typeof hotdeal.sale_price === 'number' ? hotdeal.sale_price : 0, // NOT NULL 제약조건 해결
      discount_rate: 0, // NOT NULL 제약조건 해결
      seller: hotdeal.seller || null,
      original_url: hotdeal.original_url,
      thumbnail_url: hotdeal.thumbnail_url || '', // 썸네일 URL 매핑 추가
      image_url: hotdeal.image_url || '',
      is_free_shipping: hotdeal.is_free_shipping || false,
      status: hotdeal.status,
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후 만료
      views: hotdeal.views || 0,
      comment_count: hotdeal.comment_count || 0,
      like_count: hotdeal.like_count || 0,
      author_name: hotdeal.author_name || 'Unknown',
      shopping_comment: hotdeal.shopping_comment || '',
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
    if (hotdeal.description !== undefined) updateData.description = hotdeal.description
    if (hotdeal.sale_price !== undefined) updateData.sale_price = hotdeal.sale_price
    if (hotdeal.status !== undefined) updateData.status = hotdeal.status
    if (hotdeal.views !== undefined) updateData.views = hotdeal.views
    if (hotdeal.like_count !== undefined) updateData.like_count = hotdeal.like_count
    if (hotdeal.comment_count !== undefined) updateData.comment_count = hotdeal.comment_count

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

  async findBySourceAndPostId(source: string, sourceId: string): Promise<HotDeal | null> {
    if (!this.client) return null

    const { data, error } = await this.client
      .from('hot_deals')
      .select('*')
      .eq('source', source)
      .eq('source_id', sourceId)
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
    // UI에서 직접 Supabase 타입을 사용하므로 변환 없이 그대로 반환
    return row as HotDeal
  }
}