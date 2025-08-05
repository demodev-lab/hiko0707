import type { Database } from '@/database.types'
import type { HotDeal, HotDealSource } from '@/types/hotdeal'

type Tables = Database['public']['Tables']
type HotDealRow = Tables['hot_deals']['Row']
type HotDealInsert = Tables['hot_deals']['Insert']

/**
 * LocalStorage 형식을 Supabase 형식으로 변환
 */
export function transformLocalToSupabase(local: HotDeal): HotDealInsert {
  return {
    // 기본 정보
    title: local.title,
    
    // 가격 정보 - HotDeal은 단일 price 필드만 가짐
    original_price: local.price,
    sale_price: local.price,
    discount_rate: 0, // HotDeal에는 할인율 정보가 없음
    
    // 이미지
    thumbnail_url: local.thumbnailImageUrl || local.imageUrl || '',
    image_url: local.originalImageUrl || local.imageUrl || '',
    
    // URL
    original_url: local.originalUrl,
    
    // 카테고리 및 소스
    category: local.category || 'general',
    source: local.source,
    source_id: local.sourcePostId,
    
    // 판매자 정보
    seller: local.seller,
    is_free_shipping: local.shipping?.isFree || false,
    
    // 상태 관리
    status: local.status === 'ended' ? 'expired' : 'active',
    end_date: local.crawledAt ? new Date(new Date(local.crawledAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    
    // 통계
    views: local.viewCount || 0,
    comment_count: local.communityCommentCount || 0,
    like_count: local.communityRecommendCount || 0,
    
    // 추가 정보
    author_name: local.userId || 'Unknown',
    shopping_comment: local.productComment || '',
    
    // 타임스탬프
    created_at: local.crawledAt instanceof Date ? local.crawledAt.toISOString() : (local.crawledAt || new Date().toISOString()),
    updated_at: new Date().toISOString()
  }
}

/**
 * Supabase 형식을 LocalStorage 형식으로 변환
 */
export function transformSupabaseToLocal(supabase: HotDealRow): HotDeal {
  return {
    id: supabase.id,
    
    // 기본 정보
    title: supabase.title,
    
    // 가격 정보 - HotDeal은 단일 price 필드만 가짐
    price: supabase.sale_price,
    
    // 이미지
    imageUrl: supabase.image_url,
    thumbnailImageUrl: supabase.thumbnail_url,
    originalImageUrl: supabase.image_url,
    
    // URL
    originalUrl: supabase.original_url,
    
    // 카테고리 및 소스
    category: supabase.category,
    source: supabase.source as HotDealSource,
    sourcePostId: supabase.source_id,
    
    // 판매자 정보
    seller: supabase.seller || '',
    shipping: {
      isFree: supabase.is_free_shipping || false
    },
    
    // 상태 관리
    isHot: false,
    isPopular: supabase.like_count > 100,
    ranking: undefined,
    
    // 날짜
    crawledAt: new Date(supabase.created_at),
    
    // 통계
    viewCount: supabase.views,
    communityRecommendCount: supabase.like_count,
    communityCommentCount: supabase.comment_count,
    commentCount: supabase.comment_count,
    likeCount: supabase.like_count,
    
    // 상태
    status: supabase.status === 'expired' ? 'ended' : 'active',
    
    // 추가 필드
    userId: supabase.author_name,
    productComment: supabase.shopping_comment || undefined
  }
}

/**
 * 크롤러 데이터를 Supabase 형식으로 변환 (소스별)
 */
export function transformCrawlerData(source: string, data: any): HotDealInsert {
  switch (source.toLowerCase()) {
    case 'ppomppu':
      return transformPpomppuData(data)
    case 'ruliweb':
      return transformRuliwebData(data)
    case 'clien':
      return transformClienData(data)
    case 'quasarzone':
      return transformQuasarzoneData(data)
    case 'coolenjoy':
      return transformCoolenjoyData(data)
    case 'itcm':
      return transformItcmData(data)
    default:
      return transformGenericData(source, data)
  }
}

/**
 * 뽐뿌 데이터 변환
 */
function transformPpomppuData(data: any): HotDealInsert {
  return {
    title: data.title || '',
    original_price: data.originalPrice || 0,
    sale_price: data.salePrice || 0,
    discount_rate: data.discountRate || calculateDiscountRate(data.originalPrice, data.salePrice),
    thumbnail_url: data.thumbnailUrl || '',
    image_url: data.imageUrl || data.thumbnailUrl || '',
    original_url: data.url || '',
    category: mapPpomppuCategory(data.category),
    source: 'ppomppu',
    source_id: data.sourcePostId || extractSourceId(data.url),
    seller: data.shopName || null,
    is_free_shipping: data.deliveryFee === 0 || data.deliveryInfo?.includes('무료') || false,
    status: 'active',
    end_date: data.endDate || calculateEndDate(data.postDate),
    views: 0,
    comment_count: 0,
    like_count: 0,
    author_name: data.author || 'Unknown',
    shopping_comment: data.comment || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 루리웹 데이터 변환
 */
function transformRuliwebData(data: any): HotDealInsert {
  return {
    title: data.title || '',
    original_price: data.originalPrice || 0,
    sale_price: data.salePrice || 0,
    discount_rate: data.discountRate || calculateDiscountRate(data.originalPrice, data.salePrice),
    thumbnail_url: data.thumbnailUrl || '',
    image_url: data.imageUrl || data.thumbnailUrl || '',
    original_url: data.url || '',
    category: mapRuliwebCategory(data.category),
    source: 'ruliweb',
    source_id: data.sourcePostId || extractSourceId(data.url),
    seller: data.shopName || null,
    is_free_shipping: data.deliveryFee === 0 || false,
    status: 'active',
    end_date: data.endDate || calculateEndDate(data.postDate),
    views: 0,
    comment_count: 0,
    like_count: 0,
    author_name: data.author || 'Unknown',
    shopping_comment: data.comment || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 클리앙 데이터 변환
 */
function transformClienData(data: any): HotDealInsert {
  return {
    title: data.title || '',
    original_price: data.originalPrice || 0,
    sale_price: data.salePrice || 0,
    discount_rate: data.discountRate || calculateDiscountRate(data.originalPrice, data.salePrice),
    thumbnail_url: data.thumbnailUrl || '',
    image_url: data.imageUrl || data.thumbnailUrl || '',
    original_url: data.url || '',
    category: mapClienCategory(data.category),
    source: 'clien',
    source_id: data.sourcePostId || extractSourceId(data.url),
    seller: data.shopName || null,
    is_free_shipping: data.deliveryFee === 0 || false,
    status: 'active',
    end_date: data.endDate || calculateEndDate(data.postDate),
    views: 0,
    comment_count: 0,
    like_count: 0,
    author_name: data.author || 'Unknown',
    shopping_comment: data.comment || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 퀘이사존 데이터 변환
 */
function transformQuasarzoneData(data: any): HotDealInsert {
  return {
    title: data.title || '',
    original_price: data.originalPrice || 0,
    sale_price: data.salePrice || 0,
    discount_rate: data.discountRate || calculateDiscountRate(data.originalPrice, data.salePrice),
    thumbnail_url: data.thumbnailUrl || '',
    image_url: data.imageUrl || data.thumbnailUrl || '',
    original_url: data.url || '',
    category: 'electronics', // 퀘이사존은 주로 PC 하드웨어
    source: 'quasarzone',
    source_id: data.sourcePostId || extractSourceId(data.url),
    seller: data.shopName || null,
    is_free_shipping: data.deliveryFee === 0 || false,
    status: 'active',
    end_date: data.endDate || calculateEndDate(data.postDate),
    views: 0,
    comment_count: 0,
    like_count: 0,
    author_name: data.author || 'Unknown',
    shopping_comment: data.comment || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 쿨엔조이 데이터 변환
 */
function transformCoolenjoyData(data: any): HotDealInsert {
  return {
    title: data.title || '',
    original_price: data.originalPrice || 0,
    sale_price: data.salePrice || 0,
    discount_rate: data.discountRate || calculateDiscountRate(data.originalPrice, data.salePrice),
    thumbnail_url: data.thumbnailUrl || '',
    image_url: data.imageUrl || data.thumbnailUrl || '',
    original_url: data.url || '',
    category: 'electronics',
    source: 'coolenjoy',
    source_id: data.sourcePostId || extractSourceId(data.url),
    seller: data.shopName || null,
    is_free_shipping: data.deliveryFee === 0 || false,
    status: 'active',
    end_date: data.endDate || calculateEndDate(data.postDate),
    views: 0,
    comment_count: 0,
    like_count: 0,
    author_name: data.author || 'Unknown',
    shopping_comment: data.comment || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * ITCM 데이터 변환
 */
function transformItcmData(data: any): HotDealInsert {
  return {
    title: data.title || '',
    original_price: data.originalPrice || 0,
    sale_price: data.salePrice || 0,
    discount_rate: data.discountRate || calculateDiscountRate(data.originalPrice, data.salePrice),
    thumbnail_url: data.thumbnailUrl || '',
    image_url: data.imageUrl || data.thumbnailUrl || '',
    original_url: data.url || '',
    category: 'electronics',
    source: 'itcm',
    source_id: data.sourcePostId || extractSourceId(data.url),
    seller: data.shopName || null,
    is_free_shipping: data.deliveryFee === 0 || false,
    status: 'active',
    end_date: data.endDate || calculateEndDate(data.postDate),
    views: 0,
    comment_count: 0,
    like_count: 0,
    author_name: data.author || 'Unknown',
    shopping_comment: data.comment || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 일반 데이터 변환 (fallback)
 */
function transformGenericData(source: string, data: any): HotDealInsert {
  return {
    title: data.title || '',
    original_price: data.originalPrice || 0,
    sale_price: data.salePrice || 0,
    discount_rate: data.discountRate || calculateDiscountRate(data.originalPrice, data.salePrice),
    thumbnail_url: data.thumbnailUrl || '',
    image_url: data.imageUrl || data.thumbnailUrl || '',
    original_url: data.url || '',
    category: data.category || 'general',
    source: source,
    source_id: data.sourcePostId || data.sourceId || extractSourceId(data.url),
    seller: data.shopName || null,
    is_free_shipping: data.deliveryFee === 0 || false,
    status: 'active',
    end_date: data.endDate || calculateEndDate(data.postDate),
    views: 0,
    comment_count: 0,
    like_count: 0,
    author_name: data.author || 'Unknown',
    shopping_comment: data.comment || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// ===== 유틸리티 함수 =====

/**
 * 할인율 계산
 */
function calculateDiscountRate(originalPrice: number, salePrice: number): number {
  if (!originalPrice || originalPrice <= salePrice) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

/**
 * 종료일 계산 (기본 7일)
 */
function calculateEndDate(postDate?: string): string {
  const date = postDate ? new Date(postDate) : new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString()
}

/**
 * URL에서 source_id 추출
 */
function extractSourceId(url: string): string {
  if (!url) return ''
  
  // URL에서 숫자 ID 추출 시도
  const matches = url.match(/\/(\d+)(?:[/?]|$)/)
  if (matches) return matches[1]
  
  // 쿼리 파라미터에서 ID 추출 시도
  try {
    const urlObj = new URL(url)
    return urlObj.searchParams.get('id') || 
           urlObj.searchParams.get('no') || 
           urlObj.searchParams.get('post_id') || 
           ''
  } catch {
    return ''
  }
}

/**
 * 뽐뿌 카테고리 매핑
 */
function mapPpomppuCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    '컴퓨터': 'electronics',
    '디지털': 'electronics',
    '가전': 'electronics',
    '패션': 'fashion',
    '식품': 'food',
    '생활': 'living',
    '스포츠': 'sports',
    '육아': 'baby',
    '화장품': 'beauty',
    '도서': 'books'
  }
  
  return categoryMap[category] || 'general'
}

/**
 * 루리웹 카테고리 매핑
 */
function mapRuliwebCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    '게임': 'games',
    'PC': 'electronics',
    '콘솔': 'games',
    '모바일': 'electronics',
    '하드웨어': 'electronics'
  }
  
  return categoryMap[category] || 'general'
}

/**
 * 클리앙 카테고리 매핑
 */
function mapClienCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'IT': 'electronics',
    '가전': 'electronics',
    '생활': 'living',
    '패션': 'fashion',
    '식품': 'food'
  }
  
  return categoryMap[category] || 'general'
}

/**
 * 카테고리 정규화
 */
export function normalizeCategory(category: string): string {
  const validCategories = [
    'electronics',
    'fashion',
    'food',
    'living',
    'sports',
    'baby',
    'beauty',
    'books',
    'games',
    'general'
  ]
  
  return validCategories.includes(category) ? category : 'general'
}

/**
 * 필드명 변환: camelCase → snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * 필드명 변환: snake_case → camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * 객체의 모든 키를 camelCase → snake_case로 변환
 */
export function convertKeysToSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(convertKeysToSnakeCase)
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = camelToSnake(key)
    acc[snakeKey] = convertKeysToSnakeCase(obj[key])
    return acc
  }, {} as any)
}

/**
 * 객체의 모든 키를 snake_case → camelCase로 변환
 */
export function convertKeysToCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(convertKeysToCamelCase)
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = snakeToCamel(key)
    acc[camelKey] = convertKeysToCamelCase(obj[key])
    return acc
  }, {} as any)
}