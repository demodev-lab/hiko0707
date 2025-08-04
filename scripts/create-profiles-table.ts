import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

async function createProfilesTable() {
  console.log('🔨 Profiles 테이블 생성 시도 중...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Supabase Admin API를 사용하여 SQL 실행
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      query: `
        -- 프로필 테이블 생성
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          display_name TEXT,
          phone_number TEXT,
          avatar_url TEXT,
          language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'en', 'zh', 'vi', 'mn', 'th', 'ja', 'ru')),
          notification_enabled BOOLEAN DEFAULT true,
          notification_types TEXT[] DEFAULT ARRAY['order_status', 'hot_deal'],
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
        );

        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
      `
    })
  })

  if (!response.ok) {
    console.log('❌ API 방식으로는 테이블을 생성할 수 없습니다.')
    console.log('\n📝 대신 다음 방법을 사용하세요:')
    console.log('1. Supabase 대시보드에 접속: https://supabase.com/dashboard/project/vyvzihzjivcfhietrpnd/editor')
    console.log('2. SQL Editor에서 아래 파일의 내용을 실행:')
    console.log('   supabase/migrations/20250801_create_profiles_table_only.sql')
    console.log('\n또는 docs/create-profiles-table-guide.md 파일을 참고하세요.')
    return
  }

  console.log('✅ 테이블 생성 요청이 전송되었습니다.')
  
  // 테이블 생성 확인
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { error } = await supabase.from('profiles').select('count').limit(1)
  
  if (!error) {
    console.log('✅ profiles 테이블이 성공적으로 생성되었습니다!')
  } else {
    console.log('⚠️  테이블 생성을 확인할 수 없습니다. 수동으로 확인하세요.')
  }
}

// 스크립트 실행
createProfilesTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })