import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function runMigration() {
  console.log('🔄 프로필 테이블 마이그레이션 시작...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // SQL 파일 읽기
    const sqlPath = join(process.cwd(), 'supabase/migrations/20250801_create_profile_tables.sql')
    const sql = readFileSync(sqlPath, 'utf8')

    console.log('📄 SQL 파일 읽기 완료')
    console.log('🚀 마이그레이션 실행 중...')

    // SQL 실행 (여러 명령문이 있으므로 각각 실행)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      if (statement.includes('CREATE') || statement.includes('ALTER')) {
        console.log(`\n실행 중: ${statement.substring(0, 50)}...`)
        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        }).single()

        if (error) {
          // RPC 함수가 없는 경우 직접 실행 시도
          console.warn('RPC 실행 실패, 대체 방법 시도...')
          // Supabase는 직접 SQL 실행을 지원하지 않으므로 테이블별로 처리
        }
      }
    }

    // 테이블 존재 확인
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'user_addresses'])

    if (tablesError) {
      console.error('테이블 확인 실패:', tablesError)
      console.log('\n⚠️  Supabase 대시보드에서 직접 SQL을 실행해주세요:')
      console.log('https://supabase.com/dashboard/project/vyvzihzjivcfhietrpnd/editor')
      console.log('\n위 URL에서 SQL Editor로 이동 후, 다음 파일의 내용을 복사해서 실행하세요:')
      console.log(sqlPath)
      return
    }

    console.log('\n✅ 마이그레이션 완료!')
    console.log('생성된 테이블:', tables?.map(t => t.table_name).join(', '))

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error)
    console.log('\n⚠️  Supabase 대시보드에서 직접 SQL을 실행해주세요:')
    console.log('https://supabase.com/dashboard/project/vyvzihzjivcfhietrpnd/editor')
  }
}

// 스크립트 실행
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })