import { supabaseAdmin } from '@/lib/supabase/client'
import type { Database } from '@/database.types'

// Supabase 테이블 타입 정의
type CommentRow = Database['public']['Tables']['hot_deal_comments']['Row']
type CommentInsert = Database['public']['Tables']['hot_deal_comments']['Insert']
type CommentUpdate = Database['public']['Tables']['hot_deal_comments']['Update']

type CommentLikeRow = Database['public']['Tables']['comment_likes']['Row']
type CommentLikeInsert = Database['public']['Tables']['comment_likes']['Insert']

/**
 * Supabase 댓글 관리 서비스
 * hot_deal_comments, comment_likes 테이블 관리
 */
export class SupabaseCommentService {
  /**
   * 새 댓글 생성
   */
  static async createComment(commentData: Omit<CommentInsert, 'created_at' | 'updated_at'>): Promise<CommentRow | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }
    
    const insertData: CommentInsert = {
      ...commentData,
      like_count: 0,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('hot_deal_comments')
      .insert(insertData)
      .select(`
        *,
        user:user_id (
          id,
          name,
          email
        ),
        parent_comment:parent_id (
          id,
          content,
          user_id
        )
      `)
      .single()

    if (error) {
      console.error('댓글 생성 실패:', error)
      return null
    }

    return data
  }

  /**
   * 핫딜별 댓글 목록 조회 (계층형 구조)
   */
  static async getCommentsByHotdeal(hotdealId: string, options?: {
    limit?: number
    offset?: number
    includeDeleted?: boolean
  }): Promise<CommentRow[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }
    
    let query = supabase
      .from('hot_deal_comments')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email
        ),
        parent_comment:parent_id (
          id,
          content,
          user_id,
          user:user_id (
            id,
            name
          )
        ),
        replies:hot_deal_comments!parent_id (
          id,
          content,
          created_at,
          like_count,
          is_deleted,
          user:user_id (
            id,
            name,
            email
          )
        )
      `)
      .eq('hotdeal_id', hotdealId)
      .order('created_at', { ascending: true })

    // 삭제된 댓글 제외 (기본값)
    if (!options?.includeDeleted) {
      query = query.eq('is_deleted', false)
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
      console.error('댓글 목록 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 최상위 댓글만 조회 (답글 제외)
   */
  static async getTopLevelComments(hotdealId: string, options?: {
    limit?: number
    offset?: number
  }): Promise<CommentRow[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }
    
    let query = supabase
      .from('hot_deal_comments')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email
        ),
        replies:hot_deal_comments!parent_id (
          id,
          content,
          created_at,
          like_count,
          is_deleted,
          user:user_id (
            id,
            name,
            email
          )
        )
      `)
      .eq('hotdeal_id', hotdealId)
      .is('parent_id', null)
      .eq('is_deleted', false)
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
      console.error('최상위 댓글 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 특정 댓글의 답글 조회
   */
  static async getReplies(parentCommentId: string): Promise<CommentRow[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('hot_deal_comments')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email
        )
      `)
      .eq('parent_id', parentCommentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('답글 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 댓글 수정
   */
  static async updateComment(commentId: string, updates: Pick<CommentUpdate, 'content'>): Promise<CommentRow | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    const updateData: CommentUpdate = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('hot_deal_comments')
      .update(updateData)
      .eq('id', commentId)
      .select(`
        *,
        user:user_id (
          id,
          name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('댓글 수정 실패:', error)
      return null
    }

    return data
  }

  /**
   * 댓글 소프트 삭제
   */
  static async deleteComment(commentId: string): Promise<boolean> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return false
    }

    const { data, error } = await supabase
      .from('hot_deal_comments')
      .update({
        is_deleted: true,
        content: '[삭제된 댓글입니다]',
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single()

    if (error) {
      console.error('댓글 삭제 실패:', error)
      return false
    }

    return !!data
  }

  /**
   * 댓글 좋아요 추가
   */
  static async likeComment(commentId: string, userId: string): Promise<CommentLikeRow | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    // 이미 좋아요 했는지 확인
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      console.log('이미 좋아요한 댓글입니다')
      return null
    }

    // 좋아요 추가
    const likeData: CommentLikeInsert = {
      comment_id: commentId,
      user_id: userId,
      created_at: new Date().toISOString()
    }

    const { data: newLike, error: likeError } = await supabase
      .from('comment_likes')
      .insert(likeData)
      .select()
      .single()

    if (likeError) {
      console.error('댓글 좋아요 추가 실패:', likeError)
      return null
    }

    // 댓글의 좋아요 카운트 증가
    await this.updateCommentLikeCount(commentId)

    return newLike
  }

  /**
   * 댓글 좋아요 제거
   */
  static async unlikeComment(commentId: string, userId: string): Promise<boolean> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return false
    }

    const { data, error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('댓글 좋아요 제거 실패:', error)
      return false
    }

    if (data && data.length > 0) {
      // 댓글의 좋아요 카운트 감소  
      await this.updateCommentLikeCount(commentId)
      return true
    }

    return false
  }

  /**
   * 댓글 좋아요 카운트 업데이트
   */
  static async updateCommentLikeCount(commentId: string): Promise<void> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return
    }

    // 현재 좋아요 수 카운트
    const { count } = await supabase
      .from('comment_likes')
      .select('id', { count: 'exact' })
      .eq('comment_id', commentId)

    // 댓글의 like_count 업데이트
    await supabase
      .from('hot_deal_comments')
      .update({ 
        like_count: count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
  }

  /**
   * 사용자의 댓글 좋아요 여부 확인
   */
  static async isCommentLikedByUser(commentId: string, userId: string): Promise<boolean> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return false
    }

    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (error) {
      return false
    }

    return !!data
  }

  /**
   * 사용자별 댓글 목록 조회
   */
  static async getCommentsByUser(userId: string, options?: {
    limit?: number
    offset?: number
  }): Promise<CommentRow[]> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return []
    }
    
    let query = supabase
      .from('hot_deal_comments')
      .select(`
        *,
        hotdeal:hotdeal_id (
          id,
          title,
          image_url
        ),
        parent_comment:parent_id (
          id,
          content,
          user:user_id (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
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
      console.error('사용자 댓글 목록 조회 실패:', error)
      return []
    }

    return data || []
  }

  /**
   * 댓글 통계 조회
   */
  static async getCommentStats(hotdealId?: string): Promise<{
    total_comments: number
    recent_comments: number // 최근 24시간
    most_liked_comment?: CommentRow
  } | null> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return null
    }

    try {
      // 전체 댓글 수
      let totalQuery = supabase
        .from('hot_deal_comments')
        .select('id', { count: 'exact' })
        .eq('is_deleted', false)

      if (hotdealId) {
        totalQuery = totalQuery.eq('hotdeal_id', hotdealId)
      }

      const { count: totalComments } = await totalQuery

      // 최근 24시간 댓글 수
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      let recentQuery = supabase
        .from('hot_deal_comments')
        .select('id', { count: 'exact' })
        .eq('is_deleted', false)
        .gte('created_at', yesterday)

      if (hotdealId) {
        recentQuery = recentQuery.eq('hotdeal_id', hotdealId)
      }

      const { count: recentComments } = await recentQuery

      // 가장 좋아요가 많은 댓글
      let mostLikedQuery = supabase
        .from('hot_deal_comments')
        .select(`
          *,
          user:user_id (
            id,
            name,
            email
          )
        `)
        .eq('is_deleted', false)
        .order('like_count', { ascending: false })
        .limit(1)

      if (hotdealId) {
        mostLikedQuery = mostLikedQuery.eq('hotdeal_id', hotdealId)
      }

      const { data: mostLikedComments } = await mostLikedQuery

      return {
        total_comments: totalComments || 0,
        recent_comments: recentComments || 0,
        most_liked_comment: mostLikedComments?.[0] || undefined
      }
    } catch (error) {
      console.error('댓글 통계 조회 실패:', error)
      return null
    }
  }
}