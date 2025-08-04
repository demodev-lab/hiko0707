import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

async function testProfileUI() {
  console.log('🧪 프로필 UI 관련 테스트\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. 환경 변수 확인
  console.log('1️⃣ 환경 변수 확인')
  console.log('   NEXT_PUBLIC_USE_SUPABASE:', process.env.NEXT_PUBLIC_USE_SUPABASE)
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음')
  console.log('')

  // 2. 사용자 확인
  console.log('2️⃣ 테스트 사용자 확인')
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .limit(5)

  if (userError) {
    console.error('   ❌ 사용자 조회 실패:', userError.message)
  } else if (users && users.length > 0) {
    console.log(`   ✅ ${users.length}명의 사용자 발견:`)
    users.forEach(user => {
      console.log(`      - ${user.email} (${user.name}) [${user.role}]`)
    })
  } else {
    console.log('   ⚠️  사용자가 없습니다.')
  }
  console.log('')

  // 3. 주소 테이블 확인
  console.log('3️⃣ 주소 시스템 확인')
  const { data: addresses, error: addressError } = await supabase
    .from('user_addresses')
    .select('*')
    .limit(5)

  if (addressError) {
    console.error('   ❌ 주소 조회 실패:', addressError.message)
  } else {
    console.log(`   ✅ user_addresses 테이블 정상 (${addresses?.length || 0}개 주소)`)
  }
  console.log('')

  // 4. UI 테스트 안내
  console.log('4️⃣ UI 테스트 방법')
  console.log('   1. 개발 서버 실행: pnpm dev')
  console.log('   2. 브라우저에서 http://localhost:3000 접속')
  console.log('   3. 로그인 후 마이페이지 이동')
  console.log('   4. "프로필 설정" 탭 클릭')
  console.log('   5. 프로필 정보 입력 및 저장 시도')
  console.log('')

  // 5. 예상되는 동작
  console.log('5️⃣ 예상되는 동작')
  console.log('   - profiles 테이블이 없으므로 "프로필 생성 실패" 메시지가 나타날 것')
  console.log('   - 하지만 UI는 정상적으로 표시되어야 함')
  console.log('   - 에러가 적절히 처리되어 앱이 중단되지 않아야 함')
  console.log('')

  console.log('💡 profiles 테이블 생성 후 다시 테스트하세요.')
  console.log('   참고: docs/create-profiles-table-guide.md')
}

// 스크립트 실행
testProfileUI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('테스트 중 오류 발생:', error)
    process.exit(1)
  })