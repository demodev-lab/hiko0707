import dotenv from 'dotenv'
import path from 'path'

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Supabase 클라이언트 직접 테스트
import { createClient } from '@supabase/supabase-js'

async function testSupabaseHook() {
  console.log('🔍 Supabase 훅 테스트 시작...\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다.')
    return
  }
  
  console.log('✅ 환경변수 확인됨')
  console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`)
  console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '설정됨' : '없음'}`)
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // hot_deals 테이블에서 최신 5개 데이터 조회
    console.log('\n📊 최신 핫딜 5개 조회...')
    const { data, error } = await supabase
      .from('hot_deals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('❌ 조회 실패:', error.message)
      return
    }
    
    console.log(`\n✅ ${data?.length || 0}개의 핫딜을 조회했습니다.`)
    
    if (data && data.length > 0) {
      console.log('\n최신 핫딜:')
      data.forEach((deal, index) => {
        console.log(`\n${index + 1}. ${deal.title}`)
        console.log(`   - 소스: ${deal.source}`)
        console.log(`   - 가격: ${deal.sale_price?.toLocaleString() || '가격정보 없음'}원`)
        console.log(`   - 조회수: ${deal.views}`)
        console.log(`   - 날짜: ${new Date(deal.created_at).toLocaleString('ko-KR')}`)
      })
    }
    
    // 각 소스별 개수 확인
    console.log('\n📊 소스별 핫딜 개수...')
    const sources = ['ppomppu', 'ruliweb', 'clien', 'quasarzone', 'coolenjoy', 'itcm']
    
    for (const source of sources) {
      const { count } = await supabase
        .from('hot_deals')
        .select('*', { count: 'exact', head: true })
        .eq('source', source)
      
      console.log(`- ${source}: ${count || 0}개`)
    }
    
  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err)
  }
}

// 스크립트 실행
testSupabaseHook()