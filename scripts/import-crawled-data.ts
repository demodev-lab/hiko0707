import fs from 'fs';
import path from 'path';
import { HotDeal, HotDealSource } from '@/types/hotdeal';

interface CrawledData {
  metadata: {
    exportDate: string;
    totalDeals: number;
    source: string;
    version: string;
    exportedBy: string;
    crawledPages: number;
  };
  hotdeals: CrawledHotDeal[];
}

interface CrawledHotDeal {
  id: string;
  title: string;
  content: string;
  price: string;
  originalPrice: string | null;
  discount: string | null;
  storeName: string;
  category: string;
  thumbnailImage: string;
  originalImage: string;
  author: string;
  postDate: string;
  views: number;
  recommendCount: number;
  commentCount: number;
  url: string;
  isEnded: boolean;
  isFreeShipping: boolean;
  isPopular: boolean;
  source: string;
  sourcePostId: string;
  crawledPage: number;
  createdAt: string;
  updatedAt: string;
}

export function convertCrawledDataToHotDeals(crawledFilePath: string): HotDeal[] {
  const fileContent = fs.readFileSync(crawledFilePath, 'utf-8');
  const crawledData: CrawledData = JSON.parse(fileContent);
  
  return crawledData.hotdeals.map((deal, index) => {
    // 가격에서 숫자만 추출
    const priceMatch = deal.price?.match(/[\d,]+/);
    const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
    
    const hotDeal: HotDeal = {
      id: `crawled_${deal.sourcePostId}_${Date.now()}_${index}`,
      title: deal.title,
      price: price,
      imageUrl: deal.originalImage || deal.thumbnailImage,
      originalUrl: deal.url,
      seller: deal.storeName,
      source: deal.source as HotDealSource,
      crawledAt: new Date(deal.postDate),
      userId: deal.author,
      communityCommentCount: deal.commentCount,
      communityRecommendCount: deal.recommendCount,
      ranking: undefined,
      shipping: {
        isFree: deal.isFreeShipping
      },
      productComment: deal.content,
      category: deal.category,
      status: deal.isEnded ? 'ended' : 'active',
      viewCount: deal.views,
      likeCount: 0,
      commentCount: 0,
      translationStatus: 'pending'
    };
    
    return hotDeal;
  });
}

// 실행 함수
export async function importCrawledData(crawledFilePath: string) {
  try {
    console.log(`📥 크롤링 데이터 가져오기: ${crawledFilePath}`);
    
    const hotDeals = convertCrawledDataToHotDeals(crawledFilePath);
    
    // 데이터베이스에 저장 (기존 mock 데이터에 추가)
    const { db } = await import('@/lib/db/database-service');
    
    for (const deal of hotDeals) {
      await db.hotdeals.create(deal);
    }
    
    console.log(`✅ ${hotDeals.length}개의 핫딜이 성공적으로 가져와졌습니다.`);
    return hotDeals;
    
  } catch (error) {
    console.error('❌ 크롤링 데이터 가져오기 실패:', error);
    throw error;
  }
}

// CLI 실행용
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('❌ 파일 경로를 제공해주세요.');
    console.log('사용법: tsx scripts/import-crawled-data.ts <파일경로>');
    process.exit(1);
  }
  
  importCrawledData(filePath)
    .then(() => {
      console.log('🎉 크롤링 데이터 가져오기 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 실행 실패:', error);
      process.exit(1);
    });
}