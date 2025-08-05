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
      sourcePostId: deal.sourcePostId,
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
    
    // Supabase에 저장
    const { SupabaseHotDealService } = await import('@/lib/services/supabase-hotdeal-service');
    
    let savedCount = 0;
    let skippedCount = 0;
    
    for (const deal of hotDeals) {
      try {
        // 중복 확인
        const isDuplicate = await SupabaseHotDealService.checkDuplicate(deal.source, deal.sourcePostId);
        
        if (isDuplicate) {
          console.log(`⏭️  중복 건너뛰기: ${deal.source} - ${deal.sourcePostId}`);
          skippedCount++;
        } else {
          // Supabase 형식으로 변환
          const supabaseData = {
            title: deal.title,
            description: deal.productComment || null,
            original_price: deal.price || 0,
            sale_price: deal.price || 0,
            discount_rate: 0, // crawled data에는 없음
            thumbnail_url: deal.imageUrl || '',
            image_url: deal.imageUrl || '',
            original_url: deal.originalUrl || '',
            category: deal.category || 'general',
            source: deal.source,
            source_id: deal.sourcePostId,
            seller: deal.seller || null,
            is_free_shipping: deal.shipping?.isFree || false,
            status: 'active' as const,
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            views: deal.viewCount || 0,
            comment_count: deal.communityCommentCount || 0,
            like_count: 0,
            author_name: deal.userId || 'Unknown',
            shopping_comment: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Supabase에 저장
          await SupabaseHotDealService.createHotDeal(supabaseData);
          savedCount++;
        }
      } catch (error) {
        console.error(`❌ 핫딜 저장 실패 (${deal.title}):`, error);
      }
    }
    
    console.log(`✅ ${savedCount}개의 핫딜이 성공적으로 가져와졌습니다. (${skippedCount}개 중복 건너뜀)`);
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