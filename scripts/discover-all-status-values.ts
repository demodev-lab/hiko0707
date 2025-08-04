import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase/client'

async function discoverAllStatusValues() {
  console.log('🔍 모든 가능한 status 값 발견 시도...\\n')

  const client = supabaseAdmin()
  if (!client) {
    console.error('❌ Supabase 클라이언트 초기화 실패')
    return
  }

  // 더 광범위한 테스트 값들
  const extendedTestStatuses = [
    // 기본 상태들
    'requested', 'received', 'approved', 'declined', 'waiting',
    'ready', 'preparing', 'shipped', 'delivered', 'cancelled',
    'failed', 'error', 'timeout', 'expired', 'active', 'inactive',
    
    // Buy-for-me 관련 상태들  
    'quote_requested', 'quote_provided', 'payment_pending', 'payment_completed',
    'purchase_started', 'purchase_completed', 'shipping_arranged',
    
    // 일반적인 주문 상태들
    'draft', 'new', 'open', 'closed', 'done', 'finished',
    
    // 짧은 상태들
    'ok', 'no', 'yes', 'on', 'off'
  ]

  // 테스트용 사용자와 핫딜 생성
  const { data: testUser, error: userError } = await client
    .from('users')
    .select('id')
    .limit(1)
    .single()

  if (userError || !testUser) {
    console.error('❌ 테스트용 사용자 조회 실패:', userError?.message)
    return
  }

  const { data: testHotDeal, error: hotDealError } = await client
    .from('hot_deals')
    .insert({
      title: '확장 상태 테스트용 핫딜',
      source: 'ppomppu',
      source_id: `extended-status-test-${Date.now()}`,
      author_name: '테스트',
      category: '기타',
      original_price: 10000,
      sale_price: 8000,
      discount_rate: 20,
      image_url: 'https://example.com/test.jpg',
      thumbnail_url: 'https://example.com/test-thumb.jpg',
      original_url: 'https://example.com/test',
      is_free_shipping: true,
      shopping_comment: '확장 상태 테스트용',
      status: 'active',
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (hotDealError || !testHotDeal) {
    console.error('❌ 테스트용 핫딜 생성 실패:', hotDealError?.message)
    return
  }

  console.log('   테스트용 핫딜 생성 완료:', testHotDeal.id)

  const successfulStatuses: string[] = []
  const testBatch = 10 // 한 번에 테스트할 개수

  console.log('\\n📝 확장 status 값 테스트 중...')
  
  for (let i = 0; i < extendedTestStatuses.length; i += testBatch) {
    const batchStatuses = extendedTestStatuses.slice(i, i + testBatch)
    console.log(`\\n배치 ${Math.floor(i/testBatch) + 1}: ${batchStatuses.join(', ')}`)
    
    for (const status of batchStatuses) {
      try {
        const orderNumber = `EXTENDED${Date.now()}${Math.floor(100 + Math.random() * 900)}`
        
        const { data, error } = await client
          .from('proxy_purchases_request')
          .insert({
            user_id: testUser.id,
            hot_deal_id: testHotDeal.id,
            order_number: orderNumber,
            quantity: 1,
            status: status,
            product_info: { title: '확장 테스트 상품', price: 8000 },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          console.log(`   ❌ ${status}`)
        } else {
          successfulStatuses.push(status)
          console.log(`   ✅ ${status}`)
          
          // 생성된 테스트 주문 삭제
          await client
            .from('proxy_purchases_request')
            .delete()
            .eq('id', data.id)
        }
      } catch (err) {
        console.log(`   ❌ ${status}`)
      }
    }
  }

  // 결과 정리
  console.log('\\n🎯 발견된 모든 허용 status 값들:')
  console.log('─'.repeat(50))
  if (successfulStatuses.length > 0) {
    successfulStatuses.forEach(status => console.log(`   ✅ ${status}`))
  } else {
    console.log('   추가로 허용되는 status 값 없음')
  }

  // 테스트 데이터 정리
  console.log('\\n4️⃣ 테스트 데이터 정리')
  await client
    .from('hot_deals')
    .delete()
    .eq('id', testHotDeal.id)
  
  console.log('   테스트용 핫딜 삭제 완료')

  console.log('\\n📊 최종 결과: 허용되는 모든 status 값들')
  const allSuccessfulStatuses = ['delivered', 'cancelled', ...successfulStatuses]
  const uniqueStatuses = [...new Set(allSuccessfulStatuses)]
  uniqueStatuses.forEach(status => console.log(`   • ${status}`))

  console.log(`\\n✅ 총 ${uniqueStatuses.length}개의 허용되는 status 값 발견!`)
  
  return uniqueStatuses
}

// 스크립트 실행
discoverAllStatusValues()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('테스트 중 오류 발생:', error)
    process.exit(1)
  })