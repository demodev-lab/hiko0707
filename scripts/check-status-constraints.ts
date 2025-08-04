import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase/client'

async function checkStatusConstraints() {
  console.log('🔍 데이터베이스 status 제약 조건 확인...\\n')

  const client = supabaseAdmin()
  if (!client) {
    console.error('❌ Supabase 클라이언트 초기화 실패')
    return
  }

  // 1. 기존 proxy_purchases_request 데이터에서 사용 중인 status 값들 조회
  console.log('1️⃣ 기존 proxy_purchases_request 레코드의 status 값들 조회')
  const { data: existingOrders, error: ordersError } = await client
    .from('proxy_purchases_request')
    .select('status')
    .limit(50) // 최대 50개만 조회

  if (ordersError) {
    console.log('   기존 주문 없음 또는 조회 오류:', ordersError.message)
  } else {
    const statusValues = [...new Set(existingOrders?.map(order => order.status) || [])]
    console.log('   기존 주문의 status 값들:', statusValues)
  }

  // 2. 테스트용으로 다양한 status 값들로 insert 시도
  console.log('\\n2️⃣ 다양한 status 값으로 테스트 주문 생성 시도')
  
  const testStatuses = [
    'pending',
    'submitted', 
    'confirmed',
    'processing',
    'in_progress',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'refunded',
    'rejected'
  ]

  // 먼저 테스트용 사용자와 핫딜 생성
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
      title: '상태 테스트용 핫딜',
      source: 'ppomppu',
      source_id: `status-test-${Date.now()}`,
      author_name: '테스트',
      category: '기타',
      original_price: 10000,
      sale_price: 8000,
      discount_rate: 20,
      image_url: 'https://example.com/test.jpg',
      thumbnail_url: 'https://example.com/test-thumb.jpg',
      original_url: 'https://example.com/test',
      is_free_shipping: true,
      shopping_comment: '상태 테스트용',
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
  const failedStatuses: { status: string; error: string }[] = []

  for (const status of testStatuses) {
    try {
      const orderNumber = `TEST${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`
      
      const { data, error } = await client
        .from('proxy_purchases_request')
        .insert({
          user_id: testUser.id,
          hot_deal_id: testHotDeal.id,
          order_number: orderNumber,
          quantity: 1,
          status: status,
          product_info: { title: '테스트 상품', price: 8000 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        failedStatuses.push({ status, error: error.message })
        console.log(`   ❌ ${status}: ${error.message}`)
      } else {
        successfulStatuses.push(status)
        console.log(`   ✅ ${status}: 성공`)
        
        // 생성된 테스트 주문 삭제
        await client
          .from('proxy_purchases_request')
          .delete()
          .eq('id', data.id)
      }
    } catch (err) {
      failedStatuses.push({ status, error: String(err) })
      console.log(`   ❌ ${status}: ${String(err)}`)
    }
  }

  // 3. 결과 정리
  console.log('\\n📊 테스트 결과 요약:')
  console.log('─'.repeat(50))
  console.log('✅ 허용되는 status 값들:')
  successfulStatuses.forEach(status => console.log(`   • ${status}`))
  
  console.log('\\n❌ 허용되지 않는 status 값들:')
  failedStatuses.forEach(({ status, error }) => {
    console.log(`   • ${status}: ${error}`)
  })

  // 4. 테스트 데이터 정리
  console.log('\\n4️⃣ 테스트 데이터 정리')
  await client
    .from('hot_deals')
    .delete()
    .eq('id', testHotDeal.id)
  
  console.log('   테스트용 핫딜 삭제 완료')

  console.log('\\n✅ status 제약 조건 확인 완료!')
  
  return { successfulStatuses, failedStatuses }
}

// 스크립트 실행
checkStatusConstraints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('테스트 중 오류 발생:', error)
    process.exit(1)
  })