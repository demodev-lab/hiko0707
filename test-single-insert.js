require('dotenv').config({ path: '.env.local' });
const { SupabaseHotDealRepository } = require('./lib/db/supabase/repositories/hotdeal-repository.ts');

async function testSingleInsert() {
  console.log('🔍 단일 핫딜 삽입 테스트...');
  
  const repository = new SupabaseHotDealRepository();
  
  const testHotdeal = {
    source: 'ppomppu',
    sourcePostId: 'test-640999',
    category: '기타',
    title: '[테스트] 단일 삽입 테스트용 핫딜',
    price: 10000,
    seller: '테스트 판매자',
    imageUrl: 'https://example.com/test.jpg',
    originalUrl: 'https://example.com/test',
    productComment: '테스트용 상품 설명',
    crawledAt: new Date(),
    isHot: false,
    isPopular: false,
    viewCount: 0,
    communityRecommendCount: 0,
    communityCommentCount: 0,
    status: 'active',
    likeCount: 0,
    commentCount: 0,
    shipping: {
      isFree: true,
      fee: 0
    },
    userId: 'test-user'
  };
  
  try {
    console.log('📤 테스트 데이터 삽입 시도...');
    const result = await repository.create(testHotdeal);
    
    if (result) {
      console.log('✅ 삽입 성공!', result.id);
    } else {
      console.log('❌ 삽입 실패 - null 반환');
    }
  } catch (error) {
    console.error('❌ 삽입 중 오류:', error);
  }
}

testSingleInsert().catch(console.error);