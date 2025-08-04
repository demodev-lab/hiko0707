require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentData() {
  console.log('🔍 최신 데이터와 이미지 확인...');
  
  // 오늘 추가된 최신 5개 데이터 확인
  const { data, error } = await supabase
    .from('hot_deals')
    .select('id, title, sale_price, image_url, thumbnail_url, source, created_at')
    .eq('status', 'active')
    .gte('created_at', '2025-08-03T00:00:00.000Z') // 오늘 데이터만
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('❌ 데이터 조회 오류:', error);
    return;
  }
  
  console.log(`📊 오늘 추가된 핫딜 개수: ${data.length}개`);
  console.log('\n📋 최신 5개 핫딜:');
  console.log('제목 | 가격 | 이미지 | 생성시간');
  console.log(''.padEnd(100, '-'));
  
  data.forEach((deal, index) => {
    const title = deal.title.substring(0, 30).padEnd(30);
    const price = (deal.sale_price || 0).toLocaleString().padStart(8);
    const hasImage = deal.image_url ? '✅' : '❌';
    const hasThumbnail = deal.thumbnail_url ? '✅' : '❌';
    const createdAt = new Date(deal.created_at).toLocaleTimeString('ko-KR');
    
    console.log(`${index + 1}. ${title} | ${price}원 | 이미지:${hasImage} 썸네일:${hasThumbnail} | ${createdAt}`);
  });
  
  // 이미지 URL 샘플 확인
  if (data.length > 0 && data[0].image_url) {
    console.log('\n🖼️  이미지 URL 샘플:');
    console.log(`- 원본: ${data[0].image_url}`);
    console.log(`- 썸네일: ${data[0].thumbnail_url || 'N/A'}`);
  }
  
  // 전체 통계
  const { count } = await supabase
    .from('hot_deals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
    
  console.log(`\n📈 전체 활성 핫딜 개수: ${count}개`);
}

checkRecentData().catch(console.error);