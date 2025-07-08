# Shrimp (HiKo) Development Guidelines

## Project Overview

- **프로젝트명**: HiKo (하이코) - 내부 코드명 Shrimp
- **핵심 목적**: 한국 거주 외국인을 위한 핫딜 정보 집계 및 구매 대행 플랫폼
- **기술 스택**: Next.js 15, TypeScript (strict mode), Tailwind CSS, shadcn/ui, Jotai, TanStack Query
- **데이터베이스**: LocalStorage (현재) → Supabase (향후 마이그레이션)
- **타겟 사용자**: 한국 거주 외국인 (영어, 중국어, 베트남어, 몽골어, 태국어, 일본어, 러시아어)

## Directory Structure & File Rules

### 필수 디렉토리 구조
```
/app              # Next.js 15 App Router
  /hotdeals       # 핫딜 관련 페이지
  /order          # 주문 관련 페이지
  /admin          # 관리자 페이지
  /(auth)         # 인증 페이지 (그룹 라우트)
/components       
  /common         # 공통 컴포넌트 (providers, language-selector)
  /features       # 기능별 컴포넌트
    /hotdeal      # 핫딜 관련 컴포넌트
    /order        # 주문 관련 컴포넌트
    /admin        # 관리자 컴포넌트
  /forms          # 폼 컴포넌트
  /layout         # 레이아웃 컴포넌트
  /ui             # shadcn/ui 컴포넌트
/hooks            # React hooks
/lib              
  /db             # 데이터베이스 관련
    /local        # LocalStorage 구현
      /repositories  # Repository 패턴 구현
  /crawler        # 크롤링 시스템
  /translation    # 번역 시스템
  /payment        # 결제 시스템
/states           # Jotai atoms
/actions          # Server Actions
```

### 파일 명명 규칙
- **파일명**: kebab-case (예: `hotdeal-card.tsx`, `order-request-form.tsx`)
- **컴포넌트명**: PascalCase (예: `HotDealCard`, `OrderRequestForm`)
- **Server Actions**: `-actions.ts` 접미사 (예: `crawler-actions.ts`)
- **Repository**: `-repository.ts` 접미사 (예: `hotdeal-repository.ts`)
- **Hook**: `use-` 접두사 (예: `use-hotdeal-filter.ts`)

## Component Development Rules

### Server Components (기본값)
- **사용처**: SEO가 중요한 페이지, 데이터 페칭이 필요한 컴포넌트
- **필수 구현**:
  - `app/page.tsx` - 핫딜 리스트 메인 페이지
  - `app/hotdeals/[id]/page.tsx` - 핫딜 상세 페이지
  - `app/admin/orders/page.tsx` - 관리자 대시보드
- **규칙**:
  - 'use client' 지시어 사용 금지
  - Repository에서 직접 데이터 페칭
  - metadata 함수로 SEO 최적화 필수

### Client Components
- **사용처**: 사용자 인터랙션이 필요한 컴포넌트
- **필수 구현**:
  - 언어 선택기 (`language-selector.tsx`)
  - 필터/검색 (`hotdeal-filter.tsx`, `hotdeal-search.tsx`)
  - 주문 폼 (`order-request-form.tsx`)
- **규칙**:
  - 파일 최상단에 'use client' 지시어 필수
  - Server Actions를 통해서만 데이터 변경
  - Repository 직접 접근 금지

## Database Rules

### Repository 패턴 필수 사용
```typescript
// 모든 Repository는 BaseRepository 확장
export class HotDealRepository extends BaseRepository<HotDeal> {
  // 기본 CRUD는 BaseRepository에서 상속
  // 특화 메서드만 추가 구현
}
```

### 엔티티 정의 규칙
- 모든 엔티티는 `lib/types.ts`에 정의
- 필수 엔티티: `HotDeal`, `Translation`, `Order`, `User`
- camelCase 필드명 사용 (Supabase 마이그레이션 시 변환)

### Mock 데이터 규칙
- `lib/db/mock-data.ts`에서 초기화
- 최소 데이터 요구사항:
  - 핫딜 100개 이상
  - 7개 언어 번역 샘플
  - 사용자 50명
  - 주문 내역 30개

## Business Logic Rules

### 크롤링 시스템
- **대상 사이트**: 뽐뿌, 루리웹, zod, 퀘이사존, 어미새, 클리앙 (6개)
- **크롤링 주기**: 10분
- **필수 구현**:
  - 종료된 핫딜 자동 감지
  - 카테고리 자동 분류
  - 중복 제거 로직

### 번역 시스템
- **지원 언어**: 영어, 중국어, 베트남어, 몽골어, 태국어, 일본어, 러시아어 (7개)
- **캐싱 규칙**: 24시간 캐시 유지
- **구현 방식**: Server Action + Translation Repository

### 주문 시스템
- **수수료**: 주문 금액의 8% 자동 계산
- **프로세스**: 3단계 폼 → 관리자 확인 → 견적 전송 → 결제 → 배송
- **권한**: Guest(조회만) → Member(주문 가능) → Admin(전체 관리)

## Type & Validation Rules

### TypeScript 설정
- **strict mode 필수**: `tsconfig.json`에서 `"strict": true`
- **타입 정의 위치**: `lib/types.ts` (공통), 각 기능별 폴더 내 `types.ts`
- **any 타입 사용 금지**

### Validation 규칙
- **폼 검증**: React Hook Form + Zod 조합 필수
- **스키마 위치**: `lib/validations/` 폴더
- **Server Action 검증**: 모든 입력값 Zod 검증 필수

### Server Action 반환 타입
```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

## State Management Rules

### Jotai (전역 상태)
- **위치**: `states/` 폴더
- **사용처**: 언어 설정, 사용자 정보, 필터 상태
- **명명**: `[feature]Atom` (예: `languageAtom`, `filterAtom`)

### TanStack Query (서버 상태)
- **stale time**: 5분 (기본값)
- **캐시 키**: `['feature', 'action', ...params]` 형식
- **사용처**: 모든 데이터 페칭

### React Hooks
- **위치**: `hooks/` 폴더
- **명명**: `use-[feature]` (예: `use-hotdeal-filter`)
- **Custom hook에서만 Jotai/Query 사용**

## Prohibited Actions

### 절대 금지 사항
- ❌ Server Component에 'use client' 사용
- ❌ Client Component에서 Repository 직접 접근
- ❌ any 타입 사용
- ❌ console.log 커밋 (개발 중에만 사용)
- ❌ 하드코딩된 API 키나 시크릿
- ❌ 동기적 LocalStorage 접근 (Repository 통해서만)
- ❌ 한국어 하드코딩 (모든 텍스트는 번역 시스템 사용)

### 필수 확인 사항
- ✅ 새 파일 생성 시 kebab-case 확인
- ✅ Server Action 생성 시 try-catch 에러 처리
- ✅ 폼 구현 시 Zod 스키마 정의
- ✅ 이미지는 Next/Image 컴포넌트 사용
- ✅ 모든 페이지에 metadata 정의

## AI Decision Guidelines

### 컴포넌트 타입 결정
1. SEO 필요 → Server Component
2. 사용자 인터랙션 → Client Component
3. 애매한 경우 → Server Component 우선

### 파일 위치 결정
1. 재사용 가능 → `/components/common`
2. 특정 기능 전용 → `/components/features/[feature]`
3. 페이지 전용 → 페이지 파일과 같은 폴더

### 상태 관리 선택
1. 전역 필요 → Jotai atom
2. 서버 데이터 → TanStack Query
3. 로컬 상태 → useState

### 에러 처리
1. Server Action → try-catch + ActionResult
2. Client Component → Error Boundary
3. 데이터 페칭 → TanStack Query error state

## Multi-file Coordination

### 새 기능 추가 시 필수 수정 파일
1. **엔티티 추가**: 
   - `lib/types.ts` - 타입 정의
   - `lib/db/local/repositories/` - Repository 생성
   - `lib/db/database-service.ts` - Repository export
   - `lib/db/mock-data.ts` - Mock 데이터 추가

2. **페이지 추가**:
   - `app/[route]/page.tsx` - 페이지 파일
   - `components/features/[feature]/` - 관련 컴포넌트
   - `actions/[feature]-actions.ts` - Server Actions
   - `hooks/use-[feature].ts` - Custom hooks

3. **번역 추가**:
   - 7개 언어 파일 모두 업데이트 필수
   - Translation Repository 캐시 고려

### 의존성 체크
- Repository 변경 시 → 사용하는 모든 Server Component/Action 확인
- 타입 변경 시 → TypeScript 컴파일 에러 전체 확인
- 라우트 변경 시 → Link 컴포넌트 href 전체 확인

## Task Management Integration

### Shrimp Task Manager 사용
- **태스크 ID**: 각 작업은 고유 ID로 관리됨
- **의존성 체인**: 태스크 간 의존성 준수 필수
- **검증 기준**: 각 태스크의 verificationCriteria 충족 필수

### 현재 태스크 목록 (15개)
1. 프로젝트 초기 설정 및 문서 분석
2. 경쟁사 및 디자인 트렌드 분석
3. Mock 데이터 크롤링 시스템 구축
4. 이미지 처리 도구 개발
5. HotDeal 엔티티 및 Repository 구현
6. 핫딜 리스트 페이지 개발
7. 핫딜 상세 페이지 개발
8. 다국어 지원 시스템 구축
9. Buy for Me 주문 폼 개발
10. 크롤링 백엔드 API 개발
11. 번역 API 통합
12. 관리자 대시보드 개발
13. 성능 최적화 및 SEO
14. 결제 시스템 통합
15. 최종 테스트 및 배포 준비

---

**이 문서는 AI Agent 전용입니다. 일반 개발자 문서가 아닙니다.**