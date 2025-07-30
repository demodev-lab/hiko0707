# Supabase + DrizzleORM 마이그레이션 가이드

## 🎯 목적

로컬 스토리지 기반으로 완성된 프론트엔드를 **Supabase + DrizzleORM**으로 마이그레이션하여 프로덕션 레벨 애플리케이션으로 업그레이드합니다.

---

## 📋 마이그레이션 전 체크리스트

### ✅ 필수 조건 확인
- [ ] 프론트엔드 모든 기능이 로컬 스토리지로 완전히 동작
- [ ] 모든 UI 컴포넌트가 완성되어 사용자 테스트 가능
- [ ] docs/PRD.md, docs/TODO.md, docs/business-logic.md 문서 존재
- [ ] TypeScript 에러 0개 상태
- [ ] 기본적인 테스트 코드 작성 완료

### 🚨 중요한 순서
```
✅ 프론트엔드 완성 (이미 완료)
    ↓
🔄 현재 단계: Backend 마이그레이션
    ↓
🚀 프로덕션 배포
```

---

## 🏗️ 폴더 구조 (Supabase + DrizzleORM)

```
project-root/
├── docs/
│   ├── PRD.md                    # 업데이트 필요
│   ├── TODO.md                   # 업데이트 필요  
│   ├── business-logic.md         # 업데이트 필요
│   ├── progress.md
│   ├── user-flow.md
│   └── migration-plan.md         # 신규 생성
│
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── (auth)/              # 인증 관련 페이지 그룹
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/         # 대시보드 페이지 그룹
│   │   ├── api/                 # API Routes
│   │   │   ├── auth/
│   │   │   └── webhooks/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/              # UI 컴포넌트 (기존 유지)
│   │   ├── ui/                  # shadcn/ui 컴포넌트
│   │   ├── auth/                # 인증 관련 컴포넌트
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── auth-provider.tsx
│   │   └── common/              # 공통 컴포넌트
│   │
│   ├── lib/                     # 핵심 라이브러리
│   │   ├── supabase/
│   │   │   ├── client.ts        # 클라이언트 사이드
│   │   │   ├── server.ts        # 서버 사이드  
│   │   │   ├── middleware.ts    # 미들웨어
│   │   │   └── types.ts         # Supabase 타입
│   │   ├── drizzle/
│   │   │   ├── schema.ts        # DB 스키마 정의
│   │   │   ├── migrations/      # 마이그레이션 파일들
│   │   │   ├── queries/         # 쿼리 함수들
│   │   │   │   ├── users.ts
│   │   │   │   ├── posts.ts
│   │   │   │   └── index.ts
│   │   │   └── db.ts           # DB 연결 설정
│   │   ├── auth/
│   │   │   ├── config.ts        # 인증 설정
│   │   │   ├── providers.ts     # OAuth 프로바이더
│   │   │   └── utils.ts         # 인증 유틸리티
│   │   └── utils.ts
│   │
│   ├── hooks/                   # 커스텀 훅
│   │   ├── use-auth.ts          # 인증 관련 훅
│   │   ├── use-supabase.ts      # Supabase 훅
│   │   └── use-local-storage.ts # 마이그레이션 중 임시 유지
│   │
│   ├── actions/                 # Server Actions
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── signup.ts
│   │   │   └── logout.ts
│   │   └── database/
│   │       ├── users.ts
│   │       └── posts.ts
│   │
│   ├── types/                   # 타입 정의
│   │   ├── auth.ts
│   │   ├── database.ts
│   │   └── api.ts
│   │
│   └── middleware.ts            # Next.js 미들웨어
│
├── migrations/                  # Drizzle 마이그레이션
├── .env.local                   # 환경 변수
├── .env.example                 # 환경 변수 예시
├── drizzle.config.ts           # Drizzle 설정
├── supabase/                   # Supabase 설정 (선택사항)
│   ├── config.toml
│   └── seed.sql
└── package.json
```

---

## 🚀 마이그레이션 단계별 가이드

### Phase 1: 환경 설정 및 기본 구조 (1-2일)

#### 1.1 패키지 설치
```bash
# Supabase 관련
npm install @supabase/supabase-js @supabase/ssr

# DrizzleORM 관련  
npm install drizzle-orm drizzle-kit
npm install -D @types/pg pg

# 인증 관련
npm install @supabase/auth-ui-react @supabase/auth-ui-shared

# 기타 유틸리티
npm install zod react-hook-form @hookform/resolvers
```

#### 1.2 환경 변수 설정
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
```

#### 1.3 기본 설정 파일 생성
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/lib/drizzle/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

### Phase 2: 데이터 모델링 및 스키마 설계 (2-3일)

#### 2.1 기존 로컬 데이터 분석
```typescript
// 기존 로컬 스토리지 데이터 구조 분석
const analyzeLocalData = () => {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    const data = JSON.parse(localStorage.getItem(key) || '{}')
    console.log(`Key: ${key}`, data)
  })
}
```

#### 2.2 DrizzleORM 스키마 생성
```typescript
// src/lib/drizzle/schema.ts
import { pgTable, uuid, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  author_id: uuid('author_id').references(() => users.id),
  published: boolean('published').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

// 타입 추출
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
```

#### 2.3 Supabase 설정
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// src/lib/supabase/server.ts  
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 서버 컴포넌트에서는 쿠키를 설정할 수 없음
          }
        },
      },
    }
  )
}
```

### Phase 3: 인증 시스템 구현 (3-4일)

#### 3.1 Supabase Auth 설정
```typescript
// src/lib/auth/config.ts
export const authConfig = {
  providers: ['google', 'github'],
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  appearance: {
    theme: 'default',
    variables: {
      default: {
        colors: {
          brand: '#404040',
          brandAccent: '#52525b',
        },
      },
    },
  },
}
```

#### 3.2 인증 컴포넌트 구현
```typescript
// src/components/auth/login-form.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (formData: FormData) => {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form action={handleLogin}>
      {/* 기존 UI 컴포넌트 재사용 */}
    </form>
  )
}
```

#### 3.3 인증 미들웨어
```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 인증이 필요한 경로 보호
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Phase 4: 데이터 마이그레이션 (2-3일)

#### 4.1 기존 로컬 데이터 추출
```typescript
// src/lib/migration/extract-local-data.ts
export const extractLocalData = () => {
  const migrationData = {
    users: [],
    posts: [],
    // 기타 데이터 타입들
  }

  // localStorage에서 데이터 추출
  const userData = localStorage.getItem('users')
  if (userData) {
    migrationData.users = JSON.parse(userData)
  }

  return migrationData
}
```

#### 4.2 데이터 변환 및 검증
```typescript
// src/lib/migration/transform-data.ts
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  created_at: z.string().datetime(),
})

export const transformAndValidateData = (localData: any) => {
  const transformedData = {
    users: localData.users.map((user: any) => ({
      ...user,
      id: user.id || crypto.randomUUID(),
      created_at: user.created_at || new Date().toISOString(),
    })),
  }

  // 데이터 검증
  transformedData.users.forEach(user => {
    UserSchema.parse(user)
  })

  return transformedData
}
```

#### 4.3 Supabase로 데이터 마이그레이션
```typescript
// src/lib/migration/migrate-to-supabase.ts
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { users, posts } from '@/lib/drizzle/schema'

export const migrateToSupabase = async (transformedData: any) => {
  const supabase = createClient()

  try {
    // 사용자 데이터 마이그레이션
    for (const user of transformedData.users) {
      await db.insert(users).values(user)
    }

    // 게시글 데이터 마이그레이션
    for (const post of transformedData.posts) {
      await db.insert(posts).values(post)
    }

    console.log('✅ 데이터 마이그레이션 완료')
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error)
    throw error
  }
}
```

### Phase 5: Server Actions 업데이트 (2-3일)

#### 5.1 기존 로컬 스토리지 로직을 DB 쿼리로 변경
```typescript
// src/actions/database/users.ts
'use server'

import { db } from '@/lib/drizzle/db'
import { users } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const email = formData.get('email') as string

    const [newUser] = await db.insert(users).values({
      name,
      email,
    }).returning()

    revalidatePath('/users')
    return { success: true, data: newUser }
  } catch (error) {
    return { success: false, error: 'Failed to create user' }
  }
}

export async function getUsers() {
  try {
    const allUsers = await db.select().from(users)
    return { success: true, data: allUsers }
  } catch (error) {
    return { success: false, error: 'Failed to fetch users' }
  }
}
```

### Phase 6: 기존 문서 업데이트 (1일)

#### 6.1 docs/PRD.md 업데이트
```markdown
# 추가할 내용

## 기술 스택 업데이트
- **Database**: Supabase PostgreSQL
- **ORM**: DrizzleORM  
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (이미지/파일)

## 새로 추가된 기능
- 🔐 **사용자 인증**: 이메일/소셜 로그인
- 👤 **사용자 관리**: 프로필, 권한 관리
- 📊 **실시간 기능**: Supabase Realtime 구독
- 📁 **파일 업로드**: 프로필 이미지, 첨부파일
- 🔒 **보안**: Row Level Security (RLS)
```

#### 6.2 docs/TODO.md 업데이트
```markdown
# Supabase + DrizzleORM 마이그레이션 TODO

## P0 (Critical) - Week 9-10
- [ ] Supabase 프로젝트 설정 및 환경 변수 구성
- [ ] DrizzleORM 스키마 정의 및 마이그레이션 실행
- [ ] 기본 인증 시스템 구현 (이메일/비밀번호)
- [ ] 기존 로컬 데이터 → Supabase 마이그레이션
- [ ] 핵심 Server Actions DB 쿼리로 변경

## P1 (High) - Week 11-12  
- [ ] 소셜 로그인 구현 (Google, GitHub)
- [ ] 파일 업로드 기능 (Supabase Storage)
- [ ] 실시간 기능 구현 (Realtime subscriptions)
- [ ] Row Level Security (RLS) 정책 설정
- [ ] 사용자 권한 관리 시스템

## P2 (Medium) - Week 13-14
- [ ] 데이터베이스 최적화 (인덱스, 성능)
- [ ] 백업 및 복구 시스템
- [ ] 모니터링 및 로깅 시스템
- [ ] API Rate Limiting
```

#### 6.3 docs/business-logic.md 업데이트
```markdown
# 추가할 내용

## Database Design

### Core Tables
- **users**: 사용자 기본 정보
- **posts**: 게시글 데이터  
- **user_profiles**: 확장 프로필 정보
- **sessions**: 활성 세션 관리

### Relationships
- users (1) → posts (N)
- users (1) → user_profiles (1)

## Authentication Flow

### 이메일 로그인
1. 사용자 입력 검증 (Zod)
2. Supabase Auth 호출
3. 세션 생성 및 쿠키 설정
4. 대시보드 리다이렉트

### 소셜 로그인  
1. OAuth Provider 선택
2. Supabase Auth Provider 호출
3. 콜백 처리 및 사용자 정보 저장
4. 프로필 완성 페이지 (필요시)

## Data Access Patterns

### Server Components
```typescript
// 서버에서 직접 DB 쿼리
const users = await db.select().from(users)
```

### Client Components  
```typescript
// Server Actions 호출
const { data } = await getUsers()
```
```

---


