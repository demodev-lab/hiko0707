import { chromium, Browser, Page } from 'playwright'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { HotDeal } from '@/types/hotdeal'
import { mockHotDeals } from '@/lib/db/mock-data'

interface ScrapedImage {
  productTitle: string
  imageUrl: string
  localPath: string
  thumbnailUrl: string
}

class ImageScraper {
  private browser: Browser | null = null
  private page: Page | null = null
  private outputDir = join(process.cwd(), 'public', 'images', 'products')

  async init() {
    this.browser = await chromium.launch({ 
      headless: false, // 디버깅을 위해 브라우저 표시
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    this.page = await this.browser.newPage()
    
    // User-Agent 설정
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    
    // 출력 디렉토리 생성
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
    }
  }

  async searchProductImage(productTitle: string, brand?: string): Promise<string | null> {
    if (!this.page) throw new Error('Browser not initialized')

    try {
      // 검색어 최적화
      const searchQuery = this.optimizeSearchQuery(productTitle, brand)
      console.log(`🔍 Searching for: ${searchQuery}`)

      // 구글 이미지 검색
      await this.page.goto(`https://www.google.com/imghp?hl=ko`)
      await this.page.waitForSelector('input[name="q"]')
      
      // 검색어 입력
      await this.page.fill('input[name="q"]', searchQuery)
      await this.page.press('input[name="q"]', 'Enter')
      
      // 이미지 탭으로 이동 (이미 이미지 검색이면 스킵)
      try {
        await this.page.waitForSelector('a[href*="tbm=isch"]', { timeout: 3000 })
        await this.page.click('a[href*="tbm=isch"]')
      } catch {
        // 이미 이미지 탭인 경우
      }

      // 이미지 결과 로딩 대기
      await this.page.waitForSelector('div[data-ri="0"] img', { timeout: 10000 })
      
      // 첫 번째 이미지 클릭
      await this.page.click('div[data-ri="0"] img')
      await this.page.waitForTimeout(2000)

      // 큰 이미지 URL 추출
      const imageUrl = await this.page.evaluate(() => {
        // 여러 가능한 셀렉터 시도
        const selectors = [
          'img[src*="encrypted-tbn0.gstatic.com"]',
          'img[data-iid]',
          'div[data-ri="0"] img',
          'img[jsname]'
        ]
        
        for (const selector of selectors) {
          const img = document.querySelector(selector) as HTMLImageElement
          if (img && img.src && !img.src.includes('data:') && img.src.includes('http')) {
            return img.src
          }
        }
        return null
      })

      if (imageUrl) {
        console.log(`✅ Found image: ${imageUrl}`)
        return imageUrl
      } else {
        console.log(`❌ No suitable image found for: ${searchQuery}`)
        return null
      }

    } catch (error) {
      console.error(`Error searching for ${productTitle}:`, error)
      return null
    }
  }

  private optimizeSearchQuery(title: string, brand?: string): string {
    // 제품명에서 불필요한 단어 제거
    let cleanTitle = title
      .replace(/\[.*?\]/g, '') // 대괄호 제거
      .replace(/\(.*?\)/g, '') // 소괄호 제거
      .replace(/특가|할인|무료배송|한정|이벤트/g, '') // 마케팅 단어 제거
      .replace(/\d+%\s*할인/g, '') // 할인율 제거
      .trim()

    // 브랜드가 있으면 추가
    if (brand && !cleanTitle.includes(brand)) {
      cleanTitle = `${brand} ${cleanTitle}`
    }

    return cleanTitle
  }

  async downloadImage(imageUrl: string, fileName: string): Promise<string | null> {
    if (!this.page) throw new Error('Browser not initialized')

    try {
      console.log(`📥 Downloading: ${imageUrl}`)
      
      // 새 탭에서 이미지 다운로드
      const newPage = await this.browser!.newPage()
      const response = await newPage.goto(imageUrl)
      
      if (response && response.ok()) {
        const buffer = await response.body()
        const filePath = join(this.outputDir, fileName)
        writeFileSync(filePath, buffer)
        await newPage.close()
        
        console.log(`✅ Downloaded: ${filePath}`)
        return `/images/products/${fileName}`
      }
      
      await newPage.close()
      return null
    } catch (error) {
      console.error(`Error downloading ${imageUrl}:`, error)
      return null
    }
  }

  async scrapeHotDealImages(deals: HotDeal[], maxItems: number = 10): Promise<ScrapedImage[]> {
    const results: ScrapedImage[] = []
    
    for (let i = 0; i < Math.min(deals.length, maxItems); i++) {
      const deal = deals[i]
      console.log(`\n📦 Processing ${i + 1}/${maxItems}: ${deal.title}`)
      
      try {
        // 이미지 검색
        const imageUrl = await this.searchProductImage(deal.title, deal.seller)
        
        if (imageUrl) {
          // 파일명 생성
          const fileName = `${deal.category}_${i + 1}_${Date.now()}.jpg`
          
          // 이미지 다운로드
          const localPath = await this.downloadImage(imageUrl, fileName)
          
          if (localPath) {
            results.push({
              productTitle: deal.title,
              imageUrl: imageUrl,
              localPath: localPath,
              thumbnailUrl: localPath
            })
          }
        }
        
        // 요청 간격 (구글 차단 방지)
        await this.page!.waitForTimeout(3000 + Math.random() * 2000)
        
      } catch (error) {
        console.error(`Error processing ${deal.title}:`, error)
        continue
      }
    }
    
    return results
  }

  async updateHotDealsWithImages(scrapedImages: ScrapedImage[]): Promise<void> {
    // 스크래핑된 이미지 정보를 파일로 저장
    const imageMapping = scrapedImages.reduce((acc, img, index) => {
      acc[index] = img.localPath
      return acc
    }, {} as Record<number, string>)
    
    const mappingPath = join(process.cwd(), 'lib', 'db', 'image-mapping.json')
    writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2))
    
    console.log(`💾 Image mapping saved to: ${mappingPath}`)
    console.log('📋 Results:')
    scrapedImages.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.productTitle} → ${img.localPath}`)
    })
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
    }
  }
}

// 실행 함수
async function main() {
  const scraper = new ImageScraper()
  
  try {
    console.log('🚀 Starting image scraping...')
    await scraper.init()
    
    // 처음 10개 핫딜에 대해 이미지 수집
    const results = await scraper.scrapeHotDealImages(mockHotDeals, 10)
    
    // 결과 저장
    await scraper.updateHotDealsWithImages(results)
    
    console.log(`\n🎉 Completed! Successfully scraped ${results.length} images.`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await scraper.close()
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main()
}

export { ImageScraper }