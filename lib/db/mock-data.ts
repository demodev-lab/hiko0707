import { User, Post, Comment } from './local/models'
import { LocalStorage } from './storage'
import { HotDeal } from '@/types/hotdeal'
import hotDealMockData from './hotdeal-mock-data.json'

// HotDeal mock 데이터 (날짜 변환 필요)
export const mockHotDeals: HotDeal[] = hotDealMockData.map(deal => ({
  ...deal,
  crawledAt: new Date(deal.crawledAt),
  updatedAt: new Date(deal.updatedAt),
  startDate: (deal as any).startDate ? new Date((deal as any).startDate) : undefined,
  endDate: (deal as any).endDate ? new Date((deal as any).endDate) : undefined
} as HotDeal))

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'customer',
    avatar: 'https://avatar.vercel.sh/john',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    role: 'customer',
    avatar: 'https://avatar.vercel.sh/jane',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  // 외국인 사용자 추가
  {
    id: '3',
    email: 'david@example.com',
    name: 'David Wang',
    role: 'customer',
    avatar: 'https://avatar.vercel.sh/david',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: '4',
    email: 'maria@example.com',
    name: 'Maria Garcia',
    role: 'customer',
    avatar: 'https://avatar.vercel.sh/maria',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '5',
    email: 'nguyen@example.com',
    name: 'Nguyen Tran',
    role: 'customer',
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
  
  const existingUsers = storage.get<User[]>('users')
  if (!existingUsers || existingUsers.length === 0) {
    storage.set('users', mockUsers)
    storage.set('posts', mockPosts)
    storage.set('comments', mockComments)
    console.log('Mock data initialized')
  }
  
  // HotDeal 데이터 초기화
  const existingHotDeals = storage.get<HotDeal[]>('hotdeals')
  if (!existingHotDeals || existingHotDeals.length === 0) {
    storage.set('hotdeals', mockHotDeals)
    console.log(`HotDeal mock data initialized: ${mockHotDeals.length} items`)
  }
}