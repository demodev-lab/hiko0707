import 'dotenv/config'
import { SupabaseUserService } from '../lib/services/supabase-user-service'
import { SupabaseNotificationService } from '../lib/services/supabase-notification-service'
import { supabaseAdmin } from '../lib/supabase/client'

async function testActualProfileSystem() {
  console.log('🧪 실제 프로필 시스템 테스트 시작...\n')

  const client = supabaseAdmin()
  if (!client) {
    console.error('❌ Supabase 클라이언트 초기화 실패')
    return
  }

  // 기존 사용자 조회 (users 테이블)
  const { data: users, error: userError } = await client
    .from('users')
    .select('id, clerk_user_id, email, name, phone, preferred_language')
    .limit(1)

  if (userError || !users || users.length === 0) {
    console.error('❌ 테스트할 사용자가 없습니다:', userError)
    return
  }

  const testUser = users[0]
  console.log('👤 테스트 사용자:', testUser.email)
  console.log('   ID:', testUser.id)
  console.log('   Clerk ID:', testUser.clerk_user_id)
  console.log('   이름:', testUser.name)
  console.log('   전화번호:', testUser.phone)
  console.log('   선호 언어:', testUser.preferred_language)
  console.log('')

  // 1. 사용자 정보 조회 테스트 (Clerk ID로)
  console.log('1️⃣ Clerk ID로 사용자 조회 테스트')
  const userByClerkId = await SupabaseUserService.getUserByClerkId(testUser.clerk_user_id)
  
  if (userByClerkId) {
    console.log('   ✅ 사용자 조회 성공!')
    console.log('   이름:', userByClerkId.name)
    console.log('   이메일:', userByClerkId.email)
    console.log('   전화번호:', userByClerkId.phone)
    console.log('   선호 언어:', userByClerkId.preferred_language)
  } else {
    console.error('   ❌ 사용자 조회 실패')
    return
  }

  // 2. 사용자 정보 업데이트 테스트
  console.log('\n2️⃣ 사용자 정보 업데이트 테스트')
  const updatedUser = await SupabaseUserService.updateUser(testUser.id, {
    name: `${testUser.name} (테스트 업데이트)`,
    phone: '010-9999-8888',
    preferred_language: 'en'
  })
  
  if (updatedUser) {
    console.log('   ✅ 사용자 정보 업데이트 성공!')
    console.log('   새 이름:', updatedUser.name)
    console.log('   새 전화번호:', updatedUser.phone)
    console.log('   새 선호 언어:', updatedUser.preferred_language)
  } else {
    console.error('   ❌ 사용자 정보 업데이트 실패')
  }

  // 3. user_profiles 테이블 확인
  console.log('\n3️⃣ user_profiles 테이블 확인')
  const { data: userProfiles, error: profileError } = await client
    .from('user_profiles')
    .select('*')
    .eq('user_id', testUser.id)

  if (profileError) {
    console.error('   ❌ user_profiles 조회 실패:', profileError)
  } else if (userProfiles && userProfiles.length > 0) {
    console.log('   ✅ user_profiles 발견:', userProfiles[0])
  } else {
    console.log('   ℹ️  user_profiles 데이터 없음 (정상)')
  }

  // 4. 알림 테스트
  console.log('\n4️⃣ 알림 시스템 테스트')
  const testNotification = await SupabaseNotificationService.createNotification(
    testUser.id,
    '테스트 알림',
    '프로필 시스템 테스트 중입니다.'
  )

  if (testNotification) {
    console.log('   ✅ 알림 생성 성공!')
    console.log('   알림 ID:', testNotification.id)
    console.log('   제목:', testNotification.title)
    console.log('   내용:', testNotification.content)
  } else {
    console.error('   ❌ 알림 생성 실패')
  }

  // 5. 알림 목록 조회
  console.log('\n5️⃣ 알림 목록 조회 테스트')
  const notifications = await SupabaseNotificationService.getUserNotifications(testUser.id)
  
  console.log(`   총 ${notifications.length}개의 알림을 찾았습니다.`)
  notifications.slice(0, 3).forEach((notif, index) => {
    console.log(`   ${index + 1}. ${notif.title} - ${notif.is_read ? '읽음' : '읽지 않음'}`)
  })

  // 6. 정리 - 테스트 데이터 원복
  console.log('\n6️⃣ 테스트 데이터 정리')
  const restoredUser = await SupabaseUserService.updateUser(testUser.id, {
    name: testUser.name,
    phone: testUser.phone,
    preferred_language: testUser.preferred_language
  })

  if (restoredUser) {
    console.log('   ✅ 사용자 데이터 원복 완료')
  }

  // 테스트 알림 삭제
  if (testNotification) {
    const deleted = await SupabaseNotificationService.deleteNotification(testNotification.id)
    if (deleted) {
      console.log('   ✅ 테스트 알림 삭제 완료')
    }
  }

  console.log('\n✅ 실제 프로필 시스템 테스트 완료!')
}

// 스크립트 실행
testActualProfileSystem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('테스트 중 오류 발생:', error)
    process.exit(1)
  })