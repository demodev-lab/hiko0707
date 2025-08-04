import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase/client'
import { SupabaseOrderService } from '../lib/services/supabase-order-service'
import { SupabasePaymentService } from '../lib/services/supabase-payment-service'
import { SupabaseAddressService } from '../lib/services/supabase-address-service'
import type { Database } from '../database.types'

type ProxyPurchaseInsert = Database['public']['Tables']['proxy_purchases_request']['Insert']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']
type UserAddressInsert = Database['public']['Tables']['user_addresses']['Insert']

async function testPhase2BuyForMe() {
  console.log('🧪 Phase 2: Buy-for-me 시스템 테스트 시작...\n')

  const client = supabaseAdmin()
  if (!client) {
    console.error('❌ Supabase 클라이언트 초기화 실패')
    return
  }

  console.log('✅ Supabase 클라이언트 초기화 성공')

  let allTestsPassed = true
  const testResults: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = []

  // 테스트 헬퍼 함수
  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    try {
      await testFn()
      testResults.push({ name: testName, status: 'PASS' })
      console.log(`✅ ${testName}`)
    } catch (error) {
      testResults.push({ 
        name: testName, 
        status: 'FAIL', 
        error: error instanceof Error ? error.message : String(error)
      })
      console.log(`❌ ${testName}: ${error instanceof Error ? error.message : String(error)}`)
      allTestsPassed = false
    }
  }

  // 테스트용 데이터 변수들
  let testUserId: string
  let testHotDealId: string
  let testOrderId: string
  let testPaymentId: string
  let testAddressId: string
  let createdNewUser = false

  // 1. 테스트 데이터 준비
  await runTest('테스트 데이터 준비', async () => {
    // 기존 사용자 조회 (테스트용)
    const { data: existingUsers, error: existingUserError } = await client
      .from('users')
      .select('id')
      .limit(1)

    if (existingUserError || !existingUsers || existingUsers.length === 0) {
      // 기존 사용자가 없으면 새로 생성 (올바른 enum 값 사용)
      const { data: testUser, error: userError } = await client
        .from('users')
        .insert({
          clerk_user_id: `test-clerk-${Date.now()}`,
          email: `test-${Date.now()}@example.com`,
          name: '테스트 사용자',
          role: 'user', // enum 값 수정
          status: 'active',
          preferred_language: 'ko'
        })
        .select()
        .single()

      if (userError || !testUser) {
        throw new Error(`테스트 사용자 생성 실패: ${userError?.message}`)
      }
      testUserId = testUser.id
      createdNewUser = true
    } else {
      // 기존 사용자 사용
      testUserId = existingUsers[0].id
    }

    // 테스트 핫딜 생성
    const { data: testHotDeal, error: hotDealError } = await client
      .from('hot_deals')
      .insert({
        title: '테스트 핫딜 상품',
        source: 'ppomppu',
        source_id: `test-${Date.now()}`,
        author_name: '테스트 작성자',
        category: '디지털/가전',
        original_price: 100000,
        sale_price: 80000,
        discount_rate: 20,
        image_url: 'https://example.com/test-image.jpg',
        thumbnail_url: 'https://example.com/test-thumb.jpg',
        original_url: 'https://example.com/test-product',
        is_free_shipping: true,
        shopping_comment: '테스트 상품입니다',
        status: 'active',
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (hotDealError || !testHotDeal) {
      throw new Error(`테스트 핫딜 생성 실패: ${hotDealError?.message}`)
    }
    testHotDealId = testHotDeal.id

    console.log(`   테스트 사용자 ID: ${testUserId}`)
    console.log(`   테스트 핫딜 ID: ${testHotDealId}`)
  })

  // 2. 주소 관리 서비스 테스트
  await runTest('SupabaseAddressService - 주소 생성', async () => {
    const addressData: Omit<UserAddressInsert, 'created_at' | 'updated_at'> = {
      user_id: testUserId,
      name: '홍길동',
      phone: '010-1234-5678',
      post_code: '12345',
      address: '서울시 강남구 테헤란로 123',
      address_detail: '테스트빌딩 456호',
      label: '집',
      is_default: true
    }

    const createdAddress = await SupabaseAddressService.createUserAddress(addressData)
    if (!createdAddress) {
      throw new Error('주소 생성 실패')
    }

    testAddressId = createdAddress.id
    console.log(`   생성된 주소 ID: ${testAddressId}`)
  })

  await runTest('SupabaseAddressService - 주소 목록 조회', async () => {
    const addresses = await SupabaseAddressService.getUserAddresses(testUserId)
    if (addresses.length === 0) {
      throw new Error('주소 목록이 비어있음')
    }

    const hasTestAddress = addresses.some(addr => addr.id === testAddressId)
    if (!hasTestAddress) {
      throw new Error('생성한 주소가 목록에 없음')
    }

    console.log(`   조회된 주소 개수: ${addresses.length}`)
  })

  await runTest('SupabaseAddressService - 기본 주소 조회', async () => {
    const defaultAddress = await SupabaseAddressService.getDefaultAddress(testUserId)
    if (!defaultAddress) {
      throw new Error('기본 주소 조회 실패')
    }

    if (defaultAddress.id !== testAddressId) {
      throw new Error('기본 주소가 일치하지 않음')
    }

    console.log(`   기본 주소 ID: ${defaultAddress.id}`)
  })

  // 3. 주문 관리 서비스 테스트
  await runTest('SupabaseOrderService - 주문 생성', async () => {
    const orderData: Omit<ProxyPurchaseInsert, 'created_at' | 'updated_at' | 'order_number'> = {
      user_id: testUserId,
      hot_deal_id: testHotDealId,
      quantity: 2,
      option: '블랙 색상',
      special_requests: '배송 전 연락 부탁드립니다',
      shipping_address_id: testAddressId,
      status: 'payment_pending',
      product_info: {
        title: '테스트 상품',
        price: 80000,
        image_url: 'https://example.com/test-image.jpg'
      }
    }

    const createdOrder = await SupabaseOrderService.createOrder(orderData)
    if (!createdOrder) {
      throw new Error('주문 생성 실패')
    }

    testOrderId = createdOrder.id
    console.log(`   생성된 주문 ID: ${testOrderId}`)
    console.log(`   주문 번호: ${createdOrder.order_number}`)
  })

  await runTest('SupabaseOrderService - 주문 목록 조회', async () => {
    const orders = await SupabaseOrderService.getOrdersByUser(testUserId)
    if (orders.length === 0) {
      throw new Error('주문 목록이 비어있음')
    }

    const hasTestOrder = orders.some(order => order.id === testOrderId)
    if (!hasTestOrder) {
      throw new Error('생성한 주문이 목록에 없음')
    }

    console.log(`   조회된 주문 개수: ${orders.length}`)
  })

  await runTest('SupabaseOrderService - 주문 상세 조회', async () => {
    const order = await SupabaseOrderService.getOrderById(testOrderId)
    if (!order) {
      throw new Error('주문 상세 조회 실패')
    }

    if (order.user_id !== testUserId) {
      throw new Error('주문 사용자 ID가 일치하지 않음')
    }

    console.log(`   주문 상태: ${order.status}`)
    console.log(`   주문 수량: ${order.quantity}`)
  })

  await runTest('SupabaseOrderService - 주문 상태 업데이트', async () => {
    const updatedOrder = await SupabaseOrderService.updateOrderStatus(
      testOrderId,
      'payment_completed',
      testUserId,
      '결제가 완료되었습니다'
    )

    if (!updatedOrder) {
      throw new Error('주문 상태 업데이트 실패')
    }

    if (updatedOrder.status !== 'payment_completed') {
      throw new Error('주문 상태가 업데이트되지 않음')
    }

    console.log(`   업데이트된 상태: ${updatedOrder.status}`)
  })

  // 4. 견적서 테스트
  await runTest('SupabaseOrderService - 견적서 생성', async () => {
    const quoteData = {
      request_id: testOrderId,
      product_cost: 160000, // 2개 × 80000
      domestic_shipping: 3000,
      international_shipping: 15000,
      fee: 14400, // 8% 수수료
      total_amount: 192400,
      payment_method: 'card',
      valid_until: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 후
      notes: '신중하게 검토해주세요'
    }

    const createdQuote = await SupabaseOrderService.createQuote(quoteData)
    if (!createdQuote) {
      throw new Error('견적서 생성 실패')
    }

    console.log(`   견적서 ID: ${createdQuote.id}`)
    console.log(`   총 금액: ${createdQuote.total_amount}원`)
  })

  // 5. 결제 관리 서비스 테스트
  await runTest('SupabasePaymentService - 결제 생성', async () => {
    const paymentData: Omit<PaymentInsert, 'created_at' | 'updated_at'> = {
      user_id: testUserId,
      request_id: testOrderId,
      amount: 192400,
      currency: 'KRW',
      payment_method: 'card',
      payment_gateway: 'toss',
      status: 'pending'
    }

    const createdPayment = await SupabasePaymentService.createPayment(paymentData)
    if (!createdPayment) {
      throw new Error('결제 생성 실패')
    }

    testPaymentId = createdPayment.id
    console.log(`   생성된 결제 ID: ${testPaymentId}`)
    console.log(`   결제 금액: ${createdPayment.amount}원`)
  })

  await runTest('SupabasePaymentService - 결제 상태 업데이트', async () => {
    const updatedPayment = await SupabasePaymentService.updatePaymentStatus(
      testPaymentId,
      'completed',
      'toss_payment_123456',
      new Date().toISOString()
    )

    if (!updatedPayment) {
      throw new Error('결제 상태 업데이트 실패')
    }

    if (updatedPayment.status !== 'completed') {
      throw new Error('결제 상태가 업데이트되지 않음')
    }

    console.log(`   업데이트된 상태: ${updatedPayment.status}`)
    console.log(`   외부 결제 ID: ${updatedPayment.external_payment_id}`)
  })

  await runTest('SupabasePaymentService - 사용자별 결제 목록 조회', async () => {
    const payments = await SupabasePaymentService.getPaymentsByUser(testUserId)
    if (payments.length === 0) {
      throw new Error('결제 목록이 비어있음')
    }

    const hasTestPayment = payments.some(payment => payment.id === testPaymentId)
    if (!hasTestPayment) {
      throw new Error('생성한 결제가 목록에 없음')
    }

    console.log(`   조회된 결제 개수: ${payments.length}`)
  })

  // 6. 통계 테스트
  await runTest('SupabaseOrderService - 주문 통계 조회', async () => {
    const stats = await SupabaseOrderService.getOrderStats(testUserId)
    if (!stats) {
      throw new Error('주문 통계 조회 실패')
    }

    if (stats.total === 0) {
      throw new Error('주문 통계가 비어있음')
    }

    console.log(`   총 주문: ${stats.total}개`)
    console.log(`   진행중: ${stats.processing}개`)
  })

  await runTest('SupabasePaymentService - 결제 통계 조회', async () => {
    const stats = await SupabasePaymentService.getPaymentStats({ user_id: testUserId })
    if (!stats) {
      throw new Error('결제 통계 조회 실패')
    }

    if (stats.total_count === 0) {
      throw new Error('결제 통계가 비어있음')
    }

    console.log(`   총 결제: ${stats.total_count}건`)
    console.log(`   총 금액: ${stats.total_amount}원`)
    console.log(`   완료된 결제: ${stats.completed_count}건`)
  })

  // 7. 주소 검증 테스트
  await runTest('SupabaseAddressService - 주소 검증', async () => {
    const validAddress = {
      name: '김테스트',
      phone: '010-9876-5432',
      address: '부산시 해운대구 센텀동로 123',
      post_code: '48058'
    }

    const validation = SupabaseAddressService.validateAddress(validAddress)
    if (!validation.isValid) {
      throw new Error(`주소 검증 실패: ${validation.errors.join(', ')}`)
    }

    console.log('   유효한 주소 검증 통과')

    // 잘못된 주소 테스트
    const invalidAddress = {
      name: 'A', // 너무 짧음
      phone: '123', // 잘못된 형식
      address: '짧음', // 너무 짧음
      post_code: '123' // 잘못된 형식
    }

    const invalidValidation = SupabaseAddressService.validateAddress(invalidAddress)
    if (invalidValidation.isValid) {
      throw new Error('잘못된 주소가 유효하다고 판단됨')
    }

    console.log(`   잘못된 주소 검증 실패 (정상): ${invalidValidation.errors.length}개 오류`)
  })

  // 8. 테스트 데이터 정리
  await runTest('테스트 데이터 정리', async () => {
    // 결제 삭제
    if (testPaymentId) {
      const { error: paymentDeleteError } = await client
        .from('payments')
        .delete()
        .eq('id', testPaymentId)
      
      if (paymentDeleteError) {
        console.warn('결제 데이터 삭제 실패:', paymentDeleteError.message)
      }
    }

    // 견적서 삭제
    const { error: quoteDeleteError } = await client
      .from('proxy_purchase_quotes')
      .delete()
      .eq('request_id', testOrderId)
    
    if (quoteDeleteError) {
      console.warn('견적서 데이터 삭제 실패:', quoteDeleteError.message)
    }

    // 상태 히스토리 삭제
    const { error: historyDeleteError } = await client
      .from('order_status_history')
      .delete()
      .eq('request_id', testOrderId)
    
    if (historyDeleteError) {
      console.warn('상태 히스토리 삭제 실패:', historyDeleteError.message)
    }

    // 주문 삭제
    if (testOrderId) {
      const { error: orderDeleteError } = await client
        .from('proxy_purchases_request')
        .delete()
        .eq('id', testOrderId)
      
      if (orderDeleteError) {
        console.warn('주문 데이터 삭제 실패:', orderDeleteError.message)
      }
    }

    // 주소 삭제
    if (testAddressId) {
      const { error: addressDeleteError } = await client
        .from('user_addresses')
        .delete()
        .eq('id', testAddressId)
      
      if (addressDeleteError) {
        console.warn('주소 데이터 삭제 실패:', addressDeleteError.message)
      }
    }

    // 핫딜 삭제
    if (testHotDealId) {
      const { error: hotDealDeleteError } = await client
        .from('hot_deals')
        .delete()
        .eq('id', testHotDealId)
      
      if (hotDealDeleteError) {
        console.warn('핫딜 데이터 삭제 실패:', hotDealDeleteError.message)
      }
    }

    // 테스트에서 생성한 사용자만 삭제 (기존 사용자 보호)
    if (testUserId && createdNewUser) {
      const { error: userDeleteError } = await client
        .from('users')
        .delete()
        .eq('id', testUserId)
      
      if (userDeleteError) {
        console.warn('사용자 데이터 삭제 실패:', userDeleteError.message)
      }
    }

    console.log('   테스트 데이터 정리 완료')
  })

  // 결과 출력
  console.log('\n📊 Phase 2 테스트 결과 요약:')
  console.log('─'.repeat(50))
  
  const passedTests = testResults.filter(r => r.status === 'PASS').length
  const failedTests = testResults.filter(r => r.status === 'FAIL').length
  
  console.log(`✅ 통과: ${passedTests}개`)
  console.log(`❌ 실패: ${failedTests}개`)
  console.log(`📈 성공률: ${Math.round((passedTests / testResults.length) * 100)}%`)

  if (failedTests > 0) {
    console.log('\n🚨 실패한 테스트 상세:')
    testResults
      .filter(r => r.status === 'FAIL')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`)
      })
  }

  console.log('\n' + (allTestsPassed ? '✅ Phase 2: Buy-for-me 시스템 테스트 완료!' : '⚠️  일부 테스트 실패'))
  
  return allTestsPassed
}

// 스크립트 실행
testPhase2BuyForMe()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Phase 2 테스트 중 오류 발생:', error)
    process.exit(1)
  })