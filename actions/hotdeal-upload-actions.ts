'use server'

import { db } from '@/lib/db/database-service'
import { HotDeal } from '@/types/hotdeal'
import { CrawledHotDeal } from '@/lib/crawlers/types'
import { v4 as uuidv4 } from 'uuid'

// 크롤링된 데이터를 HotDeal 형식으로 변환
function convertToHotDeal(crawledDeal: CrawledHotDeal): Omit<HotDeal, 'id'> {
  return {
    title: crawledDeal.title,
    price: crawledDeal.price,
    imageUrl: crawledDeal.imageUrl,
    originalUrl: crawledDeal.originalUrl,
    seller: crawledDeal.seller,
    source: crawledDeal.source as HotDeal['source'],
    crawledAt: crawledDeal.crawledAt,
    userId: crawledDeal.userId,
    communityCommentCount: crawledDeal.communityCommentCount || 0,
    communityRecommendCount: crawledDeal.communityRecommendCount || 0,
    ranking: undefined,
    shipping: crawledDeal.shipping,
    productComment: crawledDeal.productComment,
    category: crawledDeal.category,
    status: 'active',
    viewCount: crawledDeal.viewCount || 0,
    likeCount: 0,
    commentCount: 0,
    translationStatus: 'pending'
  }
}

// 중복 체크 함수
export async function checkDuplicateHotDeal(originalUrl: string): Promise<boolean> {
  try {
    const allHotDeals = await db.hotdeals.findAll()
    console.log(`🔍 중복 체크: ${originalUrl}`)
    console.log(`📊 현재 핫딜 수: ${allHotDeals.length}`)
    const isDuplicate = allHotDeals.some(deal => deal.originalUrl === originalUrl)
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
    
    // 데이터베이스에 저장 (id는 자동 생성됨)
    console.log('💾 저장 시도 중...')
    const newHotDeal = await db.hotdeals.create(hotDealData)
    
    console.log(`✅ 새 핫딜 저장됨: ${newHotDeal.title}`)
    console.log(`🆔 생성된 ID: ${newHotDeal.id}`)
    
    // 저장 후 확인
    const afterSave = await db.hotdeals.findAll()
    console.log(`📊 저장 후 총 핫딜 수: ${afterSave.length}`)
    
    return newHotDeal
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
  const beforeCount = (await db.hotdeals.findAll()).length
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
  const afterCount = (await db.hotdeals.findAll()).length
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
    const allHotDeals = await db.hotdeals.findAll()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayHotDeals = allHotDeals.filter(deal => 
      new Date(deal.crawledAt) >= today
    )
    
    const sources: Record<string, number> = {}
    allHotDeals.forEach(deal => {
      sources[deal.source] = (sources[deal.source] || 0) + 1
    })
    
    return {
      totalHotDeals: allHotDeals.length,
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