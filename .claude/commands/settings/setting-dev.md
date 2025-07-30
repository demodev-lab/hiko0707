### 즉시 시작 가능한 개발 환경 설정
```bash
# Next.js 15 프로젝트 생성
pnpm create next-app@latest . --typescript --tailwind --app

# shadcn/ui 초기화
pnpx shadcn@latest init

# 필수 패키지 설치
pnpm add @tanstack/react-query jotai lucide-react zod
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react vite-tsconfig-paths

# 폴더 구조 생성
mkdir -p src/{actions,lib/{db/local/{repositories,models,utils},auth,},hooks,states,types}
```

# Next.js 웹 서비스 기술 스택 & 폴더 구조 가이드 (로컬 스토리지 기반)

## 🚀 기술 스택

### 프론트엔드
- **Next.js 15** - React 19 기반 풀스택 프레임워크
- **Tailwind CSS v3** - 유틸리티 퍼스트 CSS 프레임워크
- **shadcn/ui** - Tailwind 기반 고품질 컴포넌트 라이브러리
- **Lucide React** - 가벼운 아이콘 라이브러리

### 상태 관리 & 데이터
- **Jotai** - 원자 단위 전역 상태 관리
- **TanStack Query (React Query)** - 서버 상태 관리 및 데이터 페칭
- **Local Storage** - 로컬 데이터 저장소

### 개발 환경
- **TypeScript** - 타입 안전성
- **Vitest** - 빠른 테스트 러너
- **pnpm** - 효율적인 패키지 매니저
- **Vercel** - 최적화된 배포 플랫폼

## 📁 프로젝트 폴더 구조

```
/
├── .env.local                    # 환경 변수
├── .env.example                  # 환경 변수 예시
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.mts
├── README.md
│
├── public/                       # 정적 파일
│   ├── favicon.ico
│   ├── images/
│   └── icons/
│
├── src/
│   ├── app/                      # Next.js App Router (라우팅 전용)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   │
│   │   ├── (auth)/              # 라우트 그룹
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                 # API 라우트 (최소한으로 사용)
│   │       └── webhook/
│   │           └── route.ts
│   │
│   ├── actions/                  # Server Actions (API 대신 우선 사용)
│   │   ├── auth-actions.ts
│   │   ├── user-actions.ts
│   │   └── post-actions.ts
│   │
│   ├── components/               # 재사용 가능한 컴포넌트
│   │   ├── ui/                  # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── dialog.tsx
│   │   │
│   │   ├── forms/               # 폼 관련 컴포넌트
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── contact-form.tsx
│   │   │
│   │   ├── layout/              # 레이아웃 컴포넌트
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── navigation.tsx
│   │   │
│   │   ├── features/            # 기능별 컴포넌트
│   │   │   ├── auth/
│   │   │   │   ├── auth-provider.tsx
│   │   │   │   └── protected-route.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── stats-card.tsx
│   │   │   │   └── recent-activity.tsx
│   │   │   └── posts/
│   │   │       ├── post-list.tsx
│   │   │       ├── post-item.tsx
│   │   │       └── post-create.tsx
│   │   │
│   │   └── common/              # 공통 컴포넌트
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── confirmation-dialog.tsx
│   │       └── theme-provider.tsx
│   │
│   ├── hooks/                   # 커스텀 훅
│   │   ├── use-auth.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-local-db.ts
│   │   ├── use-debounce.ts
│   │   └── use-media-query.ts
│   │
│   ├── lib/                     # 라이브러리 설정 및 유틸리티
│   │   ├── utils.ts            # 공통 유틸 함수 (cn 함수 등)
│   │   ├── validations.ts      # Zod 스키마
│   │   ├── constants.ts        # 앱 전역 상수
│   │   │
│   │   ├── auth/               # 인증 관련
│   │   │   ├── config.ts
│   │   │   └── providers.ts
│   │   │
│   │   └── db/                 # 로컬 스토리지 DB 구현
│   │       ├── storage.ts      # 로컬 스토리지 래퍼
│   │       ├── database-service.ts # DB 서비스 레이어
│   │       ├── mock-data.ts    # 초기 목 데이터
│   │       ├── repositories/
│   │       │   ├── base-repository.ts
│   │       │   ├── user-repository.ts
│   │       │   ├── post-repository.ts
│   │       │   ├── comment-repository.ts
│   │       │   └── tag-repository.ts
│   │       ├── models/
│   │       │   ├── user.ts
│   │       │   ├── post.ts
│   │       │   ├── comment.ts
│   │       │   └── tag.ts
│   │       └── utils/
│   │           ├── query-builder.ts
│   │           ├── relationships.ts
│   │           └── validation.ts
│   │
│   ├── states/                  # 전역 상태 (Jotai atoms)
│   │   ├── auth-store.ts
│   │   ├── ui-store.ts
│   │   └── user-store.ts
│   │
│   ├── styles/                  # 스타일 관련
│   │   ├── globals.css         # Tailwind 설정
│   │   └── components.css      # 커스텀 컴포넌트 스타일
│   │
│   └── types/                   # TypeScript 타입 정의
│       ├── auth.ts
│       ├── database.ts
│       ├── api.ts
│       └── global.d.ts
│
├── tests/                       # 테스트 파일
│   ├── __mocks__/
│   ├── setup.ts
│   ├── components/
│   │   └── button.test.tsx
│   ├── hooks/
│   │   └── use-auth.test.ts
│   └── pages/
│       └── home.test.tsx
│
├── docs/                        # 프로젝트 문서
│   ├── api.md
│   ├── deployment.md
│   └── contributing.md
│
└── scripts/                     # 빌드/배포 스크립트
    ├── build.sh
    └── deploy.sh
```

## 🛠️ 핵심 설정 파일

### package.json
```json
{
  "name": "my-nextjs-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:watch": "vitest --watch"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
    "jotai": "^2.0.0",
    "lucide-react": "^0.400.0",
    "tailwindcss": "^3.4.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0"
  }
}
```

### vitest.config.mts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
```

## 🗄️ 로컬 스토리지 DB 구조 및 구현

### 로컬 스토리지 DB 아키텍처

```typescript
// src/lib/db/storage.ts - 로컬 스토리지 래퍼
export class LocalStorage {
  private static instance: LocalStorage
  private prefix = 'myapp_'

  static getInstance(): LocalStorage {
    if (!LocalStorage.instance) {
      LocalStorage.instance = new LocalStorage()
    }
    return LocalStorage.instance
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(
        `${this.prefix}${key}`, 
        JSON.stringify(value)
      )
    } catch (error) {
      console.error('LocalStorage set error:', error)
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('LocalStorage get error:', error)
      return null
    }
  }

  remove(key: string): void {
    localStorage.removeItem(`${this.prefix}${key}`)
  }

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key))
  }
}
```

### 베이스 리포지토리 패턴

```typescript
// src/lib/db/repositories/base-repository.ts
export abstract class BaseRepository<T extends { id: string }> {
  protected storage = LocalStorage.getInstance()
  protected abstract tableName: string

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  async findAll(): Promise<T[]> {
    const data = this.storage.get<T[]>(this.tableName)
    return data || []
  }

  async findById(id: string): Promise<T | null> {
    const items = await this.findAll()
    return items.find(item => item.id === id) || null
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const items = await this.findAll()
    const newItem = { ...data, id: this.generateId() } as T
    items.push(newItem)
    this.storage.set(this.tableName, items)
    return newItem
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const items = await this.findAll()
    const index = items.findIndex(item => item.id === id)
    
    if (index === -1) return null
    
    items[index] = { ...items[index], ...data }
    this.storage.set(this.tableName, items)
    return items[index]
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.findAll()
    const filteredItems = items.filter(item => item.id !== id)
    
    if (filteredItems.length === items.length) return false
    
    this.storage.set(this.tableName, filteredItems)
    return true
  }

  async deleteAll(): Promise<void> {
    this.storage.remove(this.tableName)
  }
}
```

### 모델 정의

```typescript
// src/lib/db/models/user.ts
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

// src/lib/db/models/post.ts
export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
}

// src/lib/db/models/comment.ts
export interface Comment {
  id: string
  content: string
  postId: string
  authorId: string
  parentId?: string // 대댓글용
  createdAt: Date
  updatedAt: Date
}
```

### 구체적인 리포지토리 구현

```typescript
// src/lib/db/repositories/user-repository.ts
import { BaseRepository } from './base-repository'
import { User } from '../models/user'

export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users'

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findAll()
    return users.find(user => user.email === email) || null
  }

  async findByName(name: string): Promise<User[]> {
    const users = await this.findAll()
    return users.filter(user => 
      user.name.toLowerCase().includes(name.toLowerCase())
    )
  }
}

// src/lib/db/repositories/post-repository.ts
import { BaseRepository } from './base-repository'
import { Post } from '../models/post'

export class PostRepository extends BaseRepository<Post> {
  protected tableName = 'posts'

  async findByAuthor(authorId: string): Promise<Post[]> {
    const posts = await this.findAll()
    return posts.filter(post => post.authorId === authorId)
  }

  async findByStatus(status: Post['status']): Promise<Post[]> {
    const posts = await this.findAll()
    return posts.filter(post => post.status === status)
  }

  async findByTag(tag: string): Promise<Post[]> {
    const posts = await this.findAll()
    return posts.filter(post => post.tags.includes(tag))
  }

  async search(query: string): Promise<Post[]> {
    const posts = await this.findAll()
    return posts.filter(post => 
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.content.toLowerCase().includes(query.toLowerCase())
    )
  }
}
```

### 초기 목 데이터

```typescript
// src/lib/db/mock-data.ts
import { User } from './models/user'
import { Post } from './models/post'
import { Comment } from './models/comment'

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'john@example.com',
    name: 'John Doe',
    avatar: 'https://avatar.vercel.sh/john',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    avatar: 'https://avatar.vercel.sh/jane',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
]

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Getting Started with Next.js',
    content: 'Next.js is a powerful React framework...',
    authorId: '1',
    tags: ['nextjs', 'react', 'tutorial'],
    status: 'published',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '2',
    title: 'Advanced TypeScript Tips',
    content: 'Here are some advanced TypeScript techniques...',
    authorId: '2',
    tags: ['typescript', 'javascript', 'tips'],
    status: 'published',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
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
  }
]

// 초기 데이터 로드 함수
export function initializeMockData(): void {
  const storage = LocalStorage.getInstance()
  
  // 이미 데이터가 있는지 확인
  const existingUsers = storage.get<User[]>('users')
  if (!existingUsers || existingUsers.length === 0) {
    storage.set('users', mockUsers)
    storage.set('posts', mockPosts)
    storage.set('comments', mockComments)
    console.log('Mock data initialized')
  }
}
```

### 데이터베이스 서비스 레이어

```typescript
// src/lib/db/database-service.ts
import { UserRepository } from './repositories/user-repository'
import { PostRepository } from './repositories/post-repository'
import { CommentRepository } from './repositories/comment-repository'
import { initializeMockData } from './mock-data'

export class DatabaseService {
  private static instance: DatabaseService
  
  public users: UserRepository
  public posts: PostRepository
  public comments: CommentRepository

  private constructor() {
    this.users = new UserRepository()
    this.posts = new PostRepository()
    this.comments = new CommentRepository()
    
    // 초기 데이터 로드
    initializeMockData()
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // 모든 테이블 초기화
  async clearAllData(): Promise<void> {
    await this.users.deleteAll()
    await this.posts.deleteAll()
    await this.comments.deleteAll()
  }

  // 백업 생성
  async backup(): Promise<string> {
    const data = {
      users: await this.users.findAll(),
      posts: await this.posts.findAll(),
      comments: await this.comments.findAll(),
      timestamp: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  // 백업 복원
  async restore(backupData: string): Promise<void> {
    try {
      const data = JSON.parse(backupData)
      
      await this.clearAllData()
      
      // 데이터 복원
      const storage = LocalStorage.getInstance()
      storage.set('users', data.users)
      storage.set('posts', data.posts)
      storage.set('comments', data.comments)
      
      console.log('Data restored successfully')
    } catch (error) {
      console.error('Failed to restore data:', error)
      throw error
    }
  }
}

// 편의를 위한 싱글톤 인스턴스 export
export const db = DatabaseService.getInstance()
```

### 사용 예시

```typescript
// src/hooks/use-local-db.ts
import { useState, useEffect } from 'react'
import { db } from '@/lib/db/database-service'
import { User, Post } from '@/lib/db/models'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await db.users.findAll()
        setUsers(data)
      } catch (error) {
        console.error('Failed to load users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const createUser = async (userData: Omit<User, 'id'>) => {
    try {
      const newUser = await db.users.create(userData)
      setUsers(prev => [...prev, newUser])
      return newUser
    } catch (error) {
      console.error('Failed to create user:', error)
      throw error
    }
  }

  return { users, loading, createUser }
}

// 컴포넌트에서 사용
function UserList() {
  const { users, loading, createUser } = useUsers()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

## 🎯 개발 워크플로우

### 1. 기능 구현 프로세스
1. **요구사항 분석** → 구체적인 구현 계획 수립
2. **계획 검토** → 사용자 승인 후 진행
3. **단계적 구현** → 작은 단위로 세분화하여 진행
4. **로깅 및 디버깅** → 각 단계마다 충분한 로그 추가
5. **테스트 및 검증** → 각 단계별 동작 확인

### 2. 명명 규칙
- **파일명**: `kebab-case` (예: `user-profile.tsx`)
- **컴포넌트**: `PascalCase` (예: `UserProfile`)
- **함수/변수**: `camelCase` (예: `getUserData`)
- **상수**: `UPPER_SNAKE_CASE` (예: `API_BASE_URL`)

### 3. 컴포넌트 구조 패턴
```typescript
// 1. Imports (외부 라이브러리 → 내부 모듈)
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Types/Interfaces
interface UserProfileProps {
  userId: string
}

// 3. Main Component
export function UserProfile({ userId }: UserProfileProps) {
  // 4. Hooks and State
  const [loading, setLoading] = useState(false)
  
  // 5. Event Handlers
  const handleSave = () => {
    // 구현
  }
  
  // 6. Early Returns
  if (loading) return <div>Loading...</div>
  
  // 7. Main Render
  return (
    <div>
      {/* 컴포넌트 내용 */}
    </div>
  )
}

// 8. Sub-components (필요한 경우)
function ProfileHeader() {
  return <div>Header</div>
}
```

## 🚀 React 19 & Next.js 15 최적화

### Server Components 우선 사용
- **'use client' 최소화** - 클라이언트 컴포넌트 사용을 필요한 경우에만 제한
- **Server Actions 활용** - API 라우트 대신 Server Actions 우선 사용

### Async Runtime APIs 사용
```typescript
// 올바른 사용법
const cookieStore = await cookies()
const headersList = await headers()
const params = await props.params
```

### 성능 최적화
- **Code Splitting** - 동적 import 활용
- **Image Optimization** - Next.js Image 컴포넌트 사용
- **Bundle Analysis** - `@next/bundle-analyzer` 활용

### 보안
- **환경 변수 관리** - `.env.local` 사용
- **CSRF 보호** - Server Actions 활용
- **타입 안전성** - Zod를 통한 런타임 검증
