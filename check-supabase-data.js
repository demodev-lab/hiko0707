require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Supabase 데이터 확인 중...');
  
  const { data, error, count } = await supabase
    .from('hot_deals')
    .select('id, title, created_at, source', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('❌ 데이터 조회 오류:', error);
    return;
  }
  
  console.log('📊 총 핫딜 개수:', count);
  console.log('📋 최신 10개 핫딜:');
  console.log('ID | 제목 | 생성일 | 소스');
  console.log(''.padEnd(80, '-'));
  
  data?.forEach(deal => {
    const id = deal.id.substring(0, 8);
    const title = deal.title.substring(0, 30).padEnd(30);
    const createdAt = new Date(deal.created_at).toLocaleString('ko-KR');
    const source = deal.source;
    console.log(id + ' | ' + title + ' | ' + createdAt + ' | ' + source);
  });
}

checkData().catch(console.error);