'use server'

import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'
import { HotDeal } from '@/types/hotdeal'
import { CrawledHotDeal } from '@/lib/crawlers/types'
import { v4 as uuidv4 } from 'uuid'

// 크롤링된 데이터를 Supabase HotDeal 형식으로 변환
function convertToHotDeal(crawledDeal: CrawledHotDeal): Omit<HotDeal, 'id'> {
  return {
    title: crawledDeal.title,
    sale_price: crawledDeal.price || 0,
    original_price: crawledDeal.price || 0,
    image_url: crawledDeal.imageUrl || '',
    thumbnail_url: crawledDeal.imageUrl || '',
    original_url: crawledDeal.originalUrl,
    seller: crawledDeal.seller || '',
    source: crawledDeal.source as HotDeal['source'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author_name: crawledDeal.userId || 'anonymous',
    source_id: '',
    category: crawledDeal.category || 'general',
    is_free_shipping: crawledDeal.shipping?.isFree || false,
    shopping_comment: crawledDeal.productComment || '',
    status: 'active',
    views: crawledDeal.viewCount || 0,
    like_count: 0,
    comment_count: 0,
    discount_rate: 0,
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: null,
    deleted_at: null
  }
}

// 중복 체크 함수
export async function checkDuplicateHotDeal(originalUrl: string): Promise<boolean> {
  try {
    // URL에서 source와 sourcePostId 추출 시도
    const urlMatch = originalUrl.match(/ppomppu\.co\.kr.*?no=(\d+)/)
    if (urlMatch) {
      const sourcePostId = urlMatch[1]
      const isDuplicate = await SupabaseHotDealService.checkDuplicate('ppomppu', sourcePostId)
      console.log(`🔍 중복 체크 (ppomppu-${sourcePostId}): ${isDuplicate}`)
      return isDuplicate
    }
    
    // URL 기반으로 직접 체크
    console.log(`🔍 중복 체크: ${originalUrl}`)
    const { data: hotdeals } = await SupabaseHotDealService.getHotDeals({ 
      limit: 1000,
      status: 'active' 
    })
    const isDuplicate = hotdeals.some(deal => deal.original_url === originalUrl)
    console.log(`✅ 중복 여부: ${isDuplicate}`)
    return isDuplicate
  } catch (error) {
    console.error('중복 체크 오류:', error)
    return false
  }
}

// 단일 핫딜 저장
export async function saveHotDeal(crawledDeal: CrawledHotDeal): Promise<HotDeal | null> {
  try {
    // 중복 체크
    const isDuplicate = await checkDuplicateHotDeal(crawledDeal.originalUrl)
    if (isDuplicate) {
      console.log(`⚠️ 중복 게시물 스킵: ${crawledDeal.title}`)
      return null
    }
    
    // HotDeal 형식으로 변환
    const hotDealData = convertToHotDeal(crawledDeal)
    
    // Supabase 형식으로 변환
    const supabaseData = {
      title: hotDealData.title,
      sale_price: hotDealData.sale_price || 0,
      original_price: 0, // 원가 정보가 없으면 0
      source: hotDealData.source,
      source_id: hotDealData.source_id || `${hotDealData.source}-${Date.now()}`,
      category: hotDealData.category || 'general',
      image_url: hotDealData.image_url || '',
      thumbnail_url: hotDealData.image_url || '',
      original_url: hotDealData.original_url,
      seller: hotDealData.seller || '',
      author_name: hotDealData.author_name || 'anonymous',
      is_free_shipping: hotDealData.is_free_shipping || false,
      shopping_comment: hotDealData.shopping_comment || '',
      status: 'active' as const,
      views: hotDealData.views || 0,
      like_count: 0,
      comment_count: 0,
      discount_rate: 0,
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: null,
      deleted_at: null
    }
    
    // 데이터베이스에 저장
    console.log('💾 저장 시도 중...')
    const newHotDeal = await SupabaseHotDealService.createHotDeal(supabaseData)
    
    if (newHotDeal) {
      console.log(`✅ 새 핫딜 저장됨: ${newHotDeal.title}`)
      console.log(`🆔 생성된 ID: ${newHotDeal.id}`)
      
      // 저장 후 확인
      const stats = await SupabaseHotDealService.getHotDealStats('all')
      console.log(`📊 저장 후 총 핫딜 수: ${stats.totalDeals}`)
      
      // Supabase 데이터를 그대로 반환 (snake_case 형식)
      return newHotDeal
    }
    
    return null
  } catch (error) {
    console.error('핫딜 저장 오류:', error)
    return null
  }
}

// 여러 핫딜 일괄 저장
export async function saveMultipleHotDeals(crawledDeals: CrawledHotDeal[]): Promise<{
  saved: HotDeal[]
  skipped: number
  errors: number
}> {
  console.log(`📦 ${crawledDeals.length}개 핫딜 저장 시작...`)
  
  // 현재 저장된 핫딜 개수 확인
  const beforeStats = await SupabaseHotDealService.getHotDealStats('all')
  const beforeCount = beforeStats.totalDeals
  console.log(`📊 저장 전 핫딜 개수: ${beforeCount}`)
  
  const saved: HotDeal[] = []
  let skipped = 0
  let errors = 0
  
  for (const crawledDeal of crawledDeals) {
    try {
      const result = await saveHotDeal(crawledDeal)
      if (result) {
        saved.push(result)
      } else {
        skipped++
      }
    } catch (error) {
      errors++
      console.error(`오류 발생: ${crawledDeal.title}`, error)
    }
    
    // 과도한 요청 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // 저장 후 핫딜 개수 확인
  const afterStats = await SupabaseHotDealService.getHotDealStats('all')
  const afterCount = afterStats.totalDeals
  console.log(`📊 저장 후 핫딜 개수: ${afterCount} (증가: ${afterCount - beforeCount})`)
  console.log(`✅ 저장 완료: ${saved.length}개 저장, ${skipped}개 중복, ${errors}개 오류`)
  
  return { saved, skipped, errors }
}

// 최근 크롤링 상태 조회
export async function getCrawlerStatus(): Promise<{
  totalHotDeals: number
  todayHotDeals: number
  sources: Record<string, number>
}> {
  try {
    // 전체 통계
    const totalStats = await SupabaseHotDealService.getHotDealStats('all')
    
    // 오늘 날짜로 필터링
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.toISOString()
    
    // 오늘의 핫딜 조회
    const { data: todayDeals } = await SupabaseHotDealService.getHotDeals({
      limit: 1000,
      status: 'active'
    })
    
    const todayHotDeals = todayDeals.filter(deal => 
      new Date(deal.created_at) >= today
    )
    
    // 소스별 통계를 위해 전체 데이터에서 필터링
    const sources: Record<string, number> = {}
    const { data: allDeals } = await SupabaseHotDealService.getHotDeals({
      limit: 10000,
      status: 'active'
    })
    
    allDeals.forEach(deal => {
      sources[deal.source] = (sources[deal.source] || 0) + 1
    })
    
    return {
      totalHotDeals: totalStats.totalDeals,
      todayHotDeals: todayHotDeals.length,
      sources
    }
  } catch (error) {
    console.error('크롤러 상태 조회 오류:', error)
    return {
      totalHotDeals: 0,
      todayHotDeals: 0,
      sources: {}
    }
  }
}