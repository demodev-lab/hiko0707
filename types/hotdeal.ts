// HotDeal 관련 타입 정의

export interface HotDeal {
  id: string;
  
  // 크롤링 가능 정보
  title: string; // 상품명
  price: number; // 가격
  imageUrl?: string; // 기본 이미지 (고해상도 우선)
  thumbnailImageUrl?: string; // 썸네일용 저해상도 이미지
  originalImageUrl?: string; // 상세 페이지용 고해상도 이미지
  originalUrl: string; // 원본 링크
  seller: string; // 쇼핑몰 이름
  source: HotDealSource; // 커뮤니티 이름
  sourcePostId: string; // 원본 게시글 ID (중복 체크용)
  crawledAt: Date; // 커뮤니티 업로드 시간
  userId?: string; // 커뮤니티 작성자 ID
  communityCommentCount?: number; // 커뮤니티 댓글수
  communityRecommendCount?: number; // 커뮤니티 추천수
  isPopular?: boolean; // 인기 게시물 여부 (커뮤니티에서 표시하는 인기 라벨)
  isHot?: boolean; // 핫 게시물 여부 (HOT 라벨)
  ranking?: number; // 핫딜 순위 (있을 경우)
  shipping?: ShippingInfo; // 배송 정보
  productComment?: string; // 원 게시자가 작성한 상품 설명 텍스트
  category?: string; // 카테고리 정보
  
  // 상태
  status: 'active' | 'ended';
  
  // 우리 사이트 고유 기능
  viewCount?: number; // 우리 사이트 조회수
  likeCount?: number; // 찜 수
  commentCount?: number; // 우리 사이트 댓글수
  
  // 번역 필드
  translatedTitle?: string;
  translatedProductComment?: string;
  translationStatus?: 'pending' | 'translating' | 'completed' | 'failed';
  translatedAt?: Date;
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