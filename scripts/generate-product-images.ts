import { writeFileSync } from 'fs'
import { join } from 'path'
import { HotDeal } from '@/types/hotdeal'
import { mockHotDeals } from '@/lib/db/mock-data'

// 실제 제품별 대표 이미지 URL 매핑
const productImageMap: Record<string, string> = {
  // 전자제품
  '삼성': 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400&h=300&fit=crop',
  '갤럭시': 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400&h=300&fit=crop',
  'LG': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
  '노트북': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
  '애플': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
  '에어팟': 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=300&fit=crop',
  '다이슨': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
  '청소기': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
  '소니': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  '헤드폰': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  '아이패드': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
  '닌텐도': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop',
  'PS5': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop',
  '샤오미': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
  '공기청정기': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
  '보스': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  '스피커': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',

  // 패션/의류
  '유니클로': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
  '히트텍': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
  '나이키': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
  '운동화': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
  '아디다스': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
  '후드': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=300&fit=crop',
  '구찌': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
  '가방': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
  '프라다': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',

  // 뷰티
  '랑콤': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
  '화장품': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
  '설화수': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
  '로레알': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
  '샴푸': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=300&fit=crop',
  '향수': 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop',

  // 식품
  '코카콜라': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop',
  '콜라': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop',
  '스타벅스': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
  '커피': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
  '초콜릿': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=300&fit=crop',
  '과자': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=300&fit=crop',

  // 생활용품
  '템퍼': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
  '매트리스': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
  '침대': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
  '의자': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',
  '책상': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',
  '가구': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',

  // 도서
  '책': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
  '소설': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
  '자기계발': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',

  // 스포츠
  '덤벨': 'https://images.unsplash.com/photo-1571019613949-ce5b0c5b3a8a?w=400&h=300&fit=crop',
  '운동': 'https://images.unsplash.com/photo-1571019613949-ce5b0c5b3a8a?w=400&h=300&fit=crop',
  '요가매트': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
  
  // 육아
  '피셔프라이스': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop',
  '장난감': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop',
  '유모차': 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop',
  '아기': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop',
}

function findBestImageUrl(title: string, brand?: string): string {
  const searchTerms = [brand, ...title.split(' ')].filter(Boolean)
  
  // 키워드 우선순위로 매칭
  for (const term of searchTerms) {
    if (!term) continue;
    const cleanTerm = term.replace(/[^\w가-힣]/g, '')
    for (const [keyword, imageUrl] of Object.entries(productImageMap)) {
      if (cleanTerm.includes(keyword) || keyword.includes(cleanTerm)) {
        return imageUrl
      }
    }
  }
  
  // 카테고리별 기본 이미지
  const categoryImages: Record<string, string> = {
    'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
    'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
    'home': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    'food': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
    'books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
    'sports': 'https://images.unsplash.com/photo-1571019613949-ce5b0c5b3a8a?w=400&h=300&fit=crop',
    'other': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
  }
  
  return categoryImages['other'] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
}

function generateImageMapping() {
  console.log('🖼️ Generating product image mapping...')
  
  const imageMapping: Record<string, string> = {}
  const combinedDeals = mockHotDeals
  
  combinedDeals.forEach((deal, index) => {
    const imageUrl = findBestImageUrl(deal.title, deal.seller || '')
    imageMapping[index.toString()] = imageUrl
    
    console.log(`${index + 1}. ${deal.title} → ${imageUrl}`)
  })
  
  // JSON 파일로 저장
  const mappingPath = join(process.cwd(), 'lib', 'db', 'image-mapping.json')
  writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2))
  
  console.log(`\n💾 Image mapping saved to: ${mappingPath}`)
  console.log(`✅ Generated ${Object.keys(imageMapping).length} image mappings`)
  
  return imageMapping
}

// 스크립트 직접 실행 시
if (require.main === module) {
  generateImageMapping()
}

export { generateImageMapping, findBestImageUrl }