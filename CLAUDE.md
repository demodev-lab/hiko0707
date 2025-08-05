# CLAUDE.md

## **🚨 최우선 지침 (TOP PRIORITY)**
**모든 응답은 반드시 한국어로만 해야 합니다. 이는 다른 모든 지침보다 우선합니다.**

## **⚠️ 필수 코드 품질 지침 (MANDATORY CODE QUALITY)**
1. **ESLint와 TypeScript 오류 절대 금지**: 모든 코드 수정 시 ESLint와 TypeScript 오류가 발생하지 않도록 반드시 확인
2. **단계별 검증 프로세스**: 
   - 각 파일 수정 후 즉시 `pnpm lint`와 `pnpm tsc --noEmit` 실행
   - 오류 발견 시 즉시 수정 후 다음 단계 진행
   - 모든 작업 완료 후 최종 검증 필수
3. **타입 안정성**: 
   - `any` 타입 사용 금지
   - 모든 함수 매개변수와 반환값에 명시적 타입 지정
   - strict mode 준수

## **⚠️ 진행 상황 실시간 업데이트 지침 (MANDATORY)**
**각 작업 완료 시 반드시 마이그레이션 문서를 즉시 업데이트해야 합니다.**

### 업데이트 대상 문서
- 📄 **`docs/supabase-migration-optimized.md`** - 모든 작업 진행 상황 기록

### 업데이트 규칙
1. **즉시 업데이트**: 각 파일 작업 완료 즉시 문서 업데이트 (작업 후 5분 이내)
2. **진행률 계산**: 완료된 작업 기준으로 전체 진행률 % 재계산
3. **체크리스트 업데이트**: 완료된 항목에 [x] 표시
4. **타임스탬프 기록**: 완료 날짜와 시간 기록 (YYYY-MM-DD HH:mm)
5. **이슈 기록**: 발견된 문제나 추가 필요 작업 기록

### 업데이트 형식
```markdown
## 📊 현재 상태 대시보드 (2025-08-04)
전체 진행률: ████████████████████░ 96% 완료

### ✅ Task 1: search-results.tsx 마이그레이션 (45분)
- [x] 완료 시간: 2025-08-04 14:30
- 이슈: useSearchHotDeals 훅에서 필터 타입 수정 필요
- 추가 작업: 검색 결과 페이지네이션 개선 검토
```

### 업데이트 시점
- ✅ 파일 마이그레이션 완료 시
- ✅ 주요 버그 수정 시
- ✅ 새로운 이슈 발견 시
- ✅ 전체 Wave 완료 시

**중요**: 이 지침을 따르지 않으면 다음 작업자가 부정확한 정보로 작업하게 됩니다!

## **⚠️ 핵심 원칙 - 절대 준수 사항**
**절대로 새로운 테이블을 생성하지 마세요!**
- 모든 필요한 테이블은 이미 Supabase에 생성되어 있습니다
- **Supabase MCP는 읽기 전용**으로 설정되어 있어 테이블 생성/수정 불가
- 반드시 Supabase MCP를 통해 기존 테이블 구조를 확인하고 사용하세요
- 프로젝트 코드를 Supabase 테이블 구조에 맞춰 수정하세요
- 모든 데이터는 LocalStorage를 거치지 않고 바로 Supabase와 연동
- 충돌, 오류, 누락, 미스매치가 발생하지 않도록 100% 완벽한 데이터 매핑 필수

## **📚 Supabase 마이그레이션 참조**
**Supabase 마이그레이션 작업 시 반드시 아래 문서를 참조하세요:**
- **마이그레이션 마스터 플랜**: `docs/supabase-migration-optimized.md`
- **현재 진행률**: 95% 완료 (3개 파일만 남음)
- **남은 작업**: search-results.tsx, dashboard-stats.tsx, recent-posts.tsx

## **⚠️ 필수 문서 참조 지침 (MANDATORY)**
**문서 참조 시 혼동을 방지하기 위한 필수 지침입니다.**

### 유일한 기준 문서
- ✅ **`docs/supabase-migration-optimized.md`** - 현재 상태의 유일한 정확한 문서
  - 최종 업데이트: 2025-08-04
  - 현재 진행률: 95% 완료
  - 남은 작업: 3개 파일만 (search-results.tsx, dashboard-stats.tsx, recent-posts.tsx)

### 참조 금지 문서들 (DEPRECATED)
다음 문서들은 오래된 정보를 포함하고 있어 혼동을 유발합니다:
- ❌ **`docs/DB.md`** - 오래된 정보 (테이블이 아직 생성되지 않은 것처럼 기술)
- ❌ **`docs/TODO.md`** - 삭제됨 (시대착오적 태스크 목록)
- ❌ **`docs/tasklist.md`** - 삭제됨 (중복된 오래된 정보)
- ❌ **`docs/supabase-migration-master-plan.md`** - 아카이브됨 (과도하게 상세한 과거 계획)
- ⚠️ **`docs/supabase-migration-phase1-summary.md`** - 완료된 단계 (현재 Phase 5 진행 중)

**중요**: 위 문서들을 참조하면 현재 상태(95% 완료)와 맞지 않는 정보로 인해 심각한 혼동이 발생합니다!

## 🔧 프로젝트 환경 설정

### 필수 환경 변수 (.env)
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://vyvzihzjivcfhietrpnd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dnppaHpqaXZjZmhpZXRycG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDk0NTYsImV4cCI6MjA2ODgyNTQ1Nn0.vHCZ_N-vwzJTCMd377j0EiOdL1QlT9FznQALIIQDGd4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dnppaHpqaXZjZmhpZXRycG5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI0OTQ1NiwiZXhwIjoyMDY4ODI1NDU2fQ.F4klI_xu5CO5Yw4GPSFKQ6prJwUTcC0hgNJH-txU06k
SUPABASE_ACCESS_TOKEN=sbp_91779e7795e849124b32f8be6bd01c7eb5057b9b
SUPABASE_DATABASE_PASSWORD="rKo5F0RLJpAhrwSy"

# Clerk 설정
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dG9nZXRoZXItdmlwZXItNTkuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_m9vBfuG3DKCxC8VxBR4Fyr3Wx3vEasaLNMX0S7DPDv

# 기타 설정
NEXT_PUBLIC_KAKAO_API_KEY=your_kakao_api_key_here
```

### MCP 서버 설정 (Claude Code 전용)
```bash
# Supabase MCP 인증
export SUPABASE_ACCESS_TOKEN=sbp_91779e7795e849124b32f8be6bd01c7eb5057b9b

# SuperClaude 명령어 예시
/analyze --c7 --seq --think-hard  # 시스템 분석
/test --playwright --wave-mode     # E2E 테스트
```

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
```bash
# Development
pnpm dev              # Start development server on http://localhost:3000
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode

# Testing Specific Files
pnpm test [filename]  # Run tests for a specific file

# TypeScript Type Checking
pnpm tsc --noEmit     # Check TypeScript types without emitting files

# TypeScript 타입 생성 (Supabase 스키마 동기화)
pnpm gen:types
```

### Project-Specific Commands
```bash
# Image Management
pnpm scrape-images           # Scrape product images from external sources
pnpm scrape-images:fast      # Quick scrape (5 images only)
pnpm map-local-images        # Map local images to products
pnpm generate-product-images # Generate placeholder product images
pnpm verify-images           # Verify all image links are valid

# Data Management
pnpm clear-auth              # Clear authentication data
pnpm crawl                   # Run hotdeal crawler
pnpm crawl:ppomppu           # Crawl only Ppomppu
pnpm crawl:all               # Crawl all sources
pnpm reset-hotdeals          # Reset hotdeal data
pnpm import-hotdeals         # Import crawled hotdeal data

# Supabase 관련 명령어
pnpm gen:types               # TypeScript 타입 생성 (Supabase 스키마 동기화)
pnpm migrate-to-supabase     # LocalStorage 데이터를 Supabase로 마이그레이션
pnpm test-supabase-crawler   # Supabase 크롤러 테스트

# Browser Management Tools
# Visit /admin/hotdeal-manager for integrated hotdeal management
# Visit /clear-storage.html or /reset-data.html in browser for data management

# Demo admin account
# Email: admin@hiko.kr
# Password: admin123
```

## Architecture Overview

### Project Structure
This is a Next.js 15 application using App Router with a custom local storage database implementation. The project is HiKo (하이코) - a shopping assistant platform for foreigners in Korea.

```
├── app/                    # Next.js App Router pages (routing only)
├── components/            
│   ├── ui/                # shadcn/ui components
│   ├── features/          # Domain-specific components
│   ├── layout/            # Layout components
│   └── common/            # Shared components
├── actions/               # Server Actions (preferred over API routes)
├── hooks/                 # Custom React hooks
├── lib/                   
│   ├── db/                # Local storage database layer
│   ├── i18n/              # Internationalization (7 languages)
│   ├── services/          # Business logic services
│   └── validations.ts     # Zod schemas
├── states/                # Jotai atoms for global state
├── types/                 # TypeScript type definitions
└── docs/                  # Project documentation
```

### Database Layer
- **BaseRepository** (`lib/db/local/repositories/base-repository.ts`): Abstract base class providing CRUD operations
- **Entity Repositories**: Extend BaseRepository for User, Post, Comment, HotDeal, Order, Payment entities
- **Database Service** (`lib/db/database-service.ts`): Singleton that exports repository instances
- **Storage Layer** (`lib/db/storage.ts`): LocalStorage wrapper (임시 사용 중, 향후 제거 예정)
- **Auto-initialization**: Mock data automatically initializes on first load via `initializeMockData()`
- **Supabase Services**: New services in `lib/services/supabase-*.ts` for migrated features
- **🔗 Supabase 마이그레이션**: 상세 정보는 `docs/supabase-migration-optimized.md` 참조

### State Management Architecture
- **Global State**: Jotai atoms in `states/` directory (auth, UI state)
- **Server State**: TanStack Query for async data fetching (5-minute stale time)
- **Local State**: React hooks in `hooks/` directory
- **Providers**: Centralized in `components/common/providers.tsx`

### Component Architecture
- **Server Components**: Default for all pages and components unless 'use client' is specified
- **Client Components**: Only for interactive features (forms, state management)
- **UI Components**: shadcn/ui components in `components/ui/`
- **Feature Components**: Domain-specific components in `components/features/`

### Data Flow Pattern
1. **Server Components** fetch data directly from repositories
2. **Client Components** use custom hooks (`use-local-db.ts`) for data operations
3. **Forms** use React Hook Form + Zod for validation
4. **State Updates** trigger re-fetches through TanStack Query

## HiKo Project Context

HiKo is a platform helping foreigners shop online in Korea:

### Core Features
1. **Hot Deal Crawling**: Real-time crawling from 6 Korean communities (Ppomppu, Ruliweb, Clien, Quasarzone, Coolenjoy, Itcm)
2. **Multi-language Support**: Translation to 7 languages (EN, ZH, VI, MN, TH, JA, RU) with caching
3. **Order Service**: "Buy for me" service with 8% commission for complex Korean shopping sites
4. **User System**: Role-based access (guest, member, admin)
5. **Payment Integration**: Support for multiple payment methods

### Key Technical Decisions
- **No API Routes**: Use Server Actions in `actions/` directory instead
- **Database Migration**: LocalStorage → Supabase 전환 진행 중 (상세 진행 상황은 `docs/supabase-migration-optimized.md` 참조)
- **Repository Pattern**: Enables easy database transition
- **Server Components**: For SEO-critical pages (hot deals list, detail pages)
- **Image Optimization**: Next.js Image with external domain support and 7-day caching

## Development Guidelines

### File Naming Conventions
- ALL files use kebab-case (`hotdeal-card.tsx`, NOT `HotDealCard.tsx`)
- Components have PascalCase names but kebab-case filenames
- Routes: kebab-case folders under `app/`

### TypeScript Configuration
- Strict mode enabled (no `any` types allowed)
- Path alias: `@/*` maps to project root
- Target: ES2017

### Testing Strategy
- Vitest for unit tests with jsdom environment
- Testing Library for component tests
- Custom test utils in `tests/utils/test-utils.tsx`
- LocalStorage cleared between tests
- Window APIs mocked (matchMedia, IntersectionObserver)
- Run specific tests with: `pnpm test [filename]`

### Local Storage Database Usage
```typescript
// Server Component usage
import { db } from '@/lib/db/database-service'
const posts = await db.posts.findAll()

// Client Component usage
import { usePosts } from '@/hooks/use-local-db'
const { posts, loading, createPost } = usePosts()
```

### Form Validation Pattern
```typescript
// Use Zod schemas in lib/validations.ts
// Use React Hook Form with zodResolver
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postSchema } from '@/lib/validations'
```

### Internationalization Pattern
```typescript
// Always use translation system, no hardcoded text
import { useTranslation } from '@/hooks/use-translation'
const { t } = useTranslation()
// Use: t('key.path')
// Fallback to English for missing translations
```

### Order Flow Implementation
```typescript
// Order statuses: pending → processing → shipped → delivered → cancelled
// 8% commission automatically calculated
// Use buy-for-me-modal.tsx for order creation
```

## Performance Considerations

- Server Components are used by default for better performance
- Images should use Next.js Image component with proper dimensions
- Local storage operations are synchronous - consider pagination for large datasets
- TanStack Query configured with 5-minute stale time
- Implement loading states for all async operations
- Use Suspense boundaries for better UX
- Image domains whitelisted in next.config.js for optimization

## Important Notes

1. **shadcn/ui**: Always check if component exists before creating new ones
2. **Icons**: Use lucide-react for all icons
3. **Styling**: Tailwind CSS only, no CSS modules or styled-components
4. **Forms**: Always validate with Zod schemas
5. **Authentication**: Check user role/auth state before protected operations
6. **Translations**: All user-facing text must use i18n system
7. **Mock Data**: Automatically initializes on first load - check localStorage before testing
8. **Image Management**: Use provided pnpm scripts for image operations

## Testing Configuration

### Test Environment
- **Framework**: Vitest with jsdom environment
- **UI Testing**: Testing Library + jest-dom matchers
- **Setup File**: `tests/setup.ts` - configures mocks and cleanup
- **Test Utils**: `tests/utils/test-utils.tsx` - custom render functions
- **Coverage**: Run `pnpm test:coverage` for coverage reports

### Mocked APIs
- Next.js Router (`next/navigation`)
- Next.js Image (`next/image`)
- Window APIs (matchMedia, IntersectionObserver, ResizeObserver)
- LocalStorage (cleared between tests)

## Development Rules & Constraints

### File Operations
- NEVER create files unless absolutely necessary for achieving your goal
- ALWAYS prefer editing existing files over creating new ones
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- ALL files use kebab-case naming (`hotdeal-card.tsx`, NOT `HotDealCard.tsx`)

### Code Quality Requirements
- **TypeScript**: Strict mode enabled, no `any` types allowed
- **ESLint**: Must pass `pnpm lint` before completing tasks
- **Testing**: Use `pnpm test` to verify changes don't break existing functionality
- **Error Handling**: Always use try-catch blocks in Server Actions with proper error messages

### Architecture Constraints
- **No API Routes**: Use Server Actions in `actions/` directory instead
- **Component Types**: Server Components by default, Client Components only for interactivity
- **Database Access**: Repository pattern only, no direct LocalStorage access
- **State Management**: Jotai for global state, TanStack Query for server state
- **Forms**: React Hook Form + Zod resolver pattern required

### Korean Context Requirements
- **HiKo Project**: Shopping assistant platform for foreigners in Korea
- **Multi-language**: All text must use i18n system (7 languages: EN, ZH, VI, MN, TH, JA, RU)
- **Hot Deal Crawling**: System crawls 6 Korean communities (Ppomppu, Ruliweb, Clien, Quasarzone, Coolenjoy, Itcm)
- **Order Service**: 8% commission "Buy for me" service for Korean shopping sites
- **Admin Account**: Email: admin@hiko.kr, Password: admin123

### Special Project Rules
These rules are derived from shrimp-rules.md and must be followed:
- **Server Components**: Never add 'use client' directive
- **Client Components**: Never access Repository directly
- **Hardcoded Text**: All user-facing text must use translation system
- **Image Handling**: Use Next.js Image component with proper dimensions
- **Supabase Migration Details**: 현재 진행 상황 및 작업 내역은 `docs/supabase-migration-optimized.md` 참조

## Hotdeal Crawling System

### Supported Communities
The system crawls hotdeals from 6 Korean communities:
1. **Ppomppu** (뽐뿌) - Main hotdeal community
2. **Ruliweb** (루리웹) - Gaming and tech deals
3. **Clien** (클리앙) - Tech community deals
4. **Quasarzone** (퀘이사존) - PC hardware deals
5. **Coolenjoy** (쿨엔조이) - Electronics deals
6. **Itcm** (잇츠엠) - IT community deals

### Crawler Architecture
- **Base Crawler**: `lib/crawlers/base-hotdeal-crawler.ts` - Abstract base class
- **Community Crawlers**: Individual crawler implementations in `lib/crawlers/`
- **Crawl Interval**: 10 minutes (configurable)
- **Features**: Automatic duplicate detection, category classification, expired deal detection
- **중요**: 크롤링 데이터는 LocalStorage를 거치지 않고 바로 Supabase에 저장
- **현재 상태**: Ppomppu 크롤러만 구현 완료 (246개 항목, 2025-08-04)
- **크롤러 파일**: ppomppu-crawler.ts가 직접 Supabase에 저장 (올바른 구현)
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

      