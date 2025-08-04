import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

async function checkTables() {
  console.log('🔍 Supabase 테이블 확인 중...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 프로필 테이블 확인
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.log('❌ profiles 테이블: 존재하지 않음')
      console.log('   오류:', error.message)
    } else {
      console.log('✅ profiles 테이블: 존재함')
    }
  } catch (error) {
    console.log('❌ profiles 테이블 확인 실패:', error)
  }

  // 주소 테이블 확인
  try {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('count')
      .limit(1)

    if (error) {
      console.log('❌ user_addresses 테이블: 존재하지 않음')
      console.log('   오류:', error.message)
    } else {
      console.log('✅ user_addresses 테이블: 존재함')
    }
  } catch (error) {
    console.log('❌ user_addresses 테이블 확인 실패:', error)
  }

  console.log('\n💡 테이블이 존재하지 않는 경우:')
  console.log('1. Supabase 대시보드로 이동: https://supabase.com/dashboard/project/vyvzihzjivcfhietrpnd/editor')
  console.log('2. SQL Editor에서 다음 파일의 내용을 실행: supabase/migrations/20250801_create_profile_tables.sql')
}

// 스크립트 실행
checkTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })