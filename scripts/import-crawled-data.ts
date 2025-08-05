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
      original_price: price,
      sale_price: price,
      discount_rate: 0,
      image_url: deal.originalImage || deal.thumbnailImage,
      thumbnail_url: deal.thumbnailImage || deal.originalImage,
      original_url: deal.url,
      seller: deal.storeName,
      source: deal.source as HotDealSource,
      source_id: deal.sourcePostId,
      author_name: deal.author,
      comment_count: deal.commentCount,
      like_count: deal.recommendCount || 0,
      is_free_shipping: deal.isFreeShipping,
      shopping_comment: deal.content,
      category: deal.category,
      status: deal.isEnded ? 'ended' : 'active',
      views: deal.views,
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(deal.postDate).toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      description: null
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
        const isDuplicate = await SupabaseHotDealService.checkDuplicate(deal.source, deal.source_id);
        
        if (isDuplicate) {
          console.log(`⏭️  중복 건너뛰기: ${deal.source} - ${deal.source_id}`);
          skippedCount++;
        } else {
          // Supabase 형식으로 변환
          const supabaseData = {
            title: deal.title,
            description: deal.description || null,
            original_price: deal.original_price || 0,
            sale_price: deal.sale_price || 0,
            discount_rate: deal.discount_rate || 0,
            thumbnail_url: deal.thumbnail_url || '',
            image_url: deal.image_url || '',
            original_url: deal.original_url || '',
            category: deal.category || 'general',
            source: deal.source,
            source_id: deal.source_id,
            seller: deal.seller || null,
            is_free_shipping: deal.is_free_shipping || false,
            status: 'active' as const,
            end_date: deal.end_date,
            views: deal.views || 0,
            comment_count: deal.comment_count || 0,
            like_count: deal.like_count || 0,
            author_name: deal.author_name || 'Unknown',
            shopping_comment: deal.shopping_comment || '',
            created_at: deal.created_at,
            updated_at: deal.updated_at
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