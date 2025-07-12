'use server'

import { ppomppuCrawler } from '@/lib/crawlers/ppomppu-crawler'
import { CrawledHotDeal } from '@/lib/crawlers/types'

export async function crawlPpomppuRealData(pageNumber: number = 1): Promise<CrawledHotDeal[]> {
  console.log(`🌐 뽐뿌 실제 데이터 크롤링 시작... (페이지 ${pageNumber})`);
  
  try {
    const url = ppomppuCrawler.getListUrl(pageNumber);
    console.log(`📍 크롤링 URL: ${url}`);
    
    // Playwright MCP를 사용한 크롤링 스크립트
    const crawlScript = `
(function() {
  const items = document.querySelectorAll('${ppomppuCrawler.selectors.listRows}');
  const data = [];
  
  items.forEach((item, index) => {
    try {
      // 이미지
      const imageElement = item.querySelector('${ppomppuCrawler.selectors.imageThumb}');
      
      // 제목과 링크
      const titleElement = item.querySelector('${ppomppuCrawler.selectors.titleText}');
      const linkElement = item.querySelector('${ppomppuCrawler.selectors.titleLink}');
      
      if (!titleElement || !linkElement) return;
      
      // 작성자, 날짜, 조회수, 추천
      const cells = item.querySelectorAll('td');
      let author = '';
      let date = '';
      let views = '';
      let recommend = '';
      let category = '';
      
      // 셀 위치로 데이터 추출 (뽐뿌 테이블 구조에 맞춤)
      if (cells.length >= 7) {
        // 카테고리는 보통 첫 번째 셀
        const categoryElement = cells[0].querySelector('font');
        category = categoryElement ? categoryElement.textContent.trim() : '';
        
        // 작성자는 보통 5번째 셀
        author = cells[4] ? cells[4].textContent.trim() : '';
        
        // 날짜는 작성자 다음
        date = cells[5] ? cells[5].textContent.trim() : '';
        
        // 조회수
        views = cells[6] ? cells[6].textContent.trim() : '';
        
        // 추천수
        recommend = cells[7] ? cells[7].textContent.trim() : '';
      }
      
      // 댓글 수 추출
      const commentMatch = titleElement.textContent.match(/\\[(\\d+)\\]/);
      const commentCount = commentMatch ? commentMatch[1] : '0';
      
      // 제목에서 댓글 수 제거
      const cleanTitle = titleElement.textContent.replace(/\\[\\d+\\]$/, '').trim();
      
      data.push({
        title: cleanTitle,
        link: 'https://www.ppomppu.co.kr/zboard/' + linkElement.getAttribute('href'),
        imageUrl: imageElement ? imageElement.src : '',
        author: author,
        date: date,
        views: views,
        recommend: recommend,
        category: category,
        commentCount: commentCount
      });
    } catch (e) {
      console.error('Item parsing error:', e);
    }
  });
  
  return data;
})();
    `.trim();
    
    // 실제로는 Playwright MCP로 실행해야 하지만, 
    // 현재는 시뮬레이션된 데이터를 반환
    console.log('⚠️ Playwright MCP 연동 대기 중...');
    console.log('📝 크롤링 스크립트가 준비되었습니다.');
    
    // 임시로 빈 배열 반환
    return [];
    
  } catch (error) {
    console.error('크롤링 중 오류:', error);
    return [];
  }
}

// Playwright MCP를 사용한 실제 크롤링 함수
export async function executePpomppuCrawling(options: {
  maxPages?: number
  useTestData?: boolean
}): Promise<{
  success: boolean
  data: CrawledHotDeal[]
  message: string
}> {
  if (options.useTestData) {
    // 테스트 모드일 경우 기존 테스트 데이터 사용
    const { getTestPpomppuData } = await import('./crawler-test-actions')
    
    const allData: CrawledHotDeal[] = []
    for (let page = 1; page <= (options.maxPages || 1); page++) {
      const pageData = await getTestPpomppuData(page)
      allData.push(...pageData)
    }
    
    return {
      success: true,
      data: allData,
      message: `테스트 데이터 ${allData.length}개 로드 완료`
    }
  }
  
  // 실제 크롤링 모드
  try {
    console.log('🚀 뽐뿌 실제 크롤링 시작...')
    
    // 여기에 Playwright MCP 호출 로직 추가
    // 1. playwright_navigate로 페이지 이동
    // 2. playwright_evaluate로 데이터 추출
    // 3. ppomppuCrawler.transformData로 변환
    
    return {
      success: false,
      data: [],
      message: 'Playwright MCP 연동이 필요합니다'
    }
    
  } catch (error) {
    console.error('크롤링 실패:', error)
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : '크롤링 실패'
    }
  }
}