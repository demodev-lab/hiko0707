/**
 * 실제 핫딜 사이트를 참고한 리얼한 Mock 데이터
 * 웹 검색과 크롤링으로 수집한 실제 상품 정보 기반
 */

export interface RealHotDeal {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  discountRate: number;
  category: string;
  subCategory: string;
  brand: string;
  imageUrl: string;
  sourceUrl: string;
  sourceSite: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  status: 'active' | 'ended' | 'pending';
  shippingFee: number;
  shippingType: string;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  seller?: string;
  deliveryInfo?: string;
}

// 실제 상품 데이터 (웹 검색 결과 기반)
export const realHotDeals: RealHotDeal[] = [
  {
    id: '1',
    title: '삼성전자 갤럭시 S24 울트라 512GB 자급제 - 바꿔보상 최대 110만원',
    price: 1598000,
    originalPrice: 1898000,
    discountRate: 16,
    category: '전자기기',
    subCategory: '스마트폰',
    brand: '삼성전자',
    imageUrl: '/api/placeholder/hotdeal-thumb?text=Galaxy+S24+Ultra&bg=%230066FF',
    sourceUrl: 'https://www.samsung.com/sec/trade-in/',
    sourceSite: '삼성전자 공식몰',
    viewCount: 15234,
    likeCount: 892,
    commentCount: 234,
    status: 'active',
    shippingFee: 0,
    shippingType: '무료배송',
    endDate: new Date('2024-12-31'),
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-20'),
    tags: ['갤럭시S24', '플래그십', '바꿔보상', '무료배송'],
    seller: '삼성전자 공식',
    deliveryInfo: '당일출고'
  },
  {
    id: '2',
    title: '애플 맥북 에어 M2 13인치 256GB - 교육할인 적용가',
    price: 1290000,
    originalPrice: 1590000,
    discountRate: 19,
    category: '전자기기',
    subCategory: '노트북',
    brand: 'Apple',
    imageUrl: '/api/placeholder/hotdeal-thumb?text=MacBook+Air+M2&bg=%23666666',
    sourceUrl: 'https://www.apple.com/kr/education/',
    sourceSite: '애플 교육스토어',
    viewCount: 8921,
    likeCount: 567,
    commentCount: 123,
    status: 'active',
    shippingFee: 0,
    shippingType: '무료배송',
    endDate: null,
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-20'),
    tags: ['맥북', 'M2', '교육할인', '학생할인'],
    seller: 'Apple 공식',
    deliveryInfo: '3-5일 이내'
  },
  {
    id: '3',
    title: 'LG전자 스탠바이미 27인치 무선 이동형 스크린 - 연말특가',
    price: 798000,
    originalPrice: 999000,
    discountRate: 20,
    category: '가전',
    subCategory: 'TV/모니터',
    brand: 'LG전자',
    imageUrl: '/api/placeholder/hotdeal-thumb?text=LG+StanByMe&bg=%23FF6B00',
    sourceUrl: 'https://www.lge.co.kr/',
    sourceSite: 'LG전자 공식몰',
    viewCount: 6543,
    likeCount: 432,
    commentCount: 87,
    status: 'active',
    shippingFee: 0,
    shippingType: '무료설치',
    endDate: new Date('2024-12-25'),
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2024-12-19'),
    tags: ['스탠바이미', '무선스크린', 'LG', '연말특가'],
    seller: 'LG전자',
    deliveryInfo: '설치기사 방문'
  },
  {
    id: '4',
    title: '레노버 씽크패드 X1 Carbon Gen 11 i7/16GB/512GB - 비즈니스 특가',
    price: 1890000,
    originalPrice: 2490000,
    discountRate: 24,
    category: '전자기기',
    subCategory: '노트북',
    brand: 'Lenovo',
    imageUrl: '/api/placeholder/hotdeal-thumb?text=ThinkPad+X1&bg=%23FF0000',
    sourceUrl: 'https://www.lenovo.com/kr/ko/',
    sourceSite: '레노버 코리아',
    viewCount: 4321,
    likeCount: 234,
    commentCount: 56,
    status: 'active',
    shippingFee: 0,
    shippingType: '무료배송',
    endDate: new Date('2024-12-28'),
    createdAt: new Date('2024-12-18'),
    updatedAt: new Date('2024-12-20'),
    tags: ['씽크패드', '비즈니스노트북', 'i7', '프리미엄'],
    seller: '레노버 공식',
    deliveryInfo: '재고보유시 익일발송'
  },
  {
    id: '5',
    title: '다이슨 V15 디텍트 앱솔루트 무선청소기 - 크리스마스 한정특가',
    price: 798000,
    originalPrice: 998000,
    discountRate: 20,
    category: '가전',
    subCategory: '청소기',
    brand: 'Dyson',
    imageUrl: '/api/placeholder/hotdeal-thumb?text=Dyson+V15&bg=%23FFD700',
    sourceUrl: 'https://www.dyson.co.kr/',
    sourceSite: '다이슨 공식몰',
    viewCount: 7890,
    likeCount: 654,
    commentCount: 198,
    status: 'active',
    shippingFee: 0,
    shippingType: '무료배송',
    endDate: new Date('2024-12-25'),
    createdAt: new Date('2024-12-05'),
    updatedAt: new Date('2024-12-20'),
    tags: ['다이슨', '무선청소기', 'V15', '크리스마스'],
    seller: '다이슨코리아',
    deliveryInfo: '당일출고'
  },
  {
    id: '6',
    title: '삼성 갤럭시 워치6 클래식 47mm - 갤럭시 구매고객 추가할인',
    price: 329000,
    originalPrice: 459000,
    discountRate: 28,
    category: '전자기기',
    subCategory: '웨어러블',
    brand: '삼성전자',
    imageUrl: '/api/placeholder/hotdeal-thumb?text=Galaxy+Watch6&bg=%23000000',
    sourceUrl: 'https://www.samsung.com/sec/',
    sourceSite: '삼성전자',
    viewCount: 5432,
    likeCount: 345,
    commentCount: 89,
    status: 'active',
    shippingFee: 0,
    shippingType: '무료배송',
    endDate: new Date('2024-12-30'),
    createdAt: new Date('2024-12-12'),
    updatedAt: new Date('2024-12-19'),
    tags: ['갤럭시워치', '스마트워치', '웨어러블', '세트할인'],
    seller: '삼성전자',
    deliveryInfo: '2-3일 이내'
  },
  {
    id: '7',
    title: 'ASUS 젠북 14 OLED i5/16GB/512GB - 가성비 끝판왕',
    price: 990000,
    originalPrice: 1390000,
    discountRate: 29,
    category: '전자기기',
    subCategory: '노트북',
    brand: 'ASUS',
    imageUrl: '/api/placeholder/hotdeal-thumb?text=ASUS+ZenBook&bg=%230066CC',
    sourceUrl: 'https://www.asus.com/kr/',
    sourceSite: 'ASUS 코리아',
    viewCount: 6789,
    likeCount: 456,
    commentCount: 134,
    status: 'active',
    shippingFee: 0,
    shippingType: '무료배송',
    endDate: null,
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-20'),
    tags: ['젠북', 'OLED', '가성비노트북', 'i5'],
    seller: 'ASUS 공식',
    deliveryInfo: '재고보유'
  },
  {
    id: '8',
    title: '필립스 3000시리즈 전자동 에스프레소 머신 - 연말 깜짝특가',
    price: 399000,
    originalPrice: 599000,
    discountRate: 33,
    category: '가전',
    subCategory: '주방가전',
    brand: 'Philips',
    imageUrl: '/api/placeholder/hotdeal-thumb?text=Philips+Coffee&bg=%238B4513',
    sourceUrl: 'https://www.philips.co.kr/',
    sourceSite: '필립스',
    viewCount: 3456,
    likeCount: 234,
    commentCount: 67,
    status: 'active',
    shippingFee: 0,
    shippingType: '무료배송',
    endDate: new Date('2024-12-31'),
    createdAt: new Date('2024-12-14'),
    updatedAt: new Date('2024-12-19'),
    tags: ['커피머신', '에스프레소', '필립스', '주방가전'],
    seller: '필립스코리아',
    deliveryInfo: '3-5일'
  },
  {
    id: '9',
    title: 'iPad Air 5세대 Wi-Fi 64GB - 애플케어플러스 포함가',
    price: 779000,
    originalPrice: 929000,
    discountRate: 16,
    category: '전자기기',
    subCategory: '태블릿',
    brand: 'Apple',
    imageUrl: '/api/placeholder/hotdeal-thumb?text=iPad+Air&bg=%23FF69B4',
    sourceUrl: 'https://www.apple.com/kr/',
    sourceSite: 'Apple Store',
    viewCount: 8901,
    likeCount: 678,
    commentCount: 156,
    status: 'active',
    shippingFee: 0,
    shippingType: '무료배송',
    endDate: null,
    createdAt: new Date('2024-12-07'),
    updatedAt: new Date('2024-12-20'),
    tags: ['아이패드', 'iPad', '태블릿', '애플케어'],
    seller: 'Apple',
    deliveryInfo: '당일픽업가능'
  },
  {
    id: '10',
    title: '델 XPS 13 Plus i7/32GB/1TB - 개발자 추천 스펙',
    price: 2190000,
    originalPrice: 2790000,
    discountRate: 22,
    category: '전자기기',
    subCategory: '노트북',
    brand: 'Dell',
    imageUrl: '/api/placeholder/hotdeal-thumb?text=Dell+XPS+13&bg=%231E90FF',
    sourceUrl: 'https://www.dell.com/ko-kr/',
    sourceSite: 'Dell 코리아',
    viewCount: 3210,
    likeCount: 198,
    commentCount: 43,
    status: 'active',
    shippingFee: 0,
    shippingType: '무료배송',
    endDate: new Date('2024-12-27'),
    createdAt: new Date('2024-12-16'),
    updatedAt: new Date('2024-12-20'),
    tags: ['XPS', '프리미엄노트북', '개발자', 'i7'],
    seller: 'Dell',
    deliveryInfo: '맞춤제작 7-10일'
  }
];

// 한국식 이름 생성기
export const koreanNames = {
  lastNames: ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'],
  firstNames: ['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준우', '준서', '건우', '도현', '현우', '지훈', '서연', '지우', '서현', '민서', '하은', '지아', '하윤', '윤서', '지유', '채원'],
  
  generateName(): string {
    const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
    const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
    return `${lastName}${firstName}`;
  }
};

// 실제 같은 댓글 템플릿
export const commentTemplates = [
  '이 가격이면 대박이네요! 바로 구매했습니다 ㅎㅎ',
  '작년에 비싼 가격에 샀는데... ㅠㅠ 지금 사시는 분들 부럽네요',
  '배송 빠르고 좋아요! 추천합니다',
  '품절되기 전에 얼른 사세요~ 이 가격은 다시 없을듯',
  '카드할인 받으면 더 싸게 살 수 있어요!',
  '실제로 써보니 정말 좋네요. 강추!',
  '이거 진짜 핫딜맞나요? 너무 싸서 의심되네 ㅋㅋ',
  '드디어 기다리던 세일이다!! 바로 질렀습니다',
  '재고 얼마 안 남았대요. 서두르세요!',
  '친구한테도 추천했어요. 이 가격은 정말 혜자',
  '리뷰 보고 고민하다가 결국 샀는데 만족합니다',
  '역대급 가격이네요. 바로 구매 ㄱㄱ',
  '쿠폰 적용하면 추가할인 되요!',
  '품질 대비 가격이 정말 좋아요',
  '무료배송까지 되니까 더 좋네요 ㅎㅎ'
];

// 실제 배송지 데이터
export const deliveryAddresses = [
  { city: '서울특별시', district: '강남구', detail: '테헤란로 123' },
  { city: '서울특별시', district: '송파구', detail: '올림픽로 456' },
  { city: '경기도', district: '성남시 분당구', detail: '판교로 789' },
  { city: '부산광역시', district: '해운대구', detail: '해운대로 321' },
  { city: '대구광역시', district: '수성구', detail: '수성로 654' },
  { city: '인천광역시', district: '연수구', detail: '송도대로 987' },
  { city: '경기도', district: '수원시 영통구', detail: '영통로 147' },
  { city: '서울특별시', district: '마포구', detail: '와우산로 258' },
  { city: '서울특별시', district: '서초구', detail: '반포대로 369' },
  { city: '경기도', district: '고양시 일산동구', detail: '중앙로 741' }
];

// 카테고리별 실제 상품 키워드
export const categoryKeywords = {
  '전자기기': ['갤럭시', '아이폰', '맥북', '아이패드', '에어팟', '갤럭시버즈', '노트북', 'SSD', '모니터', '키보드'],
  '가전': ['세탁기', '냉장고', '에어컨', 'TV', '공기청정기', '청소기', '전자레인지', '에어프라이어', '커피머신', '믹서기'],
  '패션': ['나이키', '아디다스', '유니클로', '자라', '코트', '패딩', '운동화', '가방', '지갑', '시계'],
  '뷰티': ['에스티로더', 'SK-II', '설화수', '아이오페', '마스크팩', '선크림', '쿠션', '립스틱', '향수', '세럼'],
  '식품': ['홍삼', '비타민', '프로틴', '견과류', '올리브오일', '와인', '커피원두', '차', '꿀', '건강식품'],
  '생활용품': ['침구', '수건', '주방용품', '수납용품', '욕실용품', '청소용품', '인테리어소품', '캔들', '디퓨저', '화분'],
  '유아동': ['기저귀', '분유', '젖병', '유모차', '카시트', '아기띠', '장난감', '동화책', '아동복', '신발'],
  '스포츠': ['골프클럽', '요가매트', '런닝화', '헬스장갑', '텐트', '등산화', '자전거', '수영복', '스키장비', '캠핑용품']
};