import type { Database } from '@/database.types'
import type { HotDeal } from '@/types/hotdeal'

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
    description: local.description || null,
    
    // 가격 정보
    original_price: local.originalPrice,
    sale_price: local.salePrice,
    discount_rate: local.discountRate,
    
    // 이미지
    thumbnail_url: local.thumbnailUrl,
    image_url: local.imageUrl || local.thumbnailUrl,
    
    // URL
    original_url: local.originalUrl || local.url,
    
    // 카테고리 및 소스
    category: local.category,
    source: local.source,
    source_id: local.sourcePostId || local.sourceId || '',
    
    // 판매자 정보
    seller: local.shopName || null,
    is_free_shipping: !local.deliveryFee || local.deliveryFee === 0,
    
    // 상태 관리
    status: local.isExpired ? 'expired' : 'active',
    end_date: local.postDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    
    // 통계
    views: local.viewCount || 0,
    comment_count: local.communityCommentCount || 0,
    like_count: local.communityRecommendCount || 0,
    
    // 추가 정보
    author_name: 'Unknown', // LocalStorage에 없는 필드
    shopping_comment: '', // LocalStorage에 없는 필드
    
    // 타임스탬프
    created_at: local.crawledAt || new Date().toISOString(),
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
    description: supabase.description || '',
    
    // 가격 정보
    originalPrice: supabase.original_price,
    salePrice: supabase.sale_price,
    discountRate: supabase.discount_rate,
    price: supabase.sale_price,
    
    // 이미지
    thumbnailUrl: supabase.thumbnail_url,
    imageUrl: supabase.image_url,
    originalImageUrl: supabase.image_url,
    
    // URL
    url: supabase.original_url,
    originalUrl: supabase.original_url,
    
    // 카테고리 및 소스
    category: supabase.category,
    source: supabase.source,
    sourceId: supabase.source_id,
    sourcePostId: supabase.source_id,
    
    // 판매자 정보
    shopName: supabase.seller || '',
    seller: supabase.seller || '',
    deliveryFee: supabase.is_free_shipping ? 0 : null,
    shipping: {
      isFree: supabase.is_free_shipping || false,
      fee: supabase.is_free_shipping ? 0 : null
    },
    
    // 상태 관리
    isHot: false, // Supabase에서는 제거됨
    isExpired: supabase.status === 'expired',
    isNsfw: false, // Supabase에서는 제거됨
    isPopular: supabase.like_count > 100,
    ranking: null,
    
    // 날짜
    postDate: supabase.end_date,
    
    // 통계
    viewCount: supabase.views,
    communityRecommendCount: supabase.like_count,
    communityCommentCount: supabase.comment_count,
    commentCount: supabase.comment_count,
    
    // 상태
    status: supabase.status,
    
    // 타임스탬프
    crawledAt: supabase.created_at,
    createdAt: supabase.created_at,
    updatedAt: supabase.updated_at,
    
    // 추가 필드
    userId: supabase.author_name || 'Unknown'
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
    description: data.description || null,
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
    description: data.description || null,
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
    description: data.description || null,
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
    description: data.description || null,
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
    description: data.description || null,
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
    description: data.description || null,
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
    description: data.description || null,
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