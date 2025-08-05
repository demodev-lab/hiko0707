#!/usr/bin/env tsx

import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'
import fs from 'fs/promises'
import path from 'path'
import { CrawlerManager } from '@/lib/crawlers/crawler-manager'

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
    const manager = new CrawlerManager()
    const hotdeals = await manager.importFromJson(filepath)
    
    console.log(`📊 ${hotdeals.length}개의 핫딜을 가져왔습니다.`)
    
    // Clear existing hotdeals in Supabase
    console.log('🗑️  기존 핫딜 삭제 중...')
    const { data: existingHotdeals, count } = await SupabaseHotDealService.getHotDeals({
      limit: 1000,
      status: undefined
    })
    
    let deletedCount = 0
    for (const hotdeal of existingHotdeals) {
      const success = await SupabaseHotDealService.deleteHotDeal(hotdeal.id)
      if (success) {
        deletedCount++
      }
    }
    console.log(`✅ ${deletedCount}개의 기존 핫딜이 삭제되었습니다.`)
    
    // Save new hotdeals to Supabase
    console.log('💾 새로운 핫딜 저장 중...')
    let savedCount = 0
    let skippedCount = 0
    
    for (const hotdeal of hotdeals) {
      try {
        // 중복 확인
        const isDuplicate = await SupabaseHotDealService.checkDuplicate(
          hotdeal.source,
          hotdeal.source_id
        )
        
        if (isDuplicate) {
          skippedCount++
        } else {
          // SupabaseHotDealService의 importFromCrawler 사용
          const result = await SupabaseHotDealService.importFromCrawler(
            hotdeal.source,
            [{
              title: hotdeal.title,
              description: hotdeal.shopping_comment,
              originalPrice: hotdeal.sale_price,
              salePrice: hotdeal.sale_price,
              thumbnailUrl: hotdeal.image_url,
              imageUrl: hotdeal.image_url,
              originalUrl: hotdeal.original_url,
              url: hotdeal.original_url,
              category: hotdeal.category,
              sourceId: hotdeal.source_id,
              shopName: hotdeal.seller,
              isFreeShipping: hotdeal.is_free_shipping || false,
              authorName: hotdeal.author_name || 'Unknown',
              shoppingComment: '',
              postDate: hotdeal.created_at || new Date().toISOString()
            }]
          )
          
          if (result.added > 0) {
            savedCount++
          }
        }
      } catch (error) {
        console.error(`❌ 핫딜 저장 실패: ${hotdeal.title}`, error)
      }
    }
    
    console.log(`✅ ${savedCount}개의 핫딜이 저장되었습니다. (${skippedCount}개 중복 건너뜀)`)
    
    // Show statistics from Supabase
    const { data: allHotdeals, count: totalCount } = await SupabaseHotDealService.getHotDeals({
      limit: 1000,
      status: undefined
    })
    
    const categories = new Set(allHotdeals.map(h => h.category))
    const stores = new Set(allHotdeals.map(h => h.seller).filter(Boolean))
    
    console.log('\n📈 통계:')
    console.log(`- 총 핫딜 수: ${totalCount || allHotdeals.length}`)
    console.log(`- 카테고리: ${categories.size}개`)
    console.log(`- 쇼핑몰: ${stores.size}개`)
    console.log(`- 무료배송: ${allHotdeals.filter(h => h.is_free_shipping).length}개`)
    console.log(`- 전체 게시글: ${allHotdeals.length}개`)
    
  } catch (error) {
    console.error('❌ 가져오기 실패:', error)
    process.exit(1)
  }
}

// Run import
importLatestHotdeals()