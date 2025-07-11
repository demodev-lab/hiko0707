export interface ParsedProductInfo {
  productName?: string
  price?: string
  imageUrl?: string
  shopName?: string
  productUrl: string
  isValid: boolean
  error?: string
}

// 지원하는 쇼핑몰 패턴
const SHOPPING_PATTERNS = {
  coupang: {
    pattern: /coupang\.com/,
    name: '쿠팡',
    productPattern: /products\/(\d+)/,
  },
  naver: {
    pattern: /smartstore\.naver\.com|shopping\.naver\.com/,
    name: '네이버 쇼핑',
    productPattern: /products\/(\d+)/,
  },
  gmarket: {
    pattern: /gmarket\.co\.kr/,
    name: 'G마켓',
    productPattern: /goods\/(\d+)/,
  },
  ssg: {
    pattern: /ssg\.com/,
    name: 'SSG닷컴',
    productPattern: /item\/(\d+)/,
  },
  '11st': {
    pattern: /11st\.co\.kr/,
    name: '11번가',
    productPattern: /products\/(\d+)/,
  },
  wemakeprice: {
    pattern: /wemakeprice\.com/,
    name: '위메프',
    productPattern: /deal\/(\d+)/,
  },
  tmon: {
    pattern: /tmon\.co\.kr/,
    name: '티몬',
    productPattern: /deal\/(\d+)/,
  },
  kakao: {
    pattern: /gift\.kakao\.com/,
    name: '카카오톡 선물하기',
    productPattern: /product\/(\d+)/,
  },
  oliveyoung: {
    pattern: /oliveyoung\.co\.kr/,
    name: '올리브영',
    productPattern: /goods\/(\d+)/,
  },
  danawa: {
    pattern: /danawa\.com/,
    name: '다나와',
    productPattern: /product\/(\d+)/,
  },
}

export class ShoppingUrlParser {
  /**
   * URL이 지원하는 쇼핑몰인지 확인
   */
  static isShoppingUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return Object.values(SHOPPING_PATTERNS).some(shop => 
        shop.pattern.test(urlObj.hostname)
      )
    } catch {
      return false
    }
  }

  /**
   * 쇼핑몰 이름 가져오기
   */
  static getShopName(url: string): string | null {
    try {
      const urlObj = new URL(url)
      const shop = Object.values(SHOPPING_PATTERNS).find(shop => 
        shop.pattern.test(urlObj.hostname)
      )
      return shop?.name || null
    } catch {
      return null
    }
  }

  /**
   * URL에서 상품 ID 추출
   */
  static extractProductId(url: string): string | null {
    try {
      const urlObj = new URL(url)
      const shop = Object.values(SHOPPING_PATTERNS).find(shop => 
        shop.pattern.test(urlObj.hostname)
      )
      
      if (!shop) return null

      const match = url.match(shop.productPattern)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  /**
   * URL 파싱 (실제 크롤링 없이 기본 정보만 추출)
   */
  static async parseUrl(url: string): Promise<ParsedProductInfo> {
    try {
      // URL 유효성 검사
      const urlObj = new URL(url)
      
      // 쇼핑몰 확인
      const shopName = this.getShopName(url)
      if (!shopName) {
        return {
          productUrl: url,
          isValid: false,
          error: '지원하지 않는 쇼핑몰입니다.'
        }
      }

      // 상품 ID 추출
      const productId = this.extractProductId(url)
      if (!productId) {
        return {
          productUrl: url,
          shopName,
          isValid: false,
          error: '상품 정보를 찾을 수 없습니다.'
        }
      }

      // 데모용 더미 데이터 생성
      const dummyData = this.generateDummyData(shopName, productId)

      return {
        ...dummyData,
        productUrl: url,
        shopName,
        isValid: true
      }
    } catch (error) {
      return {
        productUrl: url,
        isValid: false,
        error: '올바른 URL 형식이 아닙니다.'
      }
    }
  }

  /**
   * 데모용 더미 데이터 생성
   */
  private static generateDummyData(shopName: string, productId: string): Partial<ParsedProductInfo> {
    // 데모를 위한 더미 데이터
    const dummyProducts = [
      {
        productName: '[삼성전자] 갤럭시 버즈3 프로 SM-R630',
        price: '279,000',
        imageUrl: 'https://via.placeholder.com/300x300?text=Galaxy+Buds3+Pro'
      },
      {
        productName: '[애플] 에어팟 프로 2세대 USB-C',
        price: '359,000',
        imageUrl: 'https://via.placeholder.com/300x300?text=AirPods+Pro+2'
      },
      {
        productName: '[나이키] 에어맥스 97 트리플 블랙',
        price: '219,000',
        imageUrl: 'https://via.placeholder.com/300x300?text=Nike+AirMax+97'
      },
      {
        productName: '[다이슨] V15 디텍트 앱솔루트 무선청소기',
        price: '899,000',
        imageUrl: 'https://via.placeholder.com/300x300?text=Dyson+V15'
      },
      {
        productName: '[LG전자] 그램 16인치 16Z90S-GA5HK',
        price: '1,899,000',
        imageUrl: 'https://via.placeholder.com/300x300?text=LG+Gram+16'
      }
    ]

    // productId를 기반으로 더미 데이터 선택
    const index = parseInt(productId) % dummyProducts.length
    const product = dummyProducts[index]

    return {
      productName: `${product.productName} (상품번호: ${productId})`,
      price: `₩${product.price}`,
      imageUrl: product.imageUrl
    }
  }

  /**
   * URL 정규화 (추적 파라미터 제거 등)
   */
  static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      
      // 추적 파라미터 제거
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'ref', 'referrer', 'source'
      ]
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param)
      })
      
      return urlObj.toString()
    } catch {
      return url
    }
  }

  /**
   * 지원하는 쇼핑몰 목록 가져오기
   */
  static getSupportedShops(): string[] {
    return Object.values(SHOPPING_PATTERNS).map(shop => shop.name)
  }
}