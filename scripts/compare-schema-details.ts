import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../database.types'

async function compareSchemaDetails() {
  console.log('🔍 Supabase 스키마 상세 비교 시작...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 각 테이블의 스키마 정보를 가져오는 쿼리
  const schemaQuery = `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `

  try {
    const { data: columns, error } = await supabase.rpc('query_schema', {
      query_text: schemaQuery
    }).single()

    if (error) {
      // RPC가 없을 경우 직접 쿼리 실행 시도
      console.log('📊 RPC 사용 불가, 각 테이블 구조 직접 확인...\n')
      
      // database.types.ts에 정의된 테이블 목록
      const tables = [
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

      // 각 테이블의 샘플 데이터를 가져와서 구조 확인
      for (const tableName of tables) {
        console.log(`\n📋 ${tableName} 테이블 구조 확인:`)
        
        try {
          // 테이블에서 한 행을 가져와서 컬럼 구조 확인
          const { data, error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)

          if (tableError) {
            console.log(`   ❌ 오류: ${tableError.message}`)
          } else {
            // 데이터가 없어도 쿼리가 성공하면 테이블 존재
            console.log(`   ✅ 테이블 존재 확인`)
            
            // 타입 정의에서 해당 테이블의 컬럼 정보 출력
            const typeInfo = getTableTypeInfo(tableName)
            if (typeInfo) {
              console.log(`   📝 타입 정의 컬럼:`)
              typeInfo.forEach(col => {
                console.log(`      - ${col}`)
              })
            }
          }
        } catch (err) {
          console.log(`   ❌ 테이블 접근 실패: ${err}`)
        }
      }
    } else {
      // 스키마 정보 분석
      console.log('📊 데이터베이스 스키마 정보:')
      console.log(columns)
    }
  } catch (error) {
    console.error('❌ 스키마 확인 중 오류:', error)
  }

  // 특정 테이블의 상세 구조 확인 (예: users 테이블)
  console.log('\n\n🔍 users 테이블 상세 확인:')
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (userError) {
      console.log('❌ users 테이블 조회 오류:', userError.message)
    } else {
      console.log('✅ users 테이블 구조:')
      if (userData && userData.length > 0) {
        console.log('   실제 컬럼:', Object.keys(userData[0]))
      } else {
        console.log('   (데이터가 없어 컬럼 구조를 직접 확인할 수 없음)')
      }
    }
  } catch (error) {
    console.log('❌ users 테이블 확인 실패:', error)
  }

  // hot_deals 테이블 상세 확인
  console.log('\n🔍 hot_deals 테이블 상세 확인:')
  try {
    const { data: hotDealData, error: hotDealError } = await supabase
      .from('hot_deals')
      .select('*')
      .limit(1)

    if (hotDealError) {
      console.log('❌ hot_deals 테이블 조회 오류:', hotDealError.message)
    } else {
      console.log('✅ hot_deals 테이블 구조:')
      if (hotDealData && hotDealData.length > 0) {
        console.log('   실제 컬럼:', Object.keys(hotDealData[0]))
        console.log('\n   샘플 데이터 타입:')
        Object.entries(hotDealData[0]).forEach(([key, value]) => {
          console.log(`      ${key}: ${typeof value} (${value === null ? 'null' : 'not null'})`)
        })
      }
    }
  } catch (error) {
    console.log('❌ hot_deals 테이블 확인 실패:', error)
  }
}

// 타입 정의에서 테이블 컬럼 정보 가져오기
function getTableTypeInfo(tableName: string): string[] | null {
  // database.types.ts의 타입 정의를 기반으로 컬럼 정보 반환
  const tableColumns: Record<string, string[]> = {
    'users': [
      'id: string (PK)',
      'clerk_user_id: string',
      'email: string',
      'name: string',
      'phone: string | null',
      'preferred_language: string',
      'role: string',
      'status: string',
      'created_at: string',
      'updated_at: string',
      'last_logined_at: string | null',
      'deleted_at: string | null'
    ],
    'hot_deals': [
      'id: string (PK)',
      'source_id: string',
      'source: string',
      'title: string',
      'description: string | null',
      'author_name: string',
      'category: string',
      'original_price: number',
      'sale_price: number',
      'discount_rate: number',
      'seller: string | null',
      'shopping_comment: string',
      'original_url: string',
      'image_url: string',
      'thumbnail_url: string',
      'is_free_shipping: boolean',
      'views: number',
      'like_count: number',
      'comment_count: number',
      'status: string',
      'end_date: string',
      'created_at: string',
      'updated_at: string',
      'deleted_at: string | null'
    ],
    // 필요에 따라 다른 테이블 추가
  }

  return tableColumns[tableName] || null
}

// 스크립트 실행
compareSchemaDetails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })