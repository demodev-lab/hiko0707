'use server'

import { CrawledHotDeal } from '@/lib/crawlers/types'
import { ppomppuCrawler } from '@/lib/crawlers/ppomppu-crawler'
import { db } from '@/lib/db/database-service'
import { HotDealSource } from '@/types/hotdeal'

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

// 실제 Playwright MCP를 사용한 크롤링 함수
export async function crawlPpomppuWithRealMCP(pageNumber: number = 1): Promise<CrawledHotDeal[]> {
  console.log(`🌐 뽐뿌 실제 크롤링 시작... (페이지 ${pageNumber})`);
  
  // 이 함수는 서버 액션이므로 실제로는 별도의 크롤링 서버나 
  // 백그라운드 작업으로 처리되어야 합니다.
  // 현재는 데이터 구조만 보여주기 위한 시뮬레이션입니다.
  
  const crawledDeals: CrawledHotDeal[] = [];
  
  // 실제 구현 시 필요한 단계:
  // 1. Playwright 브라우저 인스턴스 생성
  // 2. 페이지 네비게이션
  // 3. 데이터 추출
  // 4. 상세 페이지에서 추가 정보 수집
  // 5. 데이터 변환 및 저장
  
  console.log(`✅ 크롤링 완료 (시뮬레이션)`);
  return crawledDeals;
}

// 크롤링된 데이터 저장
export async function savePpomppuHotDeals(deals: CrawledHotDeal[]): Promise<{
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
    
    for (const deal of deals) {
      const existing = existingUrlMap.get(deal.originalUrl);
      
      if (existing) {
        // 기존 데이터가 있으면 건너뜀 (중복 방지)
        stats.skipped++;
      } else {
        // 새로운 핫딜 저장 (CrawledHotDeal -> HotDeal 변환)
        await db.hotdeals.create({
          ...deal,
          source: deal.source as HotDealSource,
          status: 'active' as const,
          sourcePostId: deal.title + '-' + Date.now(), // 고유 ID 생성
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          translationStatus: 'pending' as const
        });
        stats.saved++;
      }
    }
    
    console.log(`💾 저장 완료: 신규 ${stats.saved}개, 업데이트 ${stats.updated}개, 스킵 ${stats.skipped}개`);
    
  } catch (error) {
    console.error('핫딜 저장 중 오류:', error);
  }
  
  return stats;
}

// 테스트용 크롤링 데이터
export async function getCrawledTestData(): Promise<CrawledHotDeal[]> {
  // 실제 크롤링한 데이터 구조 예시
  const testData: PpomppuRawData[] = [
    {
      title: "[롯데홈쇼핑]지이크 구스 퍼카라 하프후드패딩 (119,770원/무료)",
      link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635634",
      imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data3/2025/0711/20250711221159_joxcBjpunq.jpg",
      originalImageUrl: "https://cdn2.ppomppu.co.kr/zboard/data3/2025/0711/20250711221159_joxcBjpunq.jpg",
      author: "야리아스",
      date: "25/07/11",
      views: "17138",
      recommend: "",
      category: "의류/잡화",
      commentCount: "21",
      isEnded: false,
      productComment: "구스다운이고 디자인 깔끔하네요 종류 2가지 있고 색상 4가지 있습니다"
    },
    {
      title: "[쿠팡]TOOCKI 3in1 멀티 고속충전 케이블 c타입 단일 고속 1m 2개 (5,990원/무료)",
      link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635718",
      imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/8/small_635718.jpg",
      originalImageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/ppomppu/8/635718.jpg",
      author: "이건그냥레전드",
      date: "12:04:06",
      views: "3421",
      recommend: "1 - 0",
      category: "디지털",
      commentCount: "4",
      isEnded: false,
      productComment: "3in1 멀티 충전 케이블입니다. C타입, 8핀, 5핀 모두 지원합니다."
    }
  ];
  
  // 데이터 변환
  return testData.map(raw => ppomppuCrawler.transformData(raw));
}

// 실제 크롤링 실행 함수 (테스트용)
export async function executePpomppuTestCrawling(): Promise<{
  success: boolean
  data: CrawledHotDeal[]
  stats: {
    crawled: number
    saved: number
    updated: number
    skipped: number
  }
  message: string
}> {
  try {
    console.log('🚀 뽐뿌 테스트 크롤링 시작...');
    
    // 테스트 데이터 가져오기
    const crawledDeals = await getCrawledTestData();
    
    // 데이터 저장
    const saveStats = await savePpomppuHotDeals(crawledDeals);
    
    return {
      success: true,
      data: crawledDeals,
      stats: {
        crawled: crawledDeals.length,
        ...saveStats
      },
      message: `✅ 테스트 크롤링 완료: ${crawledDeals.length}개 처리`
    };
    
  } catch (error) {
    console.error('크롤링 실패:', error);
    return {
      success: false,
      data: [],
      stats: { crawled: 0, saved: 0, updated: 0, skipped: 0 },
      message: error instanceof Error ? error.message : '크롤링 실패'
    };
  }
}