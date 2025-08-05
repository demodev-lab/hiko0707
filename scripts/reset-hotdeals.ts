#!/usr/bin/env tsx

import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'

async function resetHotdeals() {
  console.log('🗑️  핫딜 데이터 초기화 중...')
  
  try {
    // Get all hotdeals from Supabase
    const { data: allHotdeals, count } = await SupabaseHotDealService.getHotDeals({
      limit: 1000, // 충분히 큰 숫자로 모든 핫딜 가져오기
      status: undefined // 모든 상태의 핫딜 포함
    })
    
    console.log(`현재 ${count || allHotdeals.length}개의 핫딜이 있습니다.`)
    
    // Delete all hotdeals
    let deletedCount = 0
    for (const hotdeal of allHotdeals) {
      const success = await SupabaseHotDealService.deleteHotDeal(hotdeal.id)
      if (success) {
        deletedCount++
      }
    }
    
    console.log(`✅ ${deletedCount}개의 핫딜 데이터가 삭제되었습니다.`)
    
    // Verify deletion
    const { data: remainingHotdeals, count: remainingCount } = await SupabaseHotDealService.getHotDeals({
      limit: 1
    })
    console.log(`남은 핫딜 수: ${remainingCount || 0}`)
    
  } catch (error) {
    console.error('❌ 초기화 실패:', error)
    process.exit(1)
  }
}

// Run the reset
resetHotdeals()