#!/usr/bin/env node

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { HotDeal, HotDealCategory, HotDealSource } from '../types/hotdeal';

// 실제 한국 핫딜 사이트에서 볼 수 있는 리얼한 제품명들
const productTemplates = {
  electronics: [
    { title: 'LG 올레드 65인치 OLED65C3KNA', originalPrice: 2500000, discountRate: 30 },
    { title: '삼성 갤럭시 버즈2 프로 SM-R510', originalPrice: 299000, discountRate: 40 },
    { title: 'Apple 에어팟 프로 2세대 USB-C', originalPrice: 359000, discountRate: 25 },
    { title: '다이슨 V15 디텍트 컴플리트 무선청소기', originalPrice: 1199000, discountRate: 35 },
    { title: 'LG 그램 17인치 2024 17Z90S-GA50K', originalPrice: 2390000, discountRate: 20 },
    { title: '샤오미 미밴드 8 글로벌버전', originalPrice: 59900, discountRate: 45 },
    { title: '로지텍 MX Master 3S 무선마우스', originalPrice: 139000, discountRate: 30 },
    { title: '소니 WH-1000XM5 노이즈캔슬링 헤드폰', originalPrice: 449000, discountRate: 25 },
    { title: '닌텐도 스위치 OLED 젤다의전설 에디션', originalPrice: 449000, discountRate: 10 },
    { title: '애플워치 시리즈 9 GPS 45mm', originalPrice: 599000, discountRate: 15 }
  ],
  food: [
    { title: '곰곰 한돈 삼겹살 1kg (냉장)', originalPrice: 19900, discountRate: 30 },
    { title: '농심 신라면 120g x 20개입', originalPrice: 23900, discountRate: 40 },
    { title: '서울우유 1L x 10팩', originalPrice: 25900, discountRate: 35 },
    { title: '코카콜라 제로 355ml x 24캔', originalPrice: 19900, discountRate: 50 },
    { title: '스타벅스 아메리카노 270ml x 10개', originalPrice: 15900, discountRate: 45 },
    { title: '동원 참치캔 100g x 24개', originalPrice: 35900, discountRate: 30 },
    { title: 'CJ 비비고 왕교자 1.4kg', originalPrice: 15900, discountRate: 40 },
    { title: '풀무원 두부 300g x 3개', originalPrice: 5900, discountRate: 25 },
    { title: '오뚜기 진라면 매운맛 120g x 20개', originalPrice: 22900, discountRate: 35 },
    { title: '해태 허니버터칩 60g x 16개', originalPrice: 31900, discountRate: 30 }
  ],
  beauty: [
    { title: '설화수 자음생크림 60ml 기획세트', originalPrice: 180000, discountRate: 30 },
    { title: '에스티로더 갈색병 50ml + 15ml', originalPrice: 115000, discountRate: 35 },
    { title: '조말론 잉글리쉬페어 100ml', originalPrice: 195000, discountRate: 25 },
    { title: '헤라 블랙쿠션 SPF34 PA++ 리필포함', originalPrice: 65000, discountRate: 40 },
    { title: '닥터자르트 시카페어 크림 50ml x 2개', originalPrice: 78000, discountRate: 45 },
    { title: '이니스프리 그린티 씨드 세럼 80ml', originalPrice: 38000, discountRate: 50 },
    { title: 'SK-II 피테라 에센스 230ml', originalPrice: 280000, discountRate: 20 },
    { title: '아이오페 레티놀 엑스퍼트 0.1% 30ml', originalPrice: 75000, discountRate: 30 },
    { title: '랑콤 제니피끄 50ml 기획세트', originalPrice: 150000, discountRate: 35 },
    { title: 'CNP 차앤박 프로폴리스 앰플 35ml', originalPrice: 42000, discountRate: 40 }
  ],
  home: [
    { title: '한샘 몬스터 4인용 식탁세트', originalPrice: 599000, discountRate: 40 },
    { title: '쿠쿠 10인용 전기압력밥솥 CRP-P1009S', originalPrice: 299000, discountRate: 35 },
    { title: '삼성 비스포크 4도어 냉장고 RF85T9013AP', originalPrice: 3990000, discountRate: 25 },
    { title: '한일 온수매트 더블 HM-2020D', originalPrice: 159000, discountRate: 45 },
    { title: '이케아 말름 서랍장 6단 화이트', originalPrice: 149000, discountRate: 30 },
    { title: '템퍼 오리지널 매트리스 슈퍼싱글', originalPrice: 2990000, discountRate: 40 },
    { title: '발뮤다 더 토스터 K05A', originalPrice: 329000, discountRate: 20 },
    { title: '에어프라이어 5.5L AF-5500W', originalPrice: 89900, discountRate: 50 },
    { title: '위닉스 타워 XL 공기청정기', originalPrice: 699000, discountRate: 35 },
    { title: '코웨이 비데 BA-13 방문설치', originalPrice: 399000, discountRate: 30 }
  ],
  sports: [
    { title: '나이키 에어맥스 97 트리플 블랙', originalPrice: 219000, discountRate: 30 },
    { title: '아디다스 울트라부스트 22 런닝화', originalPrice: 239000, discountRate: 40 },
    { title: '휠라 레이트레이서 운동화', originalPrice: 89900, discountRate: 50 },
    { title: '데카트론 캠핑 텐트 4인용', originalPrice: 299000, discountRate: 35 },
    { title: '몽벨 다운자켓 남녀공용', originalPrice: 389000, discountRate: 25 },
    { title: '라이프워크 요가매트 10mm TPE', originalPrice: 39900, discountRate: 45 },
    { title: '헤드 테니스라켓 스피드 MP', originalPrice: 289000, discountRate: 30 },
    { title: 'K2 인라인스케이트 VO2 S 100', originalPrice: 259000, discountRate: 40 },
    { title: '언더아머 UA 스톰 백팩', originalPrice: 89900, discountRate: 35 },
    { title: '리복 클래식 레더 운동화', originalPrice: 99900, discountRate: 30 }
  ],
  books: [
    { title: '도서 - 클린 코드 로버트 마틴', originalPrice: 32000, discountRate: 20 },
    { title: '문구용품 - 제브라 사라사 클립 10색 세트', originalPrice: 12900, discountRate: 30 },
    { title: '도서 - 자바스크립트 완벽 가이드', originalPrice: 45000, discountRate: 25 },
    { title: '문구 - 파일럿 G-2 볼펜 12개 세트', originalPrice: 15900, discountRate: 35 },
    { title: '도서 - 토비의 스프링 3.1', originalPrice: 38000, discountRate: 30 }
  ],
  travel: [
    { title: '여행 - 제주도 펜션 1박 숙박권', originalPrice: 150000, discountRate: 40 },
    { title: '여행용품 - 삼소나이트 캐리어 24인치', originalPrice: 299000, discountRate: 35 },
    { title: '여행 - 부산 호텔 2박3일 패키지', originalPrice: 250000, discountRate: 30 },
    { title: '여행용품 - 여행용 멀티 어댑터', originalPrice: 25900, discountRate: 45 },
    { title: '여행 - 강원도 리조트 숙박권', originalPrice: 180000, discountRate: 25 }
  ],
  other: [
    { title: '반려동물용품 - 로얄캐닌 고양이사료 2kg', originalPrice: 35900, discountRate: 25 },
    { title: '자동차용품 - 블랙박스 4K 전후방', originalPrice: 299000, discountRate: 40 },
    { title: '베이비용품 - 기저귀 팬티형 대형 100매', originalPrice: 45900, discountRate: 35 },
    { title: '기타 - 화분 관엽식물 세트', originalPrice: 29900, discountRate: 30 },
    { title: '기타 - 청소용품 올인원 세트', originalPrice: 19900, discountRate: 40 }
  ]
};

// 커뮤니티별 특징
const sourcePrefixes: Record<HotDealSource, string> = {
  ppomppu: '[뽐뿌]',
  ruliweb: '[루리웹]',
  clien: '[클리앙]',
  quasarzone: '[퀘사존]',
  eomisae: '[어미새]',
  zod: '[zod]',
  coolenjoy: '[쿨앤조이]',
  algumon: '[알구몬]'
};

// 배송 정보 템플릿
const shippingTemplates = [
  { cost: 0, isFree: true, method: '무료배송' },
  { cost: 2500, isFree: false, method: '택배배송' },
  { cost: 3000, isFree: false, method: '일반배송' },
  { cost: 0, isFree: true, method: '쿠팡로켓배송' },
  { cost: 0, isFree: true, method: '네이버플러스배송' }
];

// 카테고리별 이미지 URL 템플릿
const categoryImages: Record<HotDealCategory, string[]> = {
  electronics: [
    'https://picsum.photos/seed/elect1/400/300',
    'https://picsum.photos/seed/elect2/400/300',
    'https://picsum.photos/seed/elect3/400/300'
  ],
  food: [
    'https://picsum.photos/seed/food1/400/300',
    'https://picsum.photos/seed/food2/400/300',
    'https://picsum.photos/seed/food3/400/300'
  ],
  beauty: [
    'https://picsum.photos/seed/beauty1/400/300',
    'https://picsum.photos/seed/beauty2/400/300',
    'https://picsum.photos/seed/beauty3/400/300'
  ],
  home: [
    'https://picsum.photos/seed/home1/400/300',
    'https://picsum.photos/seed/home2/400/300',
    'https://picsum.photos/seed/home3/400/300'
  ],
  sports: [
    'https://picsum.photos/seed/sport1/400/300',
    'https://picsum.photos/seed/sport2/400/300',
    'https://picsum.photos/seed/sport3/400/300'
  ],
  books: [
    'https://picsum.photos/seed/book1/400/300',
    'https://picsum.photos/seed/book2/400/300',
    'https://picsum.photos/seed/book3/400/300'
  ],
  travel: [
    'https://picsum.photos/seed/travel1/400/300',
    'https://picsum.photos/seed/travel2/400/300',
    'https://picsum.photos/seed/travel3/400/300'
  ],
  other: [
    'https://picsum.photos/seed/other1/400/300',
    'https://picsum.photos/seed/other2/400/300',
    'https://picsum.photos/seed/other3/400/300'
  ]
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHotDeal(index: number): HotDeal {
  const categories = Object.keys(productTemplates) as HotDealCategory[];
  const category = getRandomElement(categories);
  const source = getRandomElement(['ppomppu', 'ruliweb', 'clien', 'quasarzone', 'eomisae', 'zod', 'coolenjoy', 'algumon'] as HotDealSource[]);
  const product = getRandomElement(productTemplates[category]);
  
  const originalPrice = product.originalPrice + getRandomNumber(-10000, 10000);
  const discountRate = product.discountRate + getRandomNumber(-5, 5);
  const price = Math.floor(originalPrice * (1 - discountRate / 100));
  
  const now = new Date();
  const crawledAt = new Date(now.getTime() - getRandomNumber(0, 48 * 60 * 60 * 1000)); // 0-48시간 전
  const status = getRandomNumber(1, 10) > 8 ? 'ended' : 'active';
  
  // 추가 정보 생성
  const hasEndDate = getRandomNumber(1, 10) > 5;
  const endDate = hasEndDate 
    ? new Date(now.getTime() + getRandomNumber(1, 7) * 24 * 60 * 60 * 1000) 
    : undefined;
  
  const hotDeal: HotDeal = {
    id: uuidv4(),
    title: `${sourcePrefixes[source]} ${product.title}`,
    description: `${product.title} 특가 할인! 역대급 가격으로 만나보세요. 한정 수량 특가 진행중!`,
    price,
    originalPrice,
    discountRate,
    category,
    source,
    originalUrl: `https://example.com/hotdeal/${index}`,
    imageUrl: getRandomElement(categoryImages[category]),
    viewCount: getRandomNumber(100, 50000),
    likeCount: getRandomNumber(10, 5000),
    commentCount: getRandomNumber(5, 500),
    shipping: getRandomElement(shippingTemplates),
    status,
    endDate,
    crawledAt,
    updatedAt: crawledAt
  };
  
  return hotDeal;
}

async function generateMockData() {
  const hotdeals: HotDeal[] = [];
  
  // 150개의 핫딜 생성 (카테고리별로 골고루)
  for (let i = 0; i < 150; i++) {
    hotdeals.push(generateHotDeal(i));
  }
  
  // 최신순으로 정렬
  hotdeals.sort((a, b) => b.crawledAt.getTime() - a.crawledAt.getTime());
  
  // JSON 파일로 저장
  const outputDir = path.join(process.cwd(), 'lib', 'db');
  const outputPath = path.join(outputDir, 'hotdeal-mock-data.json');
  
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputPath,
    JSON.stringify(hotdeals, null, 2),
    'utf-8'
  );
  
  console.log(`✅ Generated ${hotdeals.length} hotdeal mock data items`);
  console.log(`📁 Saved to: ${outputPath}`);
  
  // 카테고리별 통계 출력
  const stats = hotdeals.reduce((acc, deal) => {
    acc[deal.category] = (acc[deal.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n📊 Category Statistics:');
  Object.entries(stats).forEach(([category, count]) => {
    console.log(`  - ${category}: ${count} items`);
  });
  
  // 소스별 통계 출력
  const sourceStats = hotdeals.reduce((acc, deal) => {
    acc[deal.source] = (acc[deal.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n📡 Source Statistics:');
  Object.entries(sourceStats).forEach(([source, count]) => {
    console.log(`  - ${source}: ${count} items`);
  });
}

// 실행
generateMockData().catch(console.error);