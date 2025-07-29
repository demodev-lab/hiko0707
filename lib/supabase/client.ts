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
      hotdeals: {
        Row: {
          id: string
          source: string
          source_post_id: string
          category: string
          title: string
          description: string | null
          original_price: number | null
          sale_price: number | null
          discount_rate: number | null
          delivery_fee: number | null
          shop_name: string | null
          url: string
          image_url: string | null
          post_date: string
          is_hot: boolean
          is_expired: boolean
          is_nsfw: boolean
          view_count: number
          community_recommend_count: number
          community_comment_count: number
          status: string
          crawled_at: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['hotdeals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['hotdeals']['Insert']>
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