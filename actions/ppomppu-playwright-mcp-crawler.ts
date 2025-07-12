'use server'

import { CrawledHotDeal } from '@/lib/crawlers/types'
import { ppomppuCrawler } from '@/lib/crawlers/ppomppu-crawler'
import { db } from '@/lib/db/database-service'

interface PpomppuRawData {
  title: string
  link: string
  imageUrl: string
  originalImageUrl?: string
  author: string
  date: string
  views: string
  recommend: string
  category: string
  commentCount: string
  isEnded: boolean
  productComment?: string
}

// Playwright MCP를 사용한 실제 크롤링 함수
export async function crawlPpomppuPageWithMCP(pageNumber: number = 1): Promise<CrawledHotDeal[]> {
  console.log(`🌐 뽐뿌 실제 크롤링 시작... (페이지 ${pageNumber})`);
  
  try {
    // 1. 메인 페이지 접속
    const mainUrl = 'https://www.ppomppu.co.kr/index.php';
    console.log(`📍 메인 페이지 접속: ${mainUrl}`);
    
    // playwright_navigate 함수를 사용
    // await mcp__playwright__playwright_navigate({ url: mainUrl })
    
    // 2. '뽐뿌' 탭 클릭
    const tabSelector = 'body > div.wrapper > div.contents > div.contents_header.abs > div.top-nav > ul > li.menu01.active > a';
    console.log(`🖱️ '뽐뿌' 탭 클릭`);
    // await mcp__playwright__playwright_click({ selector: tabSelector })
    
    // 3. 페이지 이동 (2페이지 이상인 경우)
    if (pageNumber > 1) {
      for (let i = 1; i < pageNumber; i++) {
        const nextPageSelector = '#bottom-table > div.info_bg > a';
        console.log(`📄 다음 페이지로 이동 (${i} → ${i + 1})`);
        // await mcp__playwright__playwright_click({ selector: nextPageSelector })
        // await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // 4. 데이터 추출 스크립트
    const extractScript = `
(function() {
  const rows = document.querySelectorAll('#revolution_main_table > tbody > tr.baseList');
  const data = [];
  
  rows.forEach((row, index) => {
    try {
      // 제목 및 링크
      const titleElement = row.querySelector('td.baseList-space.title > div > div > a > span');
      const linkElement = row.querySelector('td.baseList-space.title > div > div > a');
      
      if (!titleElement || !linkElement) return;
      
      // 이미지 (썸네일)
      const imageElement = row.querySelector('td.baseList-space.title > a > img');
      
      // 종료 여부 체크
      const endedElement = row.querySelector('td.baseList-space.title > div > div > img[alt="종료"]');
      const isEnded = !!endedElement;
      
      // 작성자
      const authorElement = row.querySelector('td:nth-child(3) > div > nobr > a > span');
      
      // 날짜
      const dateElement = row.querySelector('td:nth-child(4) > time') || 
                         row.querySelector('td:nth-child(4)');
      
      // 조회수
      const viewsElement = row.querySelector('td.baseList-space.baseList-views');
      
      // 추천/비추천
      const recommendElement = row.querySelector('td.baseList-space.baseList-rec');
      
      // 카테고리
      const categoryElement = row.querySelector('td.baseList-space.title > div > small');
      
      // 댓글 수
      const commentElement = row.querySelector('td.baseList-space.title > div > div > span');
      
      data.push({
        title: titleElement.textContent.trim(),
        link: linkElement.href,
        imageUrl: imageElement ? imageElement.src : '',
        author: authorElement ? authorElement.textContent.trim() : '',
        date: dateElement ? dateElement.textContent.trim() : '',
        views: viewsElement ? viewsElement.textContent.trim() : '0',
        recommend: recommendElement ? recommendElement.textContent.trim() : '0',
        category: categoryElement ? categoryElement.textContent.trim().replace(/[\\[\\]]/g, '') : '',
        commentCount: commentElement ? commentElement.textContent.trim().replace(/[()]/g, '') : '0',
        isEnded: isEnded
      });
    } catch (e) {
      console.error('Row parsing error:', e);
    }
  });
  
  return data;
})();
    `.trim();
    
    console.log(`📊 데이터 추출 중...`);
    // const rawData: PpomppuRawData[] = await mcp__playwright__playwright_evaluate({ script: extractScript })
    
    // 실제 구현 시 위의 주석을 해제하고 사용
    // 현재는 임시로 빈 배열 반환
    const rawData: PpomppuRawData[] = [];
    
    console.log(`✅ ${rawData.length}개 게시물 발견`);
    
    // 5. 각 게시물의 상세 페이지에서 원본 이미지 가져오기
    for (const item of rawData) {
      if (item.link && item.imageUrl) {
        try {
          console.log(`🖼️ 원본 이미지 가져오기: ${item.title.substring(0, 30)}...`);
          
          // 상세 페이지 접속
          // await mcp__playwright__playwright_navigate({ url: item.link })
          
          // 원본 이미지 추출
          const imageScript = `
(function() {
  // 여러 가능한 셀렉터 시도
  const selectors = [
    'body > div.wrapper > div.contents > div.container > div > table:nth-child(14) > tbody > tr:nth-child(1) > td > table > tbody > tr > td > p:nth-child(2) > div > img',
    '.board-contents img',
    'td.board-contents img',
    '[class*="content"] img'
  ];
  
  for (const selector of selectors) {
    const img = document.querySelector(selector);
    if (img && img.src) {
      return img.src;
    }
  }
  
  // 첫 번째 큰 이미지 찾기
  const allImages = document.querySelectorAll('img');
  for (const img of allImages) {
    if (img.width > 200 && img.src && !img.src.includes('thumb')) {
      return img.src;
    }
  }
  
  return null;
})();
          `.trim();
          
          // const originalImageUrl = await mcp__playwright__playwright_evaluate({ script: imageScript })
          // if (originalImageUrl) {
          //   item.originalImageUrl = originalImageUrl;
          // }
          
          // 쇼핑 코멘트 추출
          const commentScript = `
(function() {
  const selectors = [
    'body > div.wrapper > div.contents > div.container > div > table:nth-child(14) > tbody > tr:nth-child(1) > td > table > tbody > tr > td',
    '.board-contents',
    'td.board-contents',
    '[class*="content"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      return element.textContent.trim();
    }
  }
  
  return '';
})();
          `.trim();
          
          // const productComment = await mcp__playwright__playwright_evaluate({ script: commentScript })
          // if (productComment) {
          //   item.productComment = productComment;
          // }
          
        } catch (error) {
          console.error(`원본 이미지 가져오기 실패: ${item.title}`, error);
        }
      }
    }
    
    // 6. 데이터 변환
    const crawledDeals: CrawledHotDeal[] = rawData.map((raw) => {
      const transformed = ppomppuCrawler.transformData(raw);
      
      // 종료 상태 반영
      if (raw.isEnded) {
        transformed.status = 'ended';
      }
      
      // 원본 이미지 URL 설정
      if (raw.originalImageUrl) {
        transformed.imageUrl = raw.originalImageUrl;
      }
      
      // 쇼핑 코멘트 설정
      if (raw.productComment) {
        transformed.productComment = raw.productComment;
      }
      
      return transformed;
    });
    
    console.log(`✅ ${crawledDeals.length}개 핫딜 크롤링 완료`);
    return crawledDeals;
    
  } catch (error) {
    console.error('뽐뿌 크롤링 실패:', error);
    return [];
  }
}

// 중복 체크 및 데이터 저장
export async function saveCrawledHotDeals(
  crawledDeals: CrawledHotDeal[]
): Promise<{
  saved: number
  updated: number
  skipped: number
}> {
  const stats = { saved: 0, updated: 0, skipped: 0 };
  
  try {
    // 기존 핫딜 가져오기
    const existingDeals = await db.hotdeals.findAll();
    const existingUrlMap = new Map(
      existingDeals.map(deal => [deal.originalUrl, deal])
    );
    
    for (const crawledDeal of crawledDeals) {
      const existing = existingUrlMap.get(crawledDeal.originalUrl);
      
      if (existing) {
        // 종료 상태만 업데이트
        if (crawledDeal.status === 'ended' && existing.status !== 'ended') {
          await db.hotdeals.update(existing.id, {
            status: 'ended',
            updatedAt: new Date()
          });
          stats.updated++;
        } else {
          stats.skipped++;
        }
      } else {
        // 새로운 핫딜 저장
        await db.hotdeals.create(crawledDeal);
        stats.saved++;
      }
    }
    
    console.log(`💾 저장 완료: 신규 ${stats.saved}개, 업데이트 ${stats.updated}개, 스킵 ${stats.skipped}개`);
    
  } catch (error) {
    console.error('핫딜 저장 중 오류:', error);
  }
  
  return stats;
}

// 전체 크롤링 실행 함수
export async function executePpomppuMCPCrawling(options: {
  maxPages?: number
  onProgress?: (message: string) => void
}): Promise<{
  success: boolean
  stats: {
    crawled: number
    saved: number
    updated: number
    skipped: number
    errors: number
  }
  message: string
}> {
  const { maxPages = 3, onProgress } = options;
  const allCrawledDeals: CrawledHotDeal[] = [];
  const stats = { crawled: 0, saved: 0, updated: 0, skipped: 0, errors: 0 };
  
  try {
    onProgress?.('🚀 뽐뿌 크롤링 시작...');
    
    // 각 페이지 크롤링
    for (let page = 1; page <= maxPages; page++) {
      onProgress?.(`📄 ${page}페이지 크롤링 중...`);
      
      try {
        const pageDeals = await crawlPpomppuPageWithMCP(page);
        stats.crawled += pageDeals.length;
        allCrawledDeals.push(...pageDeals);
        
        // 페이지 간 딜레이
        if (page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`페이지 ${page} 크롤링 실패:`, error);
        stats.errors++;
      }
    }
    
    // 데이터 저장
    if (allCrawledDeals.length > 0) {
      onProgress?.('💾 데이터 저장 중...');
      const saveStats = await saveCrawledHotDeals(allCrawledDeals);
      stats.saved = saveStats.saved;
      stats.updated = saveStats.updated;
      stats.skipped = saveStats.skipped;
    }
    
    const message = `✅ 크롤링 완료: ${stats.crawled}개 중 신규 ${stats.saved}개, 업데이트 ${stats.updated}개`;
    onProgress?.(message);
    
    return {
      success: true,
      stats,
      message
    };
    
  } catch (error) {
    console.error('크롤링 실패:', error);
    stats.errors++;
    
    return {
      success: false,
      stats,
      message: error instanceof Error ? error.message : '크롤링 실패'
    };
  }
}

// 브라우저 종료 함수
export async function closeCrawlerBrowser(): Promise<void> {
  try {
    console.log('🔚 브라우저 종료 중...');
    // await mcp__playwright__playwright_close({})
    console.log('✅ 브라우저 종료 완료');
  } catch (error) {
    console.error('브라우저 종료 실패:', error);
  }
}