// HotDeal 관련 타입 정의

export interface HotDeal {
  id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  category: HotDealCategory;
  source: HotDealSource;
  originalUrl: string;
  imageUrl?: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  shipping?: ShippingInfo;
  status: 'active' | 'ended';
  startDate?: Date;
  endDate?: Date;
  crawledAt: Date;
  updatedAt: Date;
}

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
  cost: number;
  isFree: boolean;
  method?: string;
}

export interface Translation {
  id: string;
  hotDealId: string;
  language: Language;
  title: string;
  description?: string;
  cachedAt: Date;
  expiresAt: Date;
}

export type Language = 'ko' | 'en' | 'zh' | 'vi' | 'mn' | 'th' | 'ja' | 'ru';