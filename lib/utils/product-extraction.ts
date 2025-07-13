import { HotDeal, HotDealCategory } from '@/types/hotdeal'

// 상품 제목에서 가격 정보 제거
export function cleanProductTitle(title: string): string {
  return title
    // 가격 정보 제거 (원, 달러 등)
    .replace(/\s*\([^)]*[원$€¥]\s*[^)]*\)\s*/g, '')
    .replace(/\s*\[[^\]]*[원$€¥]\s*[^\]]*\]\s*/g, '')
    // 할인율 정보 제거
    .replace(/\s*\([^)]*%\s*할인[^)]*\)\s*/g, '')
    .replace(/\s*\[[^\]]*%\s*할인[^\]]*\]\s*/g, '')
    // 배송 정보 제거
    .replace(/\s*\([^)]*무료배송[^)]*\)\s*/g, '')
    .replace(/\s*\[[^\]]*무료배송[^\]]*\]\s*/g, '')
    // 특수 문자 정리
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
}

// 제목에서 옵션 정보 추출
export function extractProductOptions(title: string): string[] {
  const options: string[] = []
  
  // 색상 정보 추출
  const colorMatches = title.match(/(?:색상|컬러|색깔)[:：]?\s*([^,\s]+)/gi)
  if (colorMatches) {
    colorMatches.forEach(match => {
      const color = match.replace(/(?:색상|컬러|색깔)[:：]?\s*/gi, '').trim()
      if (color) options.push(`색상: ${color}`)
    })
  }
  
  // 사이즈 정보 추출
  const sizeMatches = title.match(/(?:사이즈|크기|SIZE)[:：]?\s*([^,\s]+)/gi)
  if (sizeMatches) {
    sizeMatches.forEach(match => {
      const size = match.replace(/(?:사이즈|크기|SIZE)[:：]?\s*/gi, '').trim()
      if (size) options.push(`사이즈: ${size}`)
    })
  }
  
  // 용량 정보 추출 (ml, L, g, kg 등)
  const capacityMatches = title.match(/\d+(?:\.\d+)?\s*(?:ml|ML|l|L|g|G|kg|KG|oz|OZ)/gi)
  if (capacityMatches) {
    capacityMatches.forEach(match => {
      options.push(`용량: ${match.trim()}`)
    })
  }
  
  // 개수 정보 추출
  const countMatches = title.match(/(\d+)(?:개|팩|입|매|장|병|캔)/g)
  if (countMatches) {
    countMatches.forEach(match => {
      options.push(`수량: ${match}`)
    })
  }
  
  return options
}

// 카테고리별 일반적인 옵션 제안
export function suggestOptionsByCategory(category?: string): string[] {
  if (!category) return []
  
  const categoryOptions: Record<string, string[]> = {
    'electronics': ['색상 (예: 블랙, 화이트)', '용량 (예: 64GB, 128GB)', '모델명'],
    'food': ['맛 (예: 오리지널, 매운맛)', '수량 (예: 1박스, 10개입)', '용량 (예: 500ml)'],
    'beauty': ['색상 (예: 01호, 02호)', '용량 (예: 30ml, 50ml)', '타입 (예: 매트, 글로시)'],
    'home': ['색상 (예: 화이트, 블랙)', '사이즈 (예: 대형, 소형)', '재질 (예: 스테인리스, 플라스틱)'],
    'sports': ['사이즈 (예: S, M, L, XL)', '색상', '브랜드'],
    'books': ['언어 (예: 한국어, 영어)', '판형 (예: 양장, 페이퍼백)', '에디션'],
    'travel': ['날짜', '인원수', '객실타입'],
    'other': ['색상', '사이즈', '타입']
  }
  
  return categoryOptions[category] || []
}

// 가격 정보 파싱 및 검증
export function parsePrice(priceString: string): {
  price: number
  originalPrice?: number
  discountRate?: number
  currency: string
} {
  // 숫자와 통화 기호만 추출
  const numbers = priceString.match(/[\d,]+/g)
  const currency = priceString.includes('$') ? 'USD' : 
                  priceString.includes('€') ? 'EUR' : 
                  priceString.includes('¥') ? 'JPY' : 'KRW'
  
  if (!numbers || numbers.length === 0) {
    return { price: 0, currency }
  }
  
  // 쉼표 제거하고 숫자로 변환
  const parsedNumbers = numbers.map(num => parseInt(num.replace(/,/g, '')))
  
  if (parsedNumbers.length === 1) {
    return { price: parsedNumbers[0], currency }
  }
  
  // 여러 가격이 있는 경우 (할인가, 정가)
  if (parsedNumbers.length >= 2) {
    const [discountedPrice, originalPrice] = parsedNumbers.sort((a, b) => a - b)
    const discountRate = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    
    return {
      price: discountedPrice,
      originalPrice,
      discountRate,
      currency
    }
  }
  
  return { price: parsedNumbers[0], currency }
}

// 판매자 정보 정규화
export function normalizeSeller(seller: string): string {
  return seller
    // 공통 접미사 제거
    .replace(/\s*(쇼핑몰|몰|온라인|스토어|STORE|Mall|mall)$/gi, '')
    // 특수문자 정리
    .replace(/[^\w가-힣\s]/g, '')
    .trim()
}

// 카테고리 추론
export function inferCategory(title: string, seller?: string): HotDealCategory {
  const titleLower = title.toLowerCase()
  const sellerLower = seller?.toLowerCase() || ''
  
  // 전자/IT
  if (/(스마트폰|노트북|태블릿|이어폰|헤드폰|스피커|모니터|키보드|마우스|충전기|케이블|SSD|RAM|그래픽카드|CPU|삼성|LG|애플|아이폰|갤럭시)/.test(titleLower)) {
    return 'electronics'
  }
  
  // 식품/영양
  if (/(음식|식품|과자|음료|커피|차|건강식품|영양제|비타민|단백질|프로틴|쌀|김치|라면|치킨|피자)/.test(titleLower)) {
    return 'food'
  }
  
  // 뷰티/패션
  if (/(화장품|스킨케어|메이크업|향수|립스틱|아이섀도|크림|로션|토너|세럼|마스크팩|의류|옷|신발|가방|액세서리|시계)/.test(titleLower)) {
    return 'beauty'
  }
  
  // 생활/가전
  if (/(청소기|세탁기|냉장고|에어컨|선풍기|가습기|공기청정기|전자레인지|밥솥|믹서기|주방용품|침구|수건|베개|매트리스)/.test(titleLower)) {
    return 'home'
  }
  
  // 스포츠/레저
  if (/(운동|헬스|요가|러닝|등산|캠핑|낚시|골프|테니스|축구|농구|수영|자전거|스포츠웨어|운동화|등산화)/.test(titleLower)) {
    return 'sports'
  }
  
  // 도서/문구
  if (/(책|도서|소설|만화|교재|참고서|문구|펜|연필|노트|다이어리|스티커|지우개)/.test(titleLower)) {
    return 'books'
  }
  
  // 여행/숙박
  if (/(호텔|펜션|리조트|여행|항공|숙박|펜션|모텔|게스트하우스|캠핑장)/.test(titleLower) || /(여행|항공)/.test(sellerLower)) {
    return 'travel'
  }
  
  return 'other'
}

// 통합 상품 정보 추출 함수
export function extractProductInfo(hotdeal: HotDeal) {
  const cleanTitle = cleanProductTitle(hotdeal.title)
  const extractedOptions = extractProductOptions(hotdeal.title)
  const category = inferCategory(hotdeal.title, hotdeal.seller)
  const suggestedOptions = suggestOptionsByCategory(category)
  const normalizedSeller = normalizeSeller(hotdeal.seller)
  const priceInfo = parsePrice(hotdeal.price.toString())
  
  return {
    cleanTitle,
    extractedOptions,
    suggestedOptions,
    category,
    normalizedSeller,
    priceInfo,
    // 추천 기본 수량 (카테고리별)
    recommendedQuantity: category === 'food' ? 2 : 1,
    // 특별 요청사항 제안
    suggestedRequests: getSuggestedRequests(category)
  }
}

// 카테고리별 특별 요청사항 제안
function getSuggestedRequests(category: HotDealCategory): string[] {
  const suggestions: Record<HotDealCategory, string[]> = {
    'electronics': ['AS 가능한 정품으로 부탁드립니다', '박스 포장 상태 확인 부탁드립니다'],
    'food': ['유통기한 확인 부탁드립니다', '냉장/냉동 보관이 필요한 경우 콜드체인 배송 부탁드립니다'],
    'beauty': ['유통기한 확인 부탁드립니다', '포장 상태 확인 부탁드립니다'],
    'home': ['포장 상태 확인 부탁드립니다', '파손 주의해서 배송 부탁드립니다'],
    'sports': ['사이즈 확인 부탁드립니다', '정품 확인 부탁드립니다'],
    'books': ['새 책으로 부탁드립니다', '포장 상태 확인 부탁드립니다'],
    'travel': ['예약 확인서 확인 부탁드립니다', '취소 정책 확인 부탁드립니다'],
    'other': ['상품 상태 확인 부탁드립니다']
  }
  
  return suggestions[category] || []
}