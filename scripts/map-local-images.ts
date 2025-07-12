import { writeFileSync } from 'fs'
import { join } from 'path'
import { HotDeal } from '@/types/hotdeal'
import { mockHotDeals } from '@/lib/db/mock-data'

// 카테고리별 이미지 매핑 (원본 크기 사용)
const categoryImageMap: Record<string, string[]> = {
  'electronics': [
    '/images/products/electronics/electronics_1_original.jpg',
    '/images/products/electronics/electronics_2_original.jpg',
    '/images/products/electronics/electronics_3_original.jpg',
    '/images/products/electronics/electronics_4_original.jpg',
    '/images/products/electronics/electronics_5_original.jpg'
  ],
  'beauty': [
    '/images/products/beauty/beauty_1_original.jpg',
    '/images/products/beauty/beauty_2_original.jpg',
    '/images/products/beauty/beauty_3_original.jpg',
    '/images/products/beauty/beauty_4_original.jpg',
    '/images/products/beauty/beauty_5_original.jpg'
  ],
  'home': [
    '/images/products/home/home_1_original.jpg',
    '/images/products/home/home_2_original.jpg',
    '/images/products/home/home_3_original.jpg',
    '/images/products/home/home_4_original.jpg',
    '/images/products/home/home_5_original.jpg'
  ],
  'food': [
    '/images/products/food/food_1_original.jpg',
    '/images/products/food/food_2_original.jpg',
    '/images/products/food/food_3_original.jpg',
    '/images/products/food/food_4_original.jpg',
    '/images/products/food/food_5_original.jpg'
  ],
  'sports': [
    '/images/products/sports/sports_1_original.jpg',
    '/images/products/sports/sports_2_original.jpg',
    '/images/products/sports/sports_3_original.jpg',
    '/images/products/sports/sports_4_original.jpg',
    '/images/products/sports/sports_5_original.jpg'
  ]
}

// 제품명/브랜드로 카테고리 매핑
function getProductCategory(title: string, category?: string): string {
  const lowerTitle = title.toLowerCase()
  const lowerCategory = category?.toLowerCase() || ''
  
  // 전자제품 키워드
  if (lowerTitle.includes('삼성') || lowerTitle.includes('갤럭시') || 
      lowerTitle.includes('lg') || lowerTitle.includes('노트북') ||
      lowerTitle.includes('애플') || lowerTitle.includes('에어팟') ||
      lowerTitle.includes('아이패드') || lowerTitle.includes('닌텐도') ||
      lowerTitle.includes('ps5') || lowerTitle.includes('헤드폰') ||
      lowerTitle.includes('스피커') || lowerTitle.includes('청소기') ||
      lowerCategory.includes('electronics') || lowerCategory.includes('전자')) {
    return 'electronics'
  }
  
  // 뷰티 키워드
  if (lowerTitle.includes('화장품') || lowerTitle.includes('샴푸') ||
      lowerTitle.includes('향수') || lowerTitle.includes('로레알') ||
      lowerTitle.includes('랑콤') || lowerTitle.includes('설화수') ||
      lowerCategory.includes('beauty') || lowerCategory.includes('뷰티')) {
    return 'beauty'
  }
  
  // 홈/생활용품 키워드
  if (lowerTitle.includes('매트리스') || lowerTitle.includes('침대') ||
      lowerTitle.includes('의자') || lowerTitle.includes('책상') ||
      lowerTitle.includes('가구') || lowerTitle.includes('템퍼') ||
      lowerCategory.includes('home') || lowerCategory.includes('생활') ||
      lowerCategory.includes('가구')) {
    return 'home'
  }
  
  // 스포츠 키워드
  if (lowerTitle.includes('운동') || lowerTitle.includes('덤벨') ||
      lowerTitle.includes('요가') || lowerTitle.includes('헬스') ||
      lowerTitle.includes('피트니스') || lowerTitle.includes('운동화') ||
      lowerCategory.includes('sports') || lowerCategory.includes('스포츠')) {
    return 'sports'
  }
  
  // 식품 키워드
  if (lowerTitle.includes('커피') || lowerTitle.includes('콜라') ||
      lowerTitle.includes('스타벅스') || lowerTitle.includes('초콜릿') ||
      lowerTitle.includes('과자') || lowerTitle.includes('음식') ||
      lowerCategory.includes('food') || lowerCategory.includes('식품')) {
    return 'food'
  }
  
  // 카테고리별 분포를 위해 기본 카테고리 로테이션
  return 'electronics' // 기본값
}

function generateLocalImageMapping() {
  console.log('🖼️ Generating local image mapping from existing mockup images...')
  
  const imageMapping: Record<string, string> = {}
  const categoryCounters: Record<string, number> = {
    electronics: 0,
    beauty: 0,
    home: 0,
    food: 0,
    sports: 0
  }
  
  mockHotDeals.forEach((deal, index) => {
    const category = getProductCategory(deal.title, deal.category)
    const categoryImages = categoryImageMap[category]
    
    if (categoryImages && categoryImages.length > 0) {
      // 해당 카테고리에서 순환적으로 이미지 선택
      const imageIndex = categoryCounters[category] % categoryImages.length
      const imageUrl = categoryImages[imageIndex]
      
      imageMapping[index.toString()] = imageUrl
      categoryCounters[category]++
      
      console.log(`${index + 1}. ${deal.title} → ${category}[${imageIndex + 1}] → ${imageUrl}`)
    } else {
      // 기본 이미지
      const fallbackImage = '/images/products/electronics/electronics_1_original.jpg'
      imageMapping[index.toString()] = fallbackImage
      console.log(`${index + 1}. ${deal.title} → fallback → ${fallbackImage}`)
    }
  })
  
  // JSON 파일로 저장
  const mappingPath = join(process.cwd(), 'lib', 'db', 'image-mapping.json')
  writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2))
  
  console.log(`\n💾 Local image mapping saved to: ${mappingPath}`)
  console.log(`✅ Generated ${Object.keys(imageMapping).length} image mappings from existing mockup images`)
  
  // 카테고리별 통계
  console.log('\n📊 Category distribution:')
  Object.entries(categoryCounters).forEach(([category, count]) => {
    console.log(`  - ${category}: ${count} images`)
  })
  
  return imageMapping
}

// 스크립트 직접 실행 시
if (require.main === module) {
  generateLocalImageMapping()
}

export { generateLocalImageMapping }