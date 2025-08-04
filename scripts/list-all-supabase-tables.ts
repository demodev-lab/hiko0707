import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listAllTables() {
  console.log('=== 전체 Supabase 테이블 목록 ===\n')
  
  try {
    // 알려진 모든 테이블 목록
    const knownTables = [
      // 사용자 관련
      'profiles',
      'users',
      'addresses',
      
      // 커뮤니티 관련
      'posts',
      'comments',
      'likes',
      'favorites',
      
      // 핫딜 관련
      'hotdeals',
      'hotdeal_crawl_logs',
      
      // 주문 관련
      'orders',
      'order_items',
      'payments',
      
      // 시스템 관련
      'notifications',
      'system_settings',
      'admin_logs',
      
      // 기타
      'images',
      'categories',
      'tags'
    ]
    
    let foundTables = 0
    let missingTables = 0
    
    console.log('📊 테이블 확인 중...\n')
    
    for (const tableName of knownTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`✅ ${tableName.padEnd(20)} - 존재함 (레코드 수: ${count || 0})`)
          foundTables++
        } else if (error.code === '42P01') {
          console.log(`❌ ${tableName.padEnd(20)} - 존재하지 않음`)
          missingTables++
        } else {
          console.log(`⚠️  ${tableName.padEnd(20)} - 접근 오류: ${error.message}`)
        }
      } catch (err) {
        console.log(`❌ ${tableName.padEnd(20)} - 예외 발생:`, err)
      }
    }
    
    console.log('\n📊 요약:')
    console.log(`✅ 발견된 테이블: ${foundTables}개`)
    console.log(`❌ 누락된 테이블: ${missingTables}개`)
    console.log(`📋 전체 확인한 테이블: ${knownTables.length}개`)
    
    // 추가로 시스템 테이블 확인
    console.log('\n🔍 추가 시스템 테이블 확인...')
    
    const systemTables = [
      'auth.users',
      'auth.refresh_tokens',
      'storage.buckets',
      'storage.objects'
    ]
    
    for (const table of systemTables) {
      const [schema, tableName] = table.split('.')
      
      if (schema === 'auth' && tableName === 'users') {
        try {
          // auth.users는 특별한 방식으로 접근
          const { data, error } = await supabase.auth.admin.listUsers()
          if (!error) {
            console.log(`✅ ${table} - 접근 가능 (사용자 수: ${data?.users?.length || 0})`)
          } else {
            console.log(`⚠️  ${table} - ${error.message}`)
          }
        } catch {
          console.log(`ℹ️  ${table} - Admin API 필요`)
        }
      } else if (schema === 'storage') {
        if (tableName === 'buckets') {
          const { data, error } = await supabase.storage.listBuckets()
          if (!error) {
            console.log(`✅ ${table} - 접근 가능 (버킷 수: ${data?.length || 0})`)
          }
        }
      }
    }
    
  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err)
  }
}

listAllTables()