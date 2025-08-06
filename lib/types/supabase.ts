/**
 * 공유 Supabase 타입 정의
 * 
 * 이 파일은 Supabase 데이터베이스 테이블의 타입들을 중앙화하여
 * 프로젝트 전체에서 일관되게 사용할 수 있도록 합니다.
 * 
 * 중복 타입 정의를 방지하고 유지보수를 용이하게 하기 위해 생성되었습니다.
 */

import { Database } from '@/database.types'

// ==================== Core Database Types ====================

// Users 테이블 관련 타입
export type UserRow = Database['public']['Tables']['users']['Row']
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type UserInsert = Database['public']['Tables']['users']['Insert']

// User Profiles 테이블 관련 타입
export type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']

// HotDeals 테이블 관련 타입
export type HotDealRow = Database['public']['Tables']['hot_deals']['Row']
export type HotDealInsert = Database['public']['Tables']['hot_deals']['Insert']
export type HotDealUpdate = Database['public']['Tables']['hot_deals']['Update']

// Payments 테이블 관련 타입
export type PaymentRow = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

// User Addresses 테이블 관련 타입 
export type UserAddressRow = Database['public']['Tables']['user_addresses']['Row']
export type UserAddressInsert = Database['public']['Tables']['user_addresses']['Insert']
export type UserAddressUpdate = Database['public']['Tables']['user_addresses']['Update']

// Proxy Purchase Addresses 테이블 관련 타입
export type ProxyPurchaseAddressRow = Database['public']['Tables']['proxy_purchase_addresses']['Row']
export type ProxyPurchaseAddressInsert = Database['public']['Tables']['proxy_purchase_addresses']['Insert']
export type ProxyPurchaseAddressUpdate = Database['public']['Tables']['proxy_purchase_addresses']['Update']

// HotDeal Likes 테이블 관련 타입
export type HotDealLikeRow = Database['public']['Tables']['hot_deal_likes']['Row']
export type HotDealLikeInsert = Database['public']['Tables']['hot_deal_likes']['Insert']
export type HotDealLikeUpdate = Database['public']['Tables']['hot_deal_likes']['Update']

// User Favorite HotDeals 테이블 관련 타입
export type UserFavoriteHotDealRow = Database['public']['Tables']['user_favorite_hotdeals']['Row']
export type UserFavoriteHotDealInsert = Database['public']['Tables']['user_favorite_hotdeals']['Insert']
export type UserFavoriteHotDealUpdate = Database['public']['Tables']['user_favorite_hotdeals']['Update']

// HotDeal Comments 테이블 관련 타입
export type CommentRow = Database['public']['Tables']['hot_deal_comments']['Row']
export type CommentInsert = Database['public']['Tables']['hot_deal_comments']['Insert']
export type CommentUpdate = Database['public']['Tables']['hot_deal_comments']['Update']

// Translations 테이블 관련 타입
export type TranslationRow = Database['public']['Tables']['hotdeal_translations']['Row']
export type TranslationInsert = Database['public']['Tables']['hotdeal_translations']['Insert']
export type TranslationUpdate = Database['public']['Tables']['hotdeal_translations']['Update']

// Proxy Purchases Request 테이블 관련 타입
export type OrderRow = Database['public']['Tables']['proxy_purchases_request']['Row']
export type OrderInsert = Database['public']['Tables']['proxy_purchases_request']['Insert']
export type OrderUpdate = Database['public']['Tables']['proxy_purchases_request']['Update']

// 별칭 타입들 (호환성을 위해)
export type ProxyPurchaseRequestRow = OrderRow
export type ProxyPurchaseRequestInsert = OrderInsert
export type ProxyPurchaseRequestUpdate = OrderUpdate

// Proxy Purchase Quotes 테이블 관련 타입
export type ProxyPurchaseQuoteRow = Database['public']['Tables']['proxy_purchase_quotes']['Row']
export type ProxyPurchaseQuoteInsert = Database['public']['Tables']['proxy_purchase_quotes']['Insert']
export type ProxyPurchaseQuoteUpdate = Database['public']['Tables']['proxy_purchase_quotes']['Update']

// Order Status History 테이블 관련 타입
export type OrderStatusHistoryRow = Database['public']['Tables']['order_status_history']['Row']
export type OrderStatusHistoryInsert = Database['public']['Tables']['order_status_history']['Insert']
export type OrderStatusHistoryUpdate = Database['public']['Tables']['order_status_history']['Update']

// Admin Activity Logs 테이블 관련 타입
export type AdminActivityLogRow = Database['public']['Tables']['admin_activity_logs']['Row']
export type AdminActivityLogInsert = Database['public']['Tables']['admin_activity_logs']['Insert']
export type AdminActivityLogUpdate = Database['public']['Tables']['admin_activity_logs']['Update']

// Notifications 테이블 관련 타입
export type NotificationRow = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

// ==================== Convenience Type Aliases ====================

// 자주 사용되는 타입들의 별칭
export type AddressRow = UserAddressRow
export type AddressInsert = UserAddressInsert
export type AddressUpdate = UserAddressUpdate

// ==================== Union Types ====================

// 모든 테이블 Row 타입들의 Union
export type AnyTableRow = 
  | UserRow
  | UserProfileRow
  | HotDealRow
  | PaymentRow
  | UserAddressRow
  | ProxyPurchaseAddressRow
  | HotDealLikeRow
  | UserFavoriteHotDealRow
  | CommentRow
  | TranslationRow
  | OrderRow
  | OrderStatusHistoryRow
  | AdminActivityLogRow

// 모든 테이블 Insert 타입들의 Union
export type AnyTableInsert = 
  | UserInsert
  | UserProfileInsert
  | HotDealInsert
  | PaymentInsert
  | UserAddressInsert
  | ProxyPurchaseAddressInsert
  | HotDealLikeInsert
  | UserFavoriteHotDealInsert
  | CommentInsert
  | TranslationInsert
  | OrderInsert
  | OrderStatusHistoryInsert
  | AdminActivityLogInsert

// ==================== Table Name Types ====================

// 테이블 이름들의 타입
export type TableName = keyof Database['public']['Tables']

// 각 테이블의 컬럼 이름들
export type UserColumns = keyof UserRow
export type HotDealColumns = keyof HotDealRow  
export type PaymentColumns = keyof PaymentRow
export type OrderColumns = keyof OrderRow