require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTodayDeals() {
  console.log('🔍 오늘 추가된 모든 핫딜 확인...\n');
  
  // 오늘 날짜 설정
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  
  // 오늘 추가된 모든 데이터 확인
  const { data: todayData, error: todayError } = await supabase
    .from('hot_deals')
    .select('*')
    .eq('status', 'active')
    .gte('created_at', todayStart)
    .order('created_at', { ascending: false });
    
  if (todayError) {
    console.error('❌ 오늘 데이터 조회 오류:', todayError);
    return;
  }
  
  console.log(`📊 오늘 추가된 핫딜 총 개수: ${todayData.length}개\n`);
  
  // 전체 데이터 확인
  const { count: totalCount } = await supabase
    .from('hot_deals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
    
  console.log(`📈 전체 활성 핫딜 개수: ${totalCount}개\n`);
  
  // 오늘 데이터 상세 정보
  console.log('📋 오늘 추가된 핫딜 상세:');
  console.log('번호 | 제목 | 조회수 | 좋아요 | 생성시간');
  console.log(''.padEnd(100, '-'));
  
  todayData.forEach((deal, index) => {
    const title = deal.title.substring(0, 40).padEnd(40);
    const views = (deal.views || 0).toString().padStart(5);
    const likes = (deal.like_count || 0).toString().padStart(5);
    const createdAt = new Date(deal.created_at).toLocaleTimeString('ko-KR');
    
    console.log(`${(index + 1).toString().padStart(2)}. ${title} | ${views} | ${likes} | ${createdAt}`);
  });
  
  // getPopularHotDeals 로직 시뮬레이션
  console.log('\n🔍 getPopularHotDeals 로직 시뮬레이션:\n');
  
  const limit = 10;
  const todayLimit = Math.floor(limit / 2);
  
  console.log(`- 전체 limit: ${limit}`);
  console.log(`- 오늘 데이터 limit: ${todayLimit}`);
  console.log(`- 오늘 데이터 가져온 개수: ${Math.min(todayData.length, Math.max(limit, 20))}`);
  console.log(`- 실제 사용할 오늘 데이터: ${Math.min(todayData.length, todayLimit)}개`);
  
  // 인기 데이터도 확인
  const { data: popularData, error: popularError } = await supabase
    .from('hot_deals')
    .select('*')
    .eq('status', 'active')
    .order('views', { ascending: false })
    .order('like_count', { ascending: false })
    .limit(limit);
    
  if (!popularError) {
    console.log(`\n📊 인기 핫딜 (조회수 기준):`);
    console.log('번호 | 제목 | 조회수 | 좋아요');
    console.log(''.padEnd(80, '-'));
    
    popularData.slice(0, 5).forEach((deal, index) => {
      const title = deal.title.substring(0, 40).padEnd(40);
      const views = (deal.views || 0).toString().padStart(5);
      const likes = (deal.like_count || 0).toString().padStart(5);
      
      console.log(`${(index + 1).toString().padStart(2)}. ${title} | ${views} | ${likes}`);
    });
  }
}

checkTodayDeals().catch(console.error);