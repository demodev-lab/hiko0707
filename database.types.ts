export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          action_category: string
          admin_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          new_value: Json | null
          old_value: Json | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          action_category: string
          admin_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          action_category?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_activity_logs_admin_id"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_comment_likes_comment_id"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "hot_deal_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comment_likes_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crawling_logs: {
        Row: {
          completed_at: string | null
          duplicates: number
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          items_added: number
          items_found: number
          items_updated: number
          source: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          duplicates?: number
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          items_added?: number
          items_found?: number
          items_updated?: number
          source: string
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          duplicates?: number
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          items_added?: number
          items_found?: number
          items_updated?: number
          source?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      hot_deal_comments: {
        Row: {
          content: string
          created_at: string
          hotdeal_id: string
          id: string
          is_deleted: boolean | null
          like_count: number
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          hotdeal_id: string
          id?: string
          is_deleted?: boolean | null
          like_count?: number
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          hotdeal_id?: string
          id?: string
          is_deleted?: boolean | null
          like_count?: number
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hot_deal_comments_hotdeal_id"
            columns: ["hotdeal_id"]
            isOneToOne: false
            referencedRelation: "hot_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_hot_deal_comments_parent_id"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "hot_deal_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_hot_deal_comments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hot_deal_likes: {
        Row: {
          created_at: string
          hot_deal_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hot_deal_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hot_deal_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hot_deal_likes_hot_deal_id"
            columns: ["hot_deal_id"]
            isOneToOne: false
            referencedRelation: "hot_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_hot_deal_likes_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hot_deals: {
        Row: {
          author_name: string
          category: string
          comment_count: number
          created_at: string
          deleted_at: string | null
          description: string | null
          discount_rate: number
          end_date: string
          id: string
          image_url: string
          is_free_shipping: boolean
          like_count: number
          original_price: number
          original_url: string
          sale_price: number
          seller: string | null
          shopping_comment: string
          source: string
          source_id: string
          status: string
          thumbnail_url: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_name: string
          category: string
          comment_count?: number
          created_at: string
          deleted_at?: string | null
          description?: string | null
          discount_rate: number
          end_date: string
          id?: string
          image_url: string
          is_free_shipping: boolean
          like_count?: number
          original_price: number
          original_url: string
          sale_price: number
          seller?: string | null
          shopping_comment: string
          source: string
          source_id: string
          status: string
          thumbnail_url: string
          title: string
          updated_at: string
          views?: number
        }
        Update: {
          author_name?: string
          category?: string
          comment_count?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          discount_rate?: number
          end_date?: string
          id?: string
          image_url?: string
          is_free_shipping?: boolean
          like_count?: number
          original_price?: number
          original_url?: string
          sale_price?: number
          seller?: string | null
          shopping_comment?: string
          source?: string
          source_id?: string
          status?: string
          thumbnail_url?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      hotdeal_translations: {
        Row: {
          created_at: string
          description: string | null
          hotdeal_id: string
          id: string
          is_auto_translated: boolean
          language: string
          title: string
          translated_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hotdeal_id: string
          id?: string
          is_auto_translated?: boolean
          language: string
          title: string
          translated_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hotdeal_id?: string
          id?: string
          is_auto_translated?: boolean
          language?: string
          title?: string
          translated_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hotdeal_translations_hotdeal_id"
            columns: ["hotdeal_id"]
            isOneToOne: false
            referencedRelation: "hot_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read: boolean
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          metadata: Json | null
          notes: string | null
          request_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          request_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          request_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_status_history_changed_by"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_status_history_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "proxy_purchases_request"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          external_payment_id: string | null
          id: string
          paid_at: string | null
          payment_gateway: string | null
          payment_method: string
          request_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          external_payment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method: string
          request_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          external_payment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string
          request_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "proxy_purchases_request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proxy_purchase_addresses: {
        Row: {
          address: string
          detail_address: string
          email: string
          id: string
          phone_number: string
          proxy_purchase_id: string
          recipient_name: string
        }
        Insert: {
          address: string
          detail_address: string
          email: string
          id?: string
          phone_number: string
          proxy_purchase_id: string
          recipient_name: string
        }
        Update: {
          address?: string
          detail_address?: string
          email?: string
          id?: string
          phone_number?: string
          proxy_purchase_id?: string
          recipient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_proxy_purchase_addresses_proxy_purchase_id"
            columns: ["proxy_purchase_id"]
            isOneToOne: false
            referencedRelation: "proxy_purchases_request"
            referencedColumns: ["id"]
          },
        ]
      }
      proxy_purchase_quotes: {
        Row: {
          approval_state: string
          approved_at: string | null
          created_at: string
          domestic_shipping: number
          fee: number
          id: string
          international_shipping: number
          notes: string | null
          notification: string | null
          payment_method: string
          product_cost: number
          rejected_at: string | null
          request_id: string
          total_amount: number
          valid_until: string
        }
        Insert: {
          approval_state?: string
          approved_at?: string | null
          created_at?: string
          domestic_shipping?: number
          fee: number
          id?: string
          international_shipping?: number
          notes?: string | null
          notification?: string | null
          payment_method: string
          product_cost: number
          rejected_at?: string | null
          request_id: string
          total_amount: number
          valid_until: string
        }
        Update: {
          approval_state?: string
          approved_at?: string | null
          created_at?: string
          domestic_shipping?: number
          fee?: number
          id?: string
          international_shipping?: number
          notes?: string | null
          notification?: string | null
          payment_method?: string
          product_cost?: number
          rejected_at?: string | null
          request_id?: string
          total_amount?: number
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_proxy_purchase_quotes_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "proxy_purchases_request"
            referencedColumns: ["id"]
          },
        ]
      }
      proxy_purchases_request: {
        Row: {
          created_at: string
          hot_deal_id: string
          id: string
          option: string | null
          order_number: string
          product_info: Json
          quantity: number
          shipping_address_id: string | null
          special_requests: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hot_deal_id: string
          id?: string
          option?: string | null
          order_number: string
          product_info?: Json
          quantity: number
          shipping_address_id?: string | null
          special_requests?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hot_deal_id?: string
          id?: string
          option?: string | null
          order_number?: string
          product_info?: Json
          quantity?: number
          shipping_address_id?: string | null
          special_requests?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_proxy_purchases_request_hot_deal_id"
            columns: ["hot_deal_id"]
            isOneToOne: false
            referencedRelation: "hot_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_proxy_purchases_request_shipping_address_id"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "user_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_proxy_purchases_request_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          data_type: string
          default_value: Json | null
          description: string | null
          id: string
          is_editable: boolean
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          validation_rules: Json | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          data_type: string
          default_value?: Json | null
          description?: string | null
          id?: string
          is_editable?: boolean
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          data_type?: string
          default_value?: Json | null
          description?: string | null
          id?: string
          is_editable?: boolean
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fk_system_settings_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addresses: {
        Row: {
          address: string
          address_detail: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          name: string
          phone: string
          post_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          address_detail?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          name: string
          phone: string
          post_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          address_detail?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          name?: string
          phone?: string
          post_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_addresses_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_hotdeals: {
        Row: {
          created_at: string
          hotdeal_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hotdeal_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hotdeal_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_favorite_hotdeals_hotdeal_id"
            columns: ["hotdeal_id"]
            isOneToOne: false
            referencedRelation: "hot_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_favorite_hotdeals_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string
          created_at: string
          date_of_birth: string
          gender: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url: string
          created_at?: string
          date_of_birth: string
          gender: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          date_of_birth?: string
          gender?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clerk_user_id: string
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          last_logined_at: string | null
          name: string
          phone: string | null
          preferred_language: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          last_logined_at?: string | null
          name: string
          phone?: string | null
          preferred_language?: string
          role: string
          status: string
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          last_logined_at?: string | null
          name?: string
          phone?: string | null
          preferred_language?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
