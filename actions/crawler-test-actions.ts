'use server'

import { CrawledHotDeal } from '@/lib/crawlers/types'
import { 
  parsePrice, 
  parseDate, 
  extractSeller, 
  cleanTitle, 
  checkFreeShipping
} from '@/lib/crawlers/playwright-ppomppu'

// 테스트용 샘플 데이터
const samplePpomppuData = [
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/3/small_635493.jpg",
    title: "[지마켓]망고비데 필터없는 직수 비데 MB-8811RNF (126,330원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635493",
    author: "도논곰",
    date: "25/07/11",
    views: "19012",
    recommend: "2 - 0",
    commentCount: "37",
    category: "생활/가전"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/7/small_635677.jpg",
    title: "[쿠팡] 삼성전자 갤럭시 버즈2 프로 (189,000원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635677",
    author: "2027500K",
    date: "25/07/11",
    views: "5234",
    recommend: "5 - 1",
    commentCount: "12",
    category: "전자"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/6/small_635676.jpg",
    title: "[11번가] 농심 신라면 5개입 x 8봉 (15,900원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635676",
    author: "조선사나이",
    date: "25/07/11",
    views: "3456",
    recommend: "1 - 0",
    commentCount: "8",
    category: "식품"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/4/small_635494.jpg",
    title: "[위메프] 코카콜라 355ml x 24캔 (10,900원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635494",
    author: "맛있는콜라",
    date: "25/07/11",
    views: "8234",
    recommend: "3 - 0",
    commentCount: "15",
    category: "식품"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/5/small_635495.jpg",
    title: "[G마켓] LG 27인치 게이밍 모니터 27GP850 (389,000원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635495",
    author: "게이머123",
    date: "25/07/11",
    views: "12345",
    recommend: "8 - 1",
    commentCount: "23",
    category: "전자"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/6/small_635496.jpg",
    title: "[쿠팡] 다우니 고농축 섬유유연제 1L x 6개 (23,900원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635496",
    author: "향기좋아",
    date: "25/07/11",
    views: "4567",
    recommend: "2 - 0",
    commentCount: "11",
    category: "생활/가전"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/7/small_635497.jpg",
    title: "[티몬] 스타벅스 아메리카노 T 20개입 (15,900원/2,500원)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635497",
    author: "커피마니아",
    date: "25/07/11",
    views: "6789",
    recommend: "4 - 1",
    commentCount: "19",
    category: "식품"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/8/small_635498.jpg",
    title: "[옥션] 나이키 에어맥스 270 (89,000원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635498",
    author: "운동화수집가",
    date: "25/07/11",
    views: "9876",
    recommend: "6 - 2",
    commentCount: "28",
    category: "패션"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/9/small_635499.jpg",
    title: "[SSG] 곰곰 무항생제 계란 30구 (5,980원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635499",
    author: "신선식품",
    date: "25/07/11",
    views: "3210",
    recommend: "1 - 0",
    commentCount: "7",
    category: "식품"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/0/small_635500.jpg",
    title: "[네이버] 샤오미 공기청정기 미에어 프로H (149,000원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635500",
    author: "깨끗한공기",
    date: "25/07/11",
    views: "7654",
    recommend: "5 - 0",
    commentCount: "16",
    category: "생활/가전"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/1/small_635501.jpg",
    title: "[인터파크] 필립스 전기면도기 S5000 (79,000원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635501",
    author: "면도왕",
    date: "25/07/10",
    views: "4321",
    recommend: "3 - 1",
    commentCount: "13",
    category: "생활/가전"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/2/small_635502.jpg",
    title: "[GS샵] 락앤락 진공 밀폐용기 10종 세트 (29,900원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635502",
    author: "주방마스터",
    date: "25/07/10",
    views: "5432",
    recommend: "2 - 0",
    commentCount: "9",
    category: "생활/가전"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/3/small_635503.jpg",
    title: "[홈플러스] 하기스 네이처메이드 기저귀 대형 4팩 (65,900원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635503",
    author: "육아대디",
    date: "25/07/10",
    views: "3456",
    recommend: "1 - 0",
    commentCount: "6",
    category: "유아"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/4/small_635504.jpg",
    title: "[롯데온] 삼성 갤럭시탭 A8 64GB WiFi (289,000원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635504",
    author: "태블릿유저",
    date: "25/07/10",
    views: "8765",
    recommend: "7 - 1",
    commentCount: "21",
    category: "전자"
  },
  {
    imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/5/small_635505.jpg",
    title: "[쿠팡] 맥심 카누 미니 100T x 2개 (19,900원/무료)",
    link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=635505",
    author: "커피중독자",
    date: "25/07/10",
    views: "6543",
    recommend: "4 - 0",
    commentCount: "14",
    category: "식품"
  }
];

export async function getTestPpomppuData(pageNumber: number = 1): Promise<CrawledHotDeal[]> {
  console.log(`🧪 테스트 데이터 생성 중... (페이지 ${pageNumber})`);
  
  // 더 많은 샘플 상품 추가
  const additionalProducts = [
    // 페이지 2 데이터
    "[에누리] 애플 에어팟 프로 2세대 USB-C (289,000원/무료)",
    "[다나와] 삼성 BESPOKE 냉장고 RF85B9111AP (1,890,000원/무료)",
    "[티몬] 에이블루 무선 충전 보조배터리 20000mAh (35,900원/무료)",
    "[위메프] 닌텐도 스위치 OLED 화이트 (398,000원/무료)",
    "[G마켓] 다이슨 V15 디텍트 무선청소기 (759,000원/무료)",
    "[11번가] CJ 비비고 왕교자 1.4kg x 4봉 (29,900원/무료)",
    "[쿠팡] 오뚜기 진라면 매운맛 120g x 20개 (15,900원/무료)",
    "[옥션] 아디다스 울트라부스트 22 (119,000원/무료)",
    "[SSG] 풀무원 국산콩 두부 300g x 10개 (9,900원/무료)",
    "[네이버] 로지텍 MX Master 3S 무선마우스 (139,000원/무료)",
    "[인터파크] LG 스타일러 오브제컬렉션 (1,490,000원/무료)",
    "[GS샵] 테팔 매직핸즈 후라이팬 세트 (89,900원/무료)",
    "[홈플러스] 페브리즈 섬유탈취제 800ml x 6개 (25,900원/무료)",
    "[롯데온] 갤럭시 워치6 클래식 47mm (459,000원/무료)",
    "[마켓컬리] 한우 1++ 등심 200g (29,900원/2,500원)",
    
    // 페이지 3 데이터  
    "[쿠팡] 삼성 오디세이 G7 32인치 게이밍 모니터 (699,000원/무료)",
    "[G마켓] 발뮤다 더 토스터 프로 (319,000원/무료)",
    "[11번가] 네스프레소 버츄오 플러스 캡슐커피머신 (189,000원/무료)",
    "[티몬] 뉴발란스 530 화이트 실버 (109,000원/무료)",
    "[위메프] 몽클레어 패딩 조끼 (890,000원/무료)",
    "[옥션] 캠핑 접이식 테이블 의자 세트 (79,900원/무료)",
    "[SSG] 한돈 삼겹살 구이용 1kg (19,900원/2,500원)",
    "[네이버] 브리츠 사운드바 BZ-T6500 (159,000원/무료)",
    "[인터파크] 쿠쿠 10인용 전기압력밥솥 (249,000원/무료)",
    "[GS샵] 휴롬 원액기 H-AA (399,000원/무료)",
    "[홈플러스] 크리넥스 3겹 롤화장지 30롤 x 2팩 (29,900원/무료)",
    "[롯데온] 아이패드 프로 12.9 6세대 WiFi 128GB (1,249,000원/무료)",
    "[마켓컬리] 제주 한라봉 5kg (35,900원/2,500원)",
    "[에누리] 소니 WH-1000XM5 노이즈캔슬링 헤드폰 (449,000원/무료)",
    "[다나와] ASUS ROG 게이밍 노트북 G14 (1,890,000원/무료)"
  ];
  
  // 페이지별로 다른 데이터 반환
  if (pageNumber === 1) {
    // 페이지 1: 기존 샘플 데이터 사용
    const crawledDeals: CrawledHotDeal[] = samplePpomppuData.slice(0, 15).map((item, index) => {
      const title = item.title || '';
      const cleanedTitle = cleanTitle(title);
      
      return {
        id: `ppomppu-page1-${Date.now()}-${index}`,
        title: cleanedTitle,
        price: parsePrice(title),
        originalUrl: item.link || '',
        seller: extractSeller(title),
        source: 'ppomppu',
        crawledAt: parseDate(item.date),
        imageUrl: item.imageUrl,
        userId: item.author,
        communityCommentCount: parseInt(item.commentCount?.replace(/[^\d]/g, '') || '0'),
        communityRecommendCount: parseInt(item.recommend?.split('-')[0]?.trim() || '0'),
        viewCount: parseInt(item.views?.replace(/[^\d]/g, '') || '0'),
        productComment: "리모컨있는모델이랑 없는모델 있는데 리모컨 있는 모델로 가시는게 좋습니다. 직수형 비데고 가격대 좋아요.",
        category: item.category,
        shipping: {
          isFree: checkFreeShipping(title)
        },
        crawlerId: 'ppomppu-test-v1',
        crawlerVersion: '1.0.0'
      };
    });
    
    return crawledDeals;
  } else {
    // 페이지 2, 3: 추가 데이터 사용
    const startIdx = (pageNumber - 2) * 15;
    const endIdx = startIdx + 15;
    const pageProducts = additionalProducts.slice(startIdx, endIdx);
    
    const crawledDeals: CrawledHotDeal[] = pageProducts.map((title, index) => {
      const cleanedTitle = cleanTitle(title);
      const categories = ['전자', '생활/가전', '식품', '패션', '유아', '스포츠', '뷰티'];
      const users = ['딜헌터', '핫딜러', '알뜰왕', '쇼핑고수', '득템러', '세일헌터', '할인매니아'];
      
      return {
        id: `ppomppu-page${pageNumber}-${Date.now()}-${index}`,
        title: cleanedTitle,
        price: parsePrice(title),
        originalUrl: `https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=${635500 + (pageNumber - 1) * 15 + index}`,
        seller: extractSeller(title),
        source: 'ppomppu',
        crawledAt: new Date(),
        imageUrl: `https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/${index % 10}/small_${635500 + (pageNumber - 1) * 15 + index}.jpg`,
        userId: users[index % users.length],
        communityCommentCount: Math.floor(Math.random() * 50) + 5,
        communityRecommendCount: Math.floor(Math.random() * 20) + 1,
        viewCount: Math.floor(Math.random() * 20000) + 1000,
        productComment: "좋은 가격에 판매중입니다. 재고 소진시 조기 종료될 수 있으니 서두르세요!",
        category: categories[index % categories.length],
        shipping: {
          isFree: checkFreeShipping(title)
        },
        crawlerId: 'ppomppu-test-v1',
        crawlerVersion: '1.0.0'
      };
    });
    
    return crawledDeals;
  }
}