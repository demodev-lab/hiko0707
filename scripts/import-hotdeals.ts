#!/usr/bin/env tsx

import { db } from '@/lib/db/database-service'
import fs from 'fs/promises'
import path from 'path'
import { HotdealCrawlerManager } from '@/lib/crawlers/new-crawler-manager'

async function importLatestHotdeals() {
  console.log('📥 최신 핫딜 JSON 파일 가져오기...')
  
  try {
    // Find latest JSON file in exports directory
    const exportDir = './exports'
    const files = await fs.readdir(exportDir)
    const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse()
    
    if (jsonFiles.length === 0) {
      console.error('❌ exports 폴더에 JSON 파일이 없습니다.')
      console.log('💡 먼저 크롤링을 실행하세요: pnpm crawl --save-json')
      process.exit(1)
    }
    
    const latestFile = jsonFiles[0]
    const filepath = path.join(exportDir, latestFile)
    
    console.log(`📄 파일 선택: ${latestFile}`)
    
    // Import using crawler manager
    const manager = new HotdealCrawlerManager()
    const hotdeals = await manager.importFromJson(filepath)
    
    console.log(`📊 ${hotdeals.length}개의 핫딜을 가져왔습니다.`)
    
    // Clear existing hotdeals
    console.log('🗑️  기존 핫딜 삭제 중...')
    const existingHotdeals = await db.hotdeals.findAll()
    for (const hotdeal of existingHotdeals) {
      await db.hotdeals.delete(hotdeal.id)
    }
    console.log(`✅ ${existingHotdeals.length}개의 기존 핫딜이 삭제되었습니다.`)
    
    // Save new hotdeals
    console.log('💾 새로운 핫딜 저장 중...')
    let savedCount = 0
    
    for (const hotdeal of hotdeals) {
      try {
        await db.hotdeals.create({
          ...hotdeal
        })
        savedCount++
      } catch (error) {
        console.error(`❌ 핫딜 저장 실패: ${hotdeal.title}`, error)
      }
    }
    
    console.log(`✅ ${savedCount}개의 핫딜이 저장되었습니다.`)
    
    // Show statistics
    const stats = await db.hotdeals.findAll()
    const categories = new Set(stats.map(h => h.category))
    const stores = new Set(stats.map(h => h.seller).filter(Boolean))
    
    console.log('\n📈 통계:')
    console.log(`- 총 핫딜 수: ${stats.length}`)
    console.log(`- 카테고리: ${categories.size}개`)
    console.log(`- 쇼핑몰: ${stores.size}개`)
    console.log(`- 무료배송: ${stats.filter(h => h.shipping?.isFree).length}개`)
    console.log(`- 인기 게시글: ${stats.filter(h => h.isPopular).length}개`)
    
  } catch (error) {
    console.error('❌ 가져오기 실패:', error)
    process.exit(1)
  }
}

// Run import
importLatestHotdeals()