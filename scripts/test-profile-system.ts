import 'dotenv/config'
import { SupabaseProfileService } from '../lib/services/supabase-profile-service'
import { createClient } from '@supabase/supabase-js'

async function testProfileSystem() {
  console.log('🧪 프로필 시스템 테스트 시작...\n')

  // 테스트용 사용자 확인
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 기존 사용자 조회
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, name')
    .limit(1)

  if (userError || !users || users.length === 0) {
    console.error('❌ 테스트할 사용자가 없습니다.')
    return
  }

  const testUser = users[0]
  console.log('👤 테스트 사용자:', testUser.email)
  console.log('   ID:', testUser.id)
  console.log('   이름:', testUser.name)
  console.log('')

  // 1. 프로필 조회 테스트
  console.log('1️⃣ 프로필 조회 테스트')
  let profile = await SupabaseProfileService.getProfile(testUser.id)
  
  if (!profile) {
    console.log('   프로필이 없습니다. 새로 생성합니다.')
    
    // 2. 프로필 생성 테스트
    console.log('\n2️⃣ 프로필 생성 테스트')
    profile = await SupabaseProfileService.createProfile(testUser.id, {
      display_name: testUser.name,
      phone_number: '010-1234-5678',
      language: 'ko',
      notification_enabled: true,
      notification_types: ['order_status', 'hot_deal']
    })
    
    if (profile) {
      console.log('   ✅ 프로필 생성 성공!')
      console.log('   표시 이름:', profile.display_name)
      console.log('   전화번호:', profile.phone_number)
      console.log('   언어:', profile.language)
      console.log('   알림 활성화:', profile.notification_enabled)
      console.log('   알림 유형:', profile.notification_types)
    } else {
      console.error('   ❌ 프로필 생성 실패')
      return
    }
  } else {
    console.log('   ✅ 기존 프로필 발견')
    console.log('   프로필 ID:', profile.id)
    console.log('   표시 이름:', profile.display_name)
    console.log('   언어:', profile.language)
  }

  // 3. 프로필 업데이트 테스트
  console.log('\n3️⃣ 프로필 업데이트 테스트')
  const updatedProfile = await SupabaseProfileService.updateProfile(testUser.id, {
    display_name: `${testUser.name} (업데이트됨)`,
    notification_types: ['order_status', 'hot_deal', 'comment']
  })
  
  if (updatedProfile) {
    console.log('   ✅ 프로필 업데이트 성공!')
    console.log('   새 표시 이름:', updatedProfile.display_name)
    console.log('   새 알림 유형:', updatedProfile.notification_types)
  } else {
    console.error('   ❌ 프로필 업데이트 실패')
  }

  // 4. 주소 추가 테스트
  console.log('\n4️⃣ 주소 추가 테스트')
  const newAddress = await SupabaseProfileService.addAddress(testUser.id, {
    name: '테스트 주소',
    phone: '010-1234-5678',
    post_code: '12345',
    address: '서울시 강남구 테스트로 123',
    address_detail: '101호',
    is_default: true,
    created_at: new Date().toISOString(),
    user_id: testUser.id
  })
  
  if (newAddress) {
    console.log('   ✅ 주소 추가 성공!')
    console.log('   주소 ID:', newAddress.id)
    console.log('   수령인:', newAddress.name)
    console.log('   주소:', newAddress.address, newAddress.address_detail)
    console.log('   기본 주소:', newAddress.is_default)
  } else {
    console.error('   ❌ 주소 추가 실패')
  }

  // 5. 주소 목록 조회 테스트
  console.log('\n5️⃣ 주소 목록 조회 테스트')
  const addresses = await SupabaseProfileService.getAddresses(testUser.id)
  
  console.log(`   총 ${addresses.length}개의 주소를 찾았습니다.`)
  addresses.forEach((addr, index) => {
    console.log(`   ${index + 1}. ${addr.name} - ${addr.address} ${addr.is_default ? '(기본)' : ''}`)
  })

  console.log('\n✅ 프로필 시스템 테스트 완료!')
}

// 스크립트 실행
testProfileSystem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('테스트 중 오류 발생:', error)
    process.exit(1)
  })