require('dotenv').config({ path: '.env.local' });
const { SupabaseHotDealRepository } = require('./lib/db/supabase/repositories/hotdeal-repository.ts');

async function testUIData() {
  console.log('🔍 UI 데이터 테스트...');
  
  // 실제 컴포넌트에서 사용하는 데이터 형식으로 테스트
  const { supabaseAdmin } = require('./lib/supabase/client.ts');
  
  const client = supabaseAdmin();
  if (!client) {
    console.error('❌ Supabase client 초기화 실패');
    return;
  }
  
  console.log('✅ Supabase client 초기화 성공');
  
  // 최신 5개 핫딜 가져오기 (UI에서 사용하는 방식)
  const { data, error } = await client
    .from('hot_deals')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('❌ 데이터 조회 오류:', error);
    return;
  }
  
  console.log('📋 최신 5개 핫딜 (UI 형식):');
  console.log('제목 | 가격 | 소스 | 이미지');
  console.log(''.padEnd(80, '-'));
  
  data.forEach((deal, index) => {
    const title = deal.title.substring(0, 40).padEnd(40);
    const price = (deal.sale_price || 0).toLocaleString().padStart(8);
    const source = deal.source.padEnd(8);
    const hasImage = deal.image_url ? '✅' : '❌';
    console.log(`${index + 1}. ${title} | ${price}원 | ${source} | ${hasImage}`);
  });
  
  // transformSupabaseToLocal 함수로 변환 테스트
  const { transformSupabaseToLocal } = require('./lib/utils/hotdeal-transformers.ts');
  
  console.log('\n🔄 데이터 변환 테스트:');
  
  const firstDeal = data[0];
  const transformed = transformSupabaseToLocal(firstDeal);
  
  console.log('원본 Supabase 데이터:');
  console.log(`- ID: ${firstDeal.id}`);
  console.log(`- 제목: ${firstDeal.title}`);
  console.log(`- 가격: ${firstDeal.sale_price}`);
  console.log(`- 이미지: ${firstDeal.image_url}`);
  
  console.log('\n변환된 LocalStorage 형식:');
  console.log(`- ID: ${transformed.id}`);
  console.log(`- 제목: ${transformed.title}`);
  console.log(`- 가격: ${transformed.price}`);
  console.log(`- 이미지: ${transformed.imageUrl}`);
  console.log(`- 원본 이미지: ${transformed.originalImageUrl}`);
  console.log(`- 무료배송: ${transformed.shipping?.isFree ? 'O' : 'X'}`);
}

testUIData().catch(console.error);