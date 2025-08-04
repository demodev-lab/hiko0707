require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log('🔍 hot_deals 테이블 구조 확인 중...');
  
  // 먼저 전체 데이터를 확인
  const { data, error, count } = await supabase
    .from('hot_deals')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('❌ 데이터 조회 오류:', error);
    return;
  }
  
  console.log('📊 총 핫딜 개수:', count);
  
  if (data && data.length > 0) {
    console.log('📋 테이블 컬럼들:');
    const columns = Object.keys(data[0]);
    columns.forEach(col => console.log('  -', col));
    
    console.log('\n📋 최신 5개 핫딜:');
    data.forEach((deal, index) => {
      console.log(`${index + 1}. ${deal.title?.substring(0, 50)} (${deal.source}) - ${new Date(deal.created_at).toLocaleString('ko-KR')}`);
    });
  } else {
    console.log('📋 데이터가 없습니다.');
  }
}

checkTable().catch(console.error);