#!/usr/bin/env node

import { db } from '../lib/db/database-service'
import { SupabaseHotDealRepository } from '../lib/db/supabase/repositories/hotdeal-repository'
import { config } from 'dotenv'

// 환경변수 로드
config({ path: '.env.local' })

async function migrateHotDealsToSupabase() {
  console.log('🚀 Starting migration to Supabase...')
  
  const supabaseRepo = new SupabaseHotDealRepository()
  
  try {
    // LocalStorage에서 모든 핫딜 가져오기
    const hotdeals = await db.hotdeals.findAll()
    console.log(`📊 Found ${hotdeals.length} hotdeals to migrate`)
    
    let migrated = 0
    let skipped = 0
    let failed = 0
    
    for (const hotdeal of hotdeals) {
      try {
        // 중복 확인
        const existing = await supabaseRepo.findBySourceAndPostId(
          hotdeal.source,
          hotdeal.source_id
        )
        
        if (existing) {
          console.log(`⏭️  Skipping duplicate: ${hotdeal.source} - ${hotdeal.source_id}`)
          skipped++
        } else {
          // Supabase에 저장
          const result = await supabaseRepo.create(hotdeal)
          if (result) {
            migrated++
            if (migrated % 10 === 0) {
              console.log(`✅ Migrated ${migrated} hotdeals...`)
            }
          } else {
            failed++
            console.error(`❌ Failed to migrate: ${hotdeal.source} - ${hotdeal.source_id}`)
          }
        }
      } catch (error) {
        failed++
        console.error(`❌ Error migrating hotdeal:`, error)
      }
    }
    
    console.log('\n📊 Migration Summary:')
    console.log(`✅ Successfully migrated: ${migrated}`)
    console.log(`⏭️  Skipped (duplicates): ${skipped}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📊 Total processed: ${hotdeals.length}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// 실행
if (require.main === module) {
  migrateHotDealsToSupabase()
    .then(() => {
      console.log('✅ Migration completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration error:', error)
      process.exit(1)
    })
}