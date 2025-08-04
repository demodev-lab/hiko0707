require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleInsert() {
  console.log('🔍 간단한 Supabase 삽입 테스트...');
  
  const testData = {
    source: 'ppomppu',
    source_id: 'test-' + Date.now(),
    category: '기타',
    title: '[테스트] 직접 삽입 테스트',
    description: '테스트용 설명',
    original_price: 10000,
    sale_price: 10000,
    discount_rate: 0,
    thumbnail_url: 'https://example.com/thumb.jpg',
    image_url: 'https://example.com/image.jpg',
    original_url: 'https://example.com/test',
    seller: '테스트 판매자',
    is_free_shipping: true,
    status: 'active',
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
    views: 0,
    comment_count: 0,
    like_count: 0,
    author_name: 'test-user',
    shopping_comment: '테스트 코멘트',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };
  
  console.log('📤 데이터 삽입 시도...');
  
  try {
    const { data, error } = await supabase
      .from('hot_deals')
      .insert(testData)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Supabase 오류:');
      console.error('- 코드:', error.code);
      console.error('- 메시지:', error.message);
      console.error('- 상세:', error.details);
      console.error('- 힌트:', error.hint);
      console.error('- 전체 오류 객체:', JSON.stringify(error, null, 2));
      return;
    }
    
    console.log('✅ 삽입 성공!');
    console.log('삽입된 데이터 ID:', data.id);
    console.log('삽입된 제목:', data.title);
    
  } catch (err) {
    console.error('❌ 예외 발생:', err.message);
    console.error('스택 추적:', err.stack);
  }
}

testSimpleInsert().catch(console.error);