require('dotenv').config({ path: '.env.local' });

console.log('🌍 환경변수 확인:');
console.log('SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const { crawlerScheduler } = require('./lib/services/crawler-scheduler.ts');

async function testCrawler() {
  console.log('🕷️ 수동 크롤링 시작 (Supabase 모드)...');
  
  try {
    const result = await crawlerScheduler.runCrawlManually('ppomppu', {
      maxPages: 2,
      timeFilterHours: 12  // 최근 12시간 이내
    });
    
    console.log('✅ 크롤링 완료!');
    console.log('📊 결과:');
    console.log('  - 총 수집:', result.totalCrawled);
    console.log('  - 신규:', result.newDeals);
    console.log('  - 업데이트:', result.updatedDeals);
    
    if (result.results && result.results.length > 0) {
      console.log('\n📋 수집된 핫딜 샘플:');
      result.results[0].hotdeals.slice(0, 3).forEach((deal, index) => {
        console.log(`${index + 1}. ${deal.title} (${deal.source})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 크롤링 실패:', error);
  }
}

testCrawler();