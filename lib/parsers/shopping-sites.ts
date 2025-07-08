export interface ParsedProduct {
  title: string
  price: number
  originalPrice?: number
  imageUrl: string
  description?: string
  seller?: string
  category?: string
  brand?: string
  options?: string[]
  shippingInfo?: string
  source: string
  sourceUrl: string
}

export interface SiteParser {
  name: string
  domains: string[]
  parse: (url: string) => Promise<ParsedProduct | null>
}

// Mock parsers for demo - in production, these would make actual API calls or use web scraping
const mockProducts: Record<string, ParsedProduct> = {
  'coupang': {
    title: '삼성전자 갤럭시 버즈2 프로 블루투스 이어폰',
    price: 189000,
    originalPrice: 279000,
    imageUrl: 'https://thumbnail6.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/123456.jpg',
    description: '최신 노이즈 캔슬링 기능을 탑재한 프리미엄 무선 이어폰',
    seller: '쿠팡',
    category: '전자제품',
    brand: '삼성전자',
    options: ['그라파이트', '보라퍼플', '화이트'],
    shippingInfo: '로켓배송 - 내일(금) 도착 보장',
    source: 'coupang',
    sourceUrl: ''
  },
  '11st': {
    title: 'LG 올레드 TV 55인치 OLED55C3KNA',
    price: 1590000,
    originalPrice: 2190000,
    imageUrl: 'https://cdn.011st.com/11dims/resize/600x600/quality/75/11src/product/123456.jpg',
    description: '차세대 α9 AI 프로세서 6세대 탑재 프리미엄 OLED TV',
    seller: 'LG전자 공식스토어',
    category: '가전/TV',
    brand: 'LG전자',
    options: ['55인치', '65인치', '77인치'],
    shippingInfo: '무료배송',
    source: '11st',
    sourceUrl: ''
  },
  'gmarket': {
    title: '나이키 에어맥스 97 트리플 블랙',
    price: 139000,
    originalPrice: 219000,
    imageUrl: 'https://gdimg.gmarket.co.kr/goods_image/123456.jpg',
    description: '편안한 착화감의 나이키 대표 스니커즈',
    seller: '나이키 공식 스토어',
    category: '패션/신발',
    brand: '나이키',
    options: ['250', '260', '270', '280'],
    shippingInfo: '무료배송',
    source: 'gmarket',
    sourceUrl: ''
  },
  'naver': {
    title: '애플 아이패드 프로 12.9 6세대 WiFi 128GB',
    price: 1399000,
    originalPrice: 1649000,
    imageUrl: 'https://shopping-phinf.pstatic.net/main_123456.jpg',
    description: 'M2 칩 탑재 최신 아이패드 프로',
    seller: '애플 공식 리셀러',
    category: '디지털/태블릿',
    brand: '애플',
    options: ['스페이스그레이', '실버'],
    shippingInfo: '오늘출발 - 내일도착',
    source: 'naver',
    sourceUrl: ''
  },
  'wemakeprice': {
    title: '다이슨 V15 디텍트 컴플리트 무선청소기',
    price: 799000,
    originalPrice: 1099000,
    imageUrl: 'https://cdn.wemakeprice.com/product/123456.jpg',
    description: '레이저 먼지 감지 기능 탑재 프리미엄 무선청소기',
    seller: '다이슨 공식몰',
    category: '가전/청소기',
    brand: '다이슨',
    options: ['V15 디텍트', 'V15 디텍트 컴플리트'],
    shippingInfo: '무료배송',
    source: 'wemakeprice',
    sourceUrl: ''
  },
  'tmon': {
    title: '스타벅스 아메리카노 Tall 10잔 + 텀블러',
    price: 45900,
    originalPrice: 59000,
    imageUrl: 'https://img.tmon.co.kr/deals/123456.jpg',
    description: '스타벅스 아메리카노 교환권 10장 + 리유저블 텀블러',
    seller: '스타벅스',
    category: '식품/음료',
    brand: '스타벅스',
    options: ['아메리카노 10잔', '라떼 10잔'],
    shippingInfo: '모바일 쿠폰 즉시발송',
    source: 'tmon',
    sourceUrl: ''
  }
}

// Parser implementations
const coupangParser: SiteParser = {
  name: '쿠팡',
  domains: ['coupang.com', 'www.coupang.com'],
  parse: async (url: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In production, would parse the actual URL and fetch product data
    return { ...mockProducts.coupang, sourceUrl: url }
  }
}

const elevenStreetParser: SiteParser = {
  name: '11번가',
  domains: ['11st.co.kr', 'www.11st.co.kr', 'deal.11st.co.kr'],
  parse: async (url: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { ...mockProducts['11st'], sourceUrl: url }
  }
}

const gmarketParser: SiteParser = {
  name: 'G마켓',
  domains: ['gmarket.co.kr', 'www.gmarket.co.kr', 'item.gmarket.co.kr'],
  parse: async (url: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { ...mockProducts.gmarket, sourceUrl: url }
  }
}

const naverShoppingParser: SiteParser = {
  name: '네이버쇼핑',
  domains: ['shopping.naver.com', 'smartstore.naver.com', 'brand.naver.com'],
  parse: async (url: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { ...mockProducts.naver, sourceUrl: url }
  }
}

const wemakepriceParser: SiteParser = {
  name: '위메프',
  domains: ['wemakeprice.com', 'www.wemakeprice.com'],
  parse: async (url: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { ...mockProducts.wemakeprice, sourceUrl: url }
  }
}

const tmonParser: SiteParser = {
  name: '티몬',
  domains: ['tmon.co.kr', 'www.tmon.co.kr'],
  parse: async (url: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { ...mockProducts.tmon, sourceUrl: url }
  }
}

// Export all parsers
export const shoppingSiteParsers: SiteParser[] = [
  coupangParser,
  elevenStreetParser,
  gmarketParser,
  naverShoppingParser,
  wemakepriceParser,
  tmonParser,
]

// Helper function to find parser for URL
export function findParserForUrl(url: string): SiteParser | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    return shoppingSiteParsers.find(parser => 
      parser.domains.some(domain => hostname.includes(domain))
    ) || null
  } catch {
    return null
  }
}

// Main parse function
export async function parseProductUrl(url: string): Promise<ParsedProduct | null> {
  const parser = findParserForUrl(url)
  if (!parser) {
    throw new Error('Unsupported shopping site')
  }
  
  try {
    return await parser.parse(url)
  } catch (error) {
    console.error('Failed to parse product URL:', error)
    return null
  }
}