import { User, Post, Comment } from './local/models'
import { LocalStorage } from './storage'
import { HotDeal } from '@/types/hotdeal'
import hotDealMockData from './hotdeal-mock-data.json'
// import { extendedRealHotDeals } from './extended-real-data' // 추후 크롤러 개발 시 사용
import imageMappingData from './image-mapping.json'

// 이미지 URL 생성 함수
function getImageUrl(deal: any, index: number): string {
  // 스크래핑된 이미지가 있는지 확인
  const mappedImage = (imageMappingData as Record<string, string>)[index.toString()]
  if (mappedImage) {
    return mappedImage
  }
  
  // 로컬 이미지 경로인 경우 그대로 유지
  if (deal.imageUrl?.startsWith('/images/')) {
    return deal.imageUrl
  }
  
  // 기존 URL 유지, 없으면 기본 이미지
  return deal.imageUrl || '/images/products/home/home_1_original.jpg'
}

// 기존 HotDeal mock 데이터 (날짜 변환 및 이미지 URL 수정)
const baseMockHotDeals: HotDeal[] = hotDealMockData.map((deal, index) => ({
  ...deal,
  crawledAt: new Date(deal.crawledAt),
  updatedAt: new Date(deal.updatedAt),
  startDate: (deal as any).startDate ? new Date((deal as any).startDate) : undefined,
  endDate: (deal as any).endDate ? new Date((deal as any).endDate) : undefined,
  // 이미지 URL을 스크래핑된 이미지 또는 플레이스홀더로 변경
  imageUrl: getImageUrl(deal, index)
} as HotDeal))

// 임시 테스트용 - 기존 목업 데이터 사용
export const mockHotDeals: HotDeal[] = baseMockHotDeals.slice(0, 5)

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'member',
    avatar: 'https://avatar.vercel.sh/john',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    role: 'member',
    avatar: 'https://avatar.vercel.sh/jane',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  // 외국인 사용자 추가
  {
    id: '3',
    email: 'david@example.com',
    name: 'David Wang',
    role: 'member',
    avatar: 'https://avatar.vercel.sh/david',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: '4',
    email: 'maria@example.com',
    name: 'Maria Garcia',
    role: 'member',
    avatar: 'https://avatar.vercel.sh/maria',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '5',
    email: 'nguyen@example.com',
    name: 'Nguyen Tran',
    role: 'member',
    avatar: 'https://avatar.vercel.sh/nguyen',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  // 관리자 계정
  {
    id: '99',
    email: 'admin@hiko.kr',
    name: '관리자',
    role: 'admin',
    avatar: 'https://avatar.vercel.sh/admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Getting Started with Next.js',
    content: 'Next.js is a powerful React framework that enables you to build production-ready applications with ease. It provides features like server-side rendering, static site generation, and API routes out of the box.',
    authorId: '1',
    tags: ['nextjs', 'react', 'tutorial'],
    status: 'published',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '2',
    title: 'Advanced TypeScript Tips',
    content: 'Here are some advanced TypeScript techniques that will make your code more type-safe and maintainable. We will cover generics, conditional types, and utility types.',
    authorId: '2',
    tags: ['typescript', 'javascript', 'tips'],
    status: 'published',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '3',
    title: 'Building a Local Storage Database',
    content: 'Learn how to implement a simple but effective database using browser local storage. This approach is perfect for prototypes and small applications.',
    authorId: '1',
    tags: ['javascript', 'database', 'tutorial'],
    status: 'draft',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
]

export const mockComments: Comment[] = [
  {
    id: '1',
    content: 'Great article! Very helpful.',
    postId: '1',
    authorId: '2',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11')
  },
  {
    id: '2',
    content: 'Thanks for sharing these tips!',
    postId: '2',
    authorId: '1',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  }
]

export function initializeMockData(): void {
  const storage = LocalStorage.getInstance()
  
  // 사용자, 게시글, 댓글 데이터만 초기화 (없을 경우에만)
  if (!storage.get('users')) {
    storage.set('users', mockUsers)
  }
  if (!storage.get('posts')) {
    storage.set('posts', mockPosts)
  }
  if (!storage.get('comments')) {
    storage.set('comments', mockComments)
  }
  
  // 핫딜 데이터는 초기화하지 않음 (크롤링 데이터 보존)
  const existingHotDeals = storage.get('hotdeals') || []
  if (!existingHotDeals || existingHotDeals.length === 0) {
    // 빈 배열로 초기화하여 오류 방지
    storage.set('hotdeals', [])
    console.log('✅ HotDeals initialized as empty array for crawled data')
  } else {
    console.log(`✅ Existing HotDeals preserved: ${existingHotDeals.length} items`)
  }
  
  console.log('✅ Mock data initialization complete')
}

// 강제로 모든 데이터를 다시 초기화하는 함수
export function forceInitializeMockData(): void {
  const storage = LocalStorage.getInstance()
  
  storage.set('users', mockUsers)
  storage.set('posts', mockPosts)
  storage.set('comments', mockComments)
  // 핫딜은 초기화하지 않음
  
  console.log(`✅ Mock data force initialized (excluding hotdeals)`)
  console.log(`- Users: ${mockUsers.length} items`)
  console.log(`- Posts: ${mockPosts.length} items`)
  console.log(`- Comments: ${mockComments.length} items`)
}

// 핫딜 데이터를 완전히 지우는 함수
export function clearAllHotDeals(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hiko_hotdeals', '[]')
    console.log('🗑️ All HotDeals cleared from hiko_hotdeals')
  }
}

// 브라우저 전역에서 사용할 수 있도록 설정
if (typeof window !== 'undefined') {
  // window가 정의되어 있을 때만 실행
  const globalWindow = window as any
  if (globalWindow) {
    globalWindow.forceInitializeMockData = forceInitializeMockData
    globalWindow.clearAllHotDeals = clearAllHotDeals
  }
}