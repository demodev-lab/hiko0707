import dotenv from 'dotenv'
import path from 'path'

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { supabaseAdmin } from '../lib/supabase/client'

async function listSupabaseTables() {
  console.log('🔍 Supabase 테이블 목록 조회 시작...\n')
  
  const client = supabaseAdmin()
  
  if (!client) {
    console.error('❌ Supabase admin 클라이언트를 초기화할 수 없습니다.')
    return
  }

  try {
    // 시스템 카탈로그에서 테이블 목록 조회
    const { data: tables, error } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) {
      // 대체 방법: 직접 SQL 실행
      console.log('📊 시스템 카탈로그 접근 실패, SQL 직접 실행 시도...')
      
      const { data, error: sqlError } = await client.rpc('execute_sql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      })

      if (sqlError) {
        console.error('❌ SQL 실행 실패:', sqlError.message)
        
        // 최종 대체 방법: 알려진 테이블 직접 확인
        console.log('\n📋 알려진 테이블 직접 확인...\n')
        await checkKnownTables(client)
        return
      }

      console.log('✅ 테이블 목록 조회 성공\n')
      console.log('📋 Public 스키마의 테이블 목록:')
      data?.forEach((row: any) => {
        console.log(`   - ${row.table_name}`)
      })
    } else {
      console.log('✅ 테이블 목록 조회 성공\n')
      console.log('📋 Public 스키마의 테이블 목록:')
      tables?.forEach((table: any) => {
        console.log(`   - ${table.table_name}`)
      })
    }

  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err)
    console.log('\n📋 알려진 테이블 직접 확인...\n')
    await checkKnownTables(client)
  }
}

async function checkKnownTables(client: any) {
  // database.types.ts에서 확인한 테이블 목록
  const knownTables = [
    'admin_activity_logs',
    'comment_likes',
    'crawling_logs',
    'hot_deal_comments',
    'hot_deal_likes',
    'hot_deals',
    'hotdeal_translations',
    'notifications',
    'order_status_history',
    'payments',
    'proxy_purchase_addresses',
    'proxy_purchase_quotes',
    'proxy_purchases_request',
    'system_settings',
    'user_addresses',
    'user_favorite_hotdeals',
    'user_profiles',
    'users'
  ]

  console.log('📊 각 테이블 존재 여부 및 레코드 수 확인:\n')

  for (const tableName of knownTables) {
    try {
      const { count, error } = await client
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`   ❌ ${tableName}: 접근 불가 (${error.message})`)
      } else {
        console.log(`   ✅ ${tableName}: ${count || 0}개 레코드`)
      }
    } catch (err) {
      console.log(`   ❌ ${tableName}: 오류 발생`)
    }
  }

  // 외래키 관계 분석
  console.log('\n📊 주요 테이블 간 관계:')
  console.log('   - users → user_profiles (1:1)')
  console.log('   - users → user_addresses (1:1)')
  console.log('   - users → notifications (1:N)')
  console.log('   - users → hot_deal_comments (1:N)')
  console.log('   - users → proxy_purchases_request (1:N)')
  console.log('   - hot_deals → hot_deal_comments (1:N)')
  console.log('   - hot_deals → hot_deal_likes (1:N)')
  console.log('   - hot_deals → proxy_purchases_request (1:N)')
  console.log('   - proxy_purchases_request → payments (1:N)')
}

// 스크립트 실행
listSupabaseTables()