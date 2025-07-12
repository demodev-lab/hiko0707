#!/usr/bin/env tsx

import { db } from '@/lib/db/database-service'

async function resetHotdeals() {
  console.log('🗑️  핫딜 데이터 초기화 중...')
  
  try {
    // Get all hotdeals
    const allHotdeals = await db.hotdeals.findAll()
    console.log(`현재 ${allHotdeals.length}개의 핫딜이 있습니다.`)
    
    // Delete all hotdeals
    for (const hotdeal of allHotdeals) {
      await db.hotdeals.delete(hotdeal.id)
    }
    
    console.log('✅ 모든 핫딜 데이터가 삭제되었습니다.')
    
    // Verify deletion
    const remainingHotdeals = await db.hotdeals.findAll()
    console.log(`남은 핫딜 수: ${remainingHotdeals.length}`)
    
  } catch (error) {
    console.error('❌ 초기화 실패:', error)
    process.exit(1)
  }
}

// Run the reset
resetHotdeals()