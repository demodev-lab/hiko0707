// HotDeal 관련 타입 정의
import type { Database } from '@/database.types'

// Supabase 타입 정의 - 이제 이것을 직접 사용
type Tables = Database['public']['Tables']
export type HotDeal = Tables['hot_deals']['Row']  // UI에서 직접 사용할 타입
export type HotDealInsert = Tables['hot_deals']['Insert']
export type HotDealUpdate = Tables['hot_deals']['Update']

// 레거시 타입들 (호환성을 위해 임시 유지, 점진적으로 제거 예정)
export type SupabaseHotDeal = Tables['hot_deals']['Row']
export type SupabaseHotDealInsert = Tables['hot_deals']['Insert'] 
export type SupabaseHotDealUpdate = Tables['hot_deals']['Update']

// 레거시 UI 인터페이스 (더 이상 사용하지 않음 - 제거 예정)

export type HotDealCategory = 
  | 'electronics' // 전자/IT
  | 'food' // 식품/영양
  | 'beauty' // 뷰티/패션
  | 'home' // 생활/가전
  | 'sports' // 스포츠/레저
  | 'books' // 도서/문구
  | 'travel' // 여행/숙박
  | 'other'; // 기타

export type HotDealSource = 
  | 'ppomppu' // 뽐뿌
  | 'ruliweb' // 루리웹
  | 'clien' // 클리앙
  | 'quasarzone' // 퀘이사존
  | 'eomisae' // 어미새
  | 'zod' // zod
  | 'coolenjoy' // 쿨앤조이
  | 'algumon'; // 알구몬

export interface ShippingInfo {
  isFree: boolean; // 무료배송 여부
}

export interface Translation {
  id: string;
  hotDealId: string;
  language: Language;
  title: string;
  description?: string;
  translatedProductComment?: string;
  status: 'pending' | 'translating' | 'completed' | 'failed';
  cachedAt: Date;
  expiresAt: Date;
  error?: string;
}

export type Language = 'ko' | 'en' | 'zh' | 'vi' | 'mn' | 'th' | 'ja' | 'ru';