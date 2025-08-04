import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase 클라이언트 (지연 초기화)
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

// 클라이언트 사이드용
export const supabase = () => {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key are required')
    }
    
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

// 서버 사이드용 (Service Role Key 사용)
export const supabaseAdmin = () => {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return null
    }
    
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return _supabaseAdmin
}

// 타입 정의
export type Database = {
  public: {
    Tables: {
      hot_deals: {
        Row: {
          id: string
          source: string
          source_id: string  // source_post_id → source_id로 수정
          category: string
          title: string
          description: string | null
          original_price: number
          sale_price: number
          discount_rate: number
          thumbnail_url: string | null  // 추가된 필드
          image_url: string | null
          original_url: string
          seller: string | null
          is_free_shipping: boolean
          status: string
          end_date: string | null
          views: number
          comment_count: number
          like_count: number
          author_name: string | null
          shopping_comment: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['hot_deals']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['hot_deals']['Insert']>
      }
      crawler_jobs: {
        Row: {
          id: string
          source: string
          schedule: string
          enabled: boolean
          last_run: string | null
          next_run: string | null
          status: string
          statistics: {
            total_crawled: number
            new_deals: number
            updated_deals: number
            duration: number
          } | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['crawler_jobs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['crawler_jobs']['Insert']>
      }
    }
  }
}