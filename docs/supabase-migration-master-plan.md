# Supabase Migration Master Plan - LocalStorage 완전 대체 계획서

## 🚨 **현재 상황 요약 (2025년 8월 4일) - 실제 진행률 95% 완료**
- **실제 마이그레이션 상태**: **95% 완료** (Wave 1-4 완료, Wave 5 90% 완료)
- **실제 데이터**: hot_deals(246개), users(4개) + 핵심 기능별 데이터 존재
- **실제 Supabase 테이블**: **18개 테이블** 모두 생성 및 구축 완료
- **TypeScript 타입**: database.types.ts **완전히 구현됨** (1046줄)
- **서비스 파일**: 14개 Supabase 서비스 파일 모두 구현 완료
- **Hook 파일**: 10개 use-supabase-*.ts 모두 구현 및 실시간 동기화 완료
- **실제 완료된 영역**: 
  - ✅ **인프라 100% 완료**: 테이블, 타입, 서비스, hooks 모두 구축
  - ✅ **사용자 인증 100% 완료**: Clerk + Supabase 완전 통합
  - ✅ **Buy-for-me 100% 완료**: Supabase 완전 전환 (Modal 포함)
  - ✅ **커뮤니티 기능 100% 완료**: 댓글, 좋아요, 즐겨찾기 완료
  - ✅ **Hot Deal 크롤링 100% 완료**: ppomppu-crawler Supabase 직접 저장
  - ✅ **관리자 시스템 95% 완료**: 로그, 알림, 설정 완료
  - ✅ **통계 대시보드 100% 완료**: 실시간 analytics 대시보드 구현 완료
  - ✅ **번역 시스템 100% 완료**: Google Translate API 연동, 7일 캐시
  - ✅ **실시간 업데이트 100% 완료**: Supabase 실시간 구독, throttling, 최적화
  - ❌ **검색 기능 0% 미완료**: search-results.tsx가 여전히 LocalStorage 사용
  - ❌ **일반 대시보드 0% 미완료**: recent-posts.tsx, dashboard-stats.tsx LocalStorage 사용
- **실제 남은 작업**: **2시간** - 3개 파일만 미완료

## 🎯 프로젝트 목표
LocalStorage 기반 데이터베이스를 Supabase로 **완전히** 대체하여 확장 가능하고 안정적인 백엔드 시스템 구축

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
USE_SUPABASE=true
NEXT_PUBLIC_KAKAO_API_KEY=your_kakao_api_key_here
```

### 개발 환경 실행
```bash
# 개발 서버 시작
pnpm dev              # http://localhost:3000

# TypeScript 타입 생성 (Supabase 스키마 동기화)
pnpm gen:types

# 코드 품질 검증
pnpm lint             # ESLint 실행
pnpm tsc --noEmit     # TypeScript 타입 체크

# 테스트 실행
pnpm test             # 단위 테스트
pnpm test:watch       # 테스트 감시 모드
pnpm test:coverage    # 커버리지 리포트

# 빌드 검증
pnpm build            # 프로덕션 빌드
```

### MCP 서버 설정 (Claude Code 전용)
```bash
# Supabase MCP 인증
export SUPABASE_ACCESS_TOKEN=sbp_91779e7795e849124b32f8be6bd01c7eb5057b9b

# SuperClaude 명령어 예시
/analyze --c7 --seq --think-hard  # 시스템 분석
/test --playwright --wave-mode     # E2E 테스트
```

## ⚠️ 핵심 원칙 - 절대 준수 사항
**절대로 새로운 테이블을 생성하지 마세요!** 
- 모든 필요한 테이블은 이미 Supabase에 생성되어 있습니다
- **Supabase MCP는 읽기 전용**으로 설정되어 있어 테이블 생성/수정 불가
- 반드시 Supabase MCP를 통해 기존 테이블 구조를 확인하고 사용하세요
- 프로젝트 코드를 Supabase 테이블 구조에 맞춰 수정하세요
- 모든 데이터는 LocalStorage를 거치지 않고 바로 Supabase와 연동
- 충돌, 오류, 누락, 미스매치가 발생하지 않도록 100% 완벽한 데이터 매핑 필수

## 🔍 참조 문서
- **DB.md**: 의존성 기반 점진적 구현 순서 지침
- **End-to-End Testing with Playwright MCP.md**: E2E 테스트 자동화 지침

## 📅 **수정된 전체 일정: 8-10시간으로 100% 완료 가능**

## 🔄 **실제 현재 상황 (2025년 8월 4일 종합 검증 완료)**

### ✅ **실제 인프라 상태 - 100% 완료**
- **Supabase 테이블**: 18개 모두 생성 및 구축 완료
  - 핵심 데이터 존재: hot_deals(246개), users, 커뮤니티 데이터 등
  - 모든 테이블이 실제 사용 중
- **TypeScript 타입**: ✅ database.types.ts 완전히 구현됨 (632줄, 18개 테이블 완전 정의)
- **서비스 파일**: 14개 Supabase 서비스 파일 완전 구현
- **Hook 파일**: 10개 use-supabase-*.ts 완전 구현 및 실시간 동기화
- **크롤러**: ppomppu-crawler.ts가 Supabase에 직접 저장 (완벽한 구현)

### ✅ **실제 완료된 핵심 기능들**
1. **사용자 인증 시스템**: Clerk + Supabase 완전 통합 ✅
2. **Buy-for-me 시스템**: buy-for-me-modal.tsx 포함 완전 전환 ✅
3. **커뮤니티 기능**: 댓글, 좋아요, 즐겨찾기 완전 전환 ✅
4. **Hot Deal 크롤링**: Supabase 직접 저장 완료 ✅
5. **관리자 시스템**: 로그, 알림, 설정 완료 ✅

### ❌ **실제 남은 작업 (3개 파일만)**

**우선순위 1 (사용자 핵심 기능)**: 
1. `components/features/search/search-results.tsx` - database-service → useSupabaseHotdeals 전환 (2시간)

**우선순위 2 (관리자 대시보드)**:
2. `components/features/dashboard/recent-posts.tsx` - use-local-db → useSupabaseCommunity 전환 (2시간)
3. `components/features/dashboard/dashboard-stats.tsx` - use-local-db → useSupabaseCommunity 전환 (2시간)

**정리 작업 (우선순위 3)**:
- deprecated된 hooks 파일들 제거 (1시간)
- LocalStorage 기반 database-service 정리 (2시간)

### ✅ **이미 구현 완료된 Phase들**

#### ✅ Phase 1: 사용자 인증 및 프로필 (10시간) - **완료**
- ✅ supabase-user-service.ts 구현
- ✅ supabase-profile-service.ts 구현  
- ✅ Clerk + Supabase users 테이블 연동 준비

#### ✅ Phase 2: Buy-for-me 시스템 (10시간) - **완료**
- ✅ supabase-order-service.ts 구현
- ✅ supabase-payment-service.ts 구현
- ✅ supabase-address-service.ts 구현

#### ✅ Phase 3: 커뮤니티 기능 (10시간) - **완료**
- ✅ supabase-comment-service.ts 구현
- ✅ supabase-like-service.ts 구현
- ✅ supabase-favorite-service.ts 구현

#### ✅ Phase 4: 시스템 관리 (5시간) - **완료**
- ✅ supabase-notification-service.ts 구현
- ✅ supabase-admin-log-service.ts 구현
- ✅ supabase-system-settings-service.ts 구현

#### ✅ Phase 5: Hot Deals 시스템 (20시간) - **완료**
- ✅ supabase-hotdeal-service.ts 구현
- ✅ 크롤러 시스템 Supabase 연동
- ✅ 기본 번역 시스템 구현 (supabase-translation-service.ts)

## 📋 **Wave 5-7 의존성 분석 결과**

### 의존성 체인 분석
1. **Wave 5 (Hot Deal 검증)**: 독립적 실행 가능 - 3개 병렬 그룹
   - Group 1: 크롤러 검증 (독립)
   - Group 2: 기능 구현/검증 (독립) 
   - Group 3: 성능 최적화 (독립)

2. **Wave 6 (최종 마무리)**: Wave 5 완료 필수
   - 레거시 코드 정리는 모든 기능 검증 후 진행
   - 문서화는 최종 아키텍처 확정 후 작성
   - 배포는 모든 테스트 통과 후 진행

3. **Wave 7 (미구현 기능)**: Wave 6 완료 후 안전하게 구현
   - 추가 크롤러: 기본 크롤러 시스템 검증 완료 후
   - 번역 API: 기본 번역 시스템 검증 완료 후
   - 결제 API: 기본 결제 플로우 검증 완료 후

### 미구현 기능 처리 전략
**우선순위**: 100% Supabase 마이그레이션 > 미구현 기능 추가

**이유**:
1. **기술적 안정성**: 혼재된 상태보다 단일 시스템이 안정적
2. **유지보수성**: LocalStorage + Supabase 혼재 시 복잡도 증가
3. **확장성**: Supabase 기반에서 새 기능 추가가 더 쉬움
4. **의존성 없음**: 미구현 기능들이 핵심 마이그레이션을 막지 않음

### 리스크 평가
- **Wave 5-6 선행**: 리스크 없음 ✅
- **미구현 기능 연기**: 리스크 없음 ✅
- **권장사항**: 계획대로 Wave 5-6 완료 후 미구현 기능 작업

## 🚀 **실제 완성 계획 - 2시간으로 100% 완료**

### 🌊 **Wave 5: Hot Deal 시스템 완성** (90% 완료) - ✅ **대부분 완료**

**완료된 작업들**:
- ✅ 핫딜 통계 대시보드 (`/admin/hotdeal-analytics`)
- ✅ 번역 시스템 (Google Translate API + 7일 캐시)
- ✅ 실시간 업데이트 (Supabase realtime 구독)
- ✅ 이미지 최적화 시스템
- ✅ 크롤러 시스템 (ppomppu-crawler)

### 🌊 **Wave 6: 최종 마무리** (2시간) - 🚧 **즉시 시작**

**목표**: 남은 3개 파일 Supabase 전환 및 정리

#### ⚡ Task 6.1: 검색 결과 컴포넌트 마이그레이션 (45분) - 🚧 **최우선**

**현재 상태**:
```typescript
// components/features/search/search-results.tsx
import { db } from '@/lib/db/database-service' // ❌ LocalStorage
const deals = await db.hotdeals.searchByKeyword(query)
const deals = await db.hotdeals.findActive()
```

**목표 상태**:
```typescript  
// components/features/search/search-results.tsx
import { useSearchHotDeals, useHotDeals } from '@/hooks/use-supabase-hotdeals' // ✅ Supabase
const { data: searchResults } = useSearchHotDeals(query, filters)
const { data: allDeals } = useHotDeals(filters)
```

**구체적 작업**:
1. database-service import 제거
2. useSearchHotDeals hook으로 교체 (이미 구현됨)
3. useEffect + setState 패턴을 React Query로 변경
4. ESLint/TypeScript 오류 수정

**성공 기준**:
- `/search` 페이지 정상 작동
- 검색, 필터링, 페이징 모두 동작
- 실시간 업데이트 반영
- 코드 품질 검증 통과

**완료 시 효과**: 사용자 핵심 기능 100% Supabase 완료

#### ⚡ Task 6.2: 대시보드 컴포넌트 마이그레이션 (45분)

**파일 1: components/features/dashboard/recent-posts.tsx**
```typescript
// 현재: import { usePosts, useUsers } from '@/hooks/use-local-db'
// 변경: import { useSupabasePosts, useSupabaseUsers } from '@/hooks/use-supabase-community'
```

**파일 2: components/features/dashboard/dashboard-stats.tsx**
```typescript
// 현재: import { usePosts, useUsers, useComments } from '@/hooks/use-local-db'
// 변경: 해당 Supabase hooks 사용
```

#### ⚡ Task 6.3: 최종 정리 및 검증 (30분)

**작업 내용**:
1. **USE_SUPABASE 플래그 제거** - 더 이상 필요 없음
2. **미사용 LocalStorage 코드 정리** - database-service.ts는 유지 (환경설정용)
3. **타입 체크 및 린트** - `pnpm lint && pnpm tsc --noEmit`
4. **통합 테스트** - 주요 사용자 경로 테스트

#### Task 6.2: 최근 게시물 컴포넌트 마이그레이션 (2시간)

**현재 상태**:
```typescript
// components/features/dashboard/recent-posts.tsx  
import { useLocalDb } from '@/hooks/use-local-db' // ❌ LocalStorage
```

**목표 상태**:
```typescript
// components/features/dashboard/recent-posts.tsx
import { useSupabaseCommunity } from '@/hooks/use-supabase-community' // ✅ Supabase
```

### 🌊 **Wave 7: 정리 및 최적화** (3시간)

**목표**: 레거시 코드 정리 및 최종 검증

#### Task 7.1: Deprecated 파일 제거 (1시간)
```bash
# 안전한 삭제 - import 확인 후
rm hooks/use-hotdeals.ts      # deprecated
rm hooks/use-favorites.ts     # deprecated  
rm hooks/use-hotdeal-comments.ts  # deprecated
rm hooks/use-translations.ts  # deprecated
```

#### Task 7.2: LocalStorage 시스템 정리 (1시간)
- `lib/db/database-service.ts` 검토 및 정리
- `lib/db/local/` 폴더 검토 및 정리
- Mock data 시스템 검토

#### Task 7.3: 최종 검증 및 테스트 (1시간)
- 전체 기능 회귀 테스트
- 성능 검증 (`pnpm build`, `pnpm lint`, `pnpm tsc --noEmit`)
- 문서 업데이트

## 📅 **실행 타임라인**

### 즉시 시작 가능 (우선순위 1)

**Day 1: Wave 5 실행 (2-3시간)**
```bash
# 1. 검색 컴포넌트 분석
/analyze components/features/search/search-results.tsx --focus migration

# 2. Supabase hook으로 전환
/implement search-results 마이그레이션 --type component --safe-mode

# 3. 테스트 및 검증
pnpm dev
pnpm lint  
pnpm tsc --noEmit
```

### 단계별 진행 (우선순위 2-3)

**Day 2-3: Wave 6 실행 (3-4시간)**
- 관리자 대시보드 컴포넌트들 순차 마이그레이션
- 각 컴포넌트별 개별 테스트

**Day 4: Wave 7 실행 (3시간)**
- 정리 작업 및 최종 검증
- 문서 업데이트

#### Task 2.1: 테이블 매핑 및 동기화 검증 (3시간) - ✅ **완료**
- ✅ 2.1.1: user_addresses 테이블 매핑 불일치 수정 - phone vs phone_number, email 누락
- ✅ 2.1.2: proxy_purchase_addresses 중복 테이블 정리 - user_addresses와 통합
- ✅ 2.1.3: 견적(quote) 정보 매핑 함수 완성 - proxy_purchase_quotes 연동
- ✅ 2.1.4: 주문 정보(orderInfo) 매핑 함수 완성 - order_status_history 연동

#### Task 2.2: API 엔드포인트 Supabase 연동 (3시간) - ✅ **완료**
- ✅ 2.2.1: check-admin API Supabase 연동 완료
- ✅ 2.2.2: Payment Methods API Supabase 연동 완료

#### Task 2.3: 실시간 동기화 활성화 (2시간) - ✅ **완료**
- ✅ 2.3.1: use-supabase-profile.ts 실시간 동기화 추가 (user_profiles, user_addresses)
- ✅ 2.3.2: use-supabase-system.ts 실시간 동기화 추가 (notifications, admin_activity_logs, system_settings)
- ✅ 2.3.3: use-supabase-community.ts 실시간 동기화 추가 (hot_deal_comments, hot_deal_likes, user_favorite_hotdeals)
- ✅ 2.3.4: use-supabase-order.ts 실시간 동기화 추가 (proxy_purchases_request, payments, user_addresses, order_status_history, proxy_purchase_quotes)

### 🌊 **Wave 3: Buy-for-Me 완전 전환** (12시간) - ✅ **완료**
**목표**: 구매대행 시스템 완전 Supabase 전환

#### Task 3.1: Buy-for-Me Modal 완전 전환 - LocalStorage 제거 및 Supabase 통합 - ✅ **완료**
- ✅ 3.1.1: useAddresses → useSupabaseUserAddresses 교체 완료
- ✅ 3.1.2: LocalStorage 직접 접근 코드 제거 완료
- ✅ 3.1.3: createAddressAsync 사용으로 수정 및 데이터 구조 호환성 확보

#### Task 3.2: Buy-for-Me 관련 다른 컴포넌트들 Supabase 전환 - ✅ **완료**
- ✅ 3.2.1: order-form 컴포넌트 Supabase 전환
- ✅ 3.2.2: 주문 상세 페이지 Supabase 전환
  - ✅ 3.2.2.1: /app/order/[id]/page.tsx LocalStorage → useSupabaseOrderDetail 완료
  - ✅ 3.2.2.2: /app/mypage/orders/[id]/page.tsx TypeScript 타입 오류 수정 완료
- ✅ 3.2.3: 관리자 주문 관리 페이지 완전 전환 검증 - 4개 관리자 페이지 모두 Supabase 연동 확인

### 🌊 **Wave 4: 시스템 최적화** (8시간) - ✅ **완료**
**목표**: 남은 LocalStorage 제거, 성능 최적화, 캐싱 전략 구현

#### Task 4.1: 남은 LocalStorage 제거 및 완전 Supabase 전환 - ✅ **완료**
- ✅ 4.1.1: /app/search/page.tsx useHotDeals → useSupabaseHotDeals 전환 완료
- ✅ 4.1.2: LocalStorage 사용 파일 11개 분석 완료 - 인증 3개, 정당한 사용 2개, 테스트 4개, 검토 2개
- ✅ 4.1.3: 인증 시스템 이중화 문제 해결 - Clerk vs LocalStorage 간 데이터 불일치 수정
  - ✅ 4.1.3.1: /components/layout/header.tsx 인증 마이그레이션 완료 - use-auth → use-supabase-user + use-clerk-role
  - ✅ 4.1.3.2: 핵심 인증 컴포넌트 마이그레이션 완료 - role-based-content.tsx, role-guard.tsx, protected-route.tsx
  - ✅ 4.1.3.3: 페이지 컴포넌트 마이그레이션 완료 - /app/mypage/page.tsx useAuth → useClerkRole + useSupabaseUser + useClerk signOut
  - ✅ 4.1.3.4: Quote 페이지 타입 오류 수정 - BuyForMeRequest vs Supabase 타입 불일치 해결
- ✅ 4.1.4: use-supabase-buy-for-me.ts useAuth 의존성 제거 - useAuth → useSupabaseUser 교체 완료
- ✅ 4.1.5: database-service.ts 레거시 제거 계획 - LocalStorage 기반 Repository 시스템 정리
  - ✅ 4.1.5.1: 불필요한 import 제거 - profile/page.tsx database-service import 삭제 완료
  - ✅ 4.1.5.2: 인증 시스템 파일 우선 마이그레이션 - use-auth.ts, auth-actions.ts 대체 완료
  - ✅ 4.1.5.3: 레거시 hook 파일들 사용 금지 - 8개 훅 deprecated 처리 완료 (use-addresses, use-buy-for-me, use-hotdeals, use-translations, use-favorites, use-hotdeal-comments, use-orders, use-payments)
  - ✅ 4.1.5.4: 페이지 컴포넌트 Supabase 전환 - admin, order, payment 페이지들
    - ✅ 4.1.5.4.1: /app/order/page.tsx database-service → SupabaseHotDealService 마이그레이션 완료
    - ✅ 4.1.5.4.2: /app/payment/page.tsx database-service → SupabaseOrderService + SupabaseUserService 마이그레이션 완료
    - ✅ 4.1.5.4.3: /app/mypage/orders/[id]/payment/page.tsx database-service + use-auth → SupabaseOrderService + Clerk 인증 마이그레이션 완료
- ✅ 4.1.6: notification-service.ts Supabase 전환 완료 - currentUser localStorage 의존성 제거, notification-context.tsx Clerk 연동
- ✅ 4.1.7: admin/analytics/page.tsx TypeScript 오류 수정 완료 - proxy_purchases_request.total_amount → quotes[0].total_amount 접근 방식 변경으로 해결

#### Task 4.2: 성능 최적화 및 캐싱 전략 구현 - ✅ **완료**
- ✅ 4.2.1: Supabase 쿼리 최적화 - 중복 데이터 요청 방지 및 인덱스 활용 ✅ 완료: getAllHotdeals(), getTranslatedHotDeals(), getPopularHotDeals(), getAllOrders(), getUserFavoriteStats() 최적화
- ✅ 4.2.2: React Query 캐싱 전략 개선 ✅ 완료: 5개 주요 훅 파일 최적화 - use-supabase-hotdeals.ts (핫딜 1-3분), use-supabase-buy-for-me.ts (주문 5-10분), use-supabase-user.ts (사용자 1-20분), use-supabase-profile.ts (프로필 15-20분), use-supabase-community.ts (이미 최적화됨)
- ✅ 4.2.3: 이미지 최적화 - Next.js Image 컴포넌트 및 CDN 캐싱 ✅ 완료: order-form-v2.tsx, url-parser.tsx 총 3개 img 태그를 Next.js Image로 전환 (sizes, priority, fill 속성 적용)
- ✅ 4.2.4: Supabase 실시간 구독 최적화 - 불필요한 기능 비활성화 ✅ 완료: page visibility 기반 최적화 8개 실시간 구독 (use-supabase-system.ts 3개, use-supabase-profile.ts 1개, use-supabase-order.ts 4개)

### 🌊 **Wave 5: Hot Deal 시스템 검증 및 완성** (4시간 → 2시간 병렬 실행) - 🚧 **다음 단계**
**목표**: Hot Deal 시스템 검증 및 완성 (이미 대부분 구현됨)
**실행 전략**: 3개 병렬 그룹으로 동시 실행, 12개 전문 에이전트 활용

#### 📊 병렬 실행 그룹 구성

##### Group 1: 크롤러 검증 (병렬 실행)
```yaml
태스크:
  - 크롤러 동작 검증 (ID: e25c5469-7bc7-4096-a377-68d9432be73d)
  - 크롤러 관리 UI 검증 (ID: 4d695e06-5937-45dd-8dd4-b95e7e207a9f)
에이전트:
  - debugger - 디버거: 크롤러 동작 디버깅
  - test-automator - 테스트 자동화 전문가: UI 자동화 테스트
실행 명령:
  - pnpm crawl:ppomppu
  - Supabase 쿼리 검증
MCP 서버: Supabase (데이터 검증)
```

##### Group 2: 기능 구현/검증 (병렬 실행)
```yaml
태스크:
  - 번역 시스템 검증 (ID: dfb4016a-04c0-4d49-9846-7fa03f5380bd)
  - 통계 기능 구현 (ID: 509efdf8-bb89-438f-a730-1a33a0a3b1b9)
에이전트:
  - backend-architect - 백엔드 아키텍트: API 통합 검증
  - data-scientist - 데이터 과학자: 통계 쿼리 구현
구현 내용:
  - Google Translate API 연동
  - useHotDealStats 실제 구현
MCP 서버: Context7 (패턴 참조)
```

##### Group 3: 성능 최적화 (병렬 실행)
```yaml
태스크:
  - 실시간 업데이트 검증 (ID: b85368ab-d396-4a09-b1d9-c200061ed611)
  - 이미지 최적화 검증 (ID: b8ae174b-8ba0-497f-834b-eb4bab19253d)
에이전트:
  - performance-engineer - 성능 엔지니어: 성능 측정
  - frontend-developer - 프론트엔드 개발자: UI 최적화
검증 내용:
  - 좋아요 throttling
  - Next.js Image 최적화
MCP 서버: Playwright (성능 테스트)
```

#### 세부 태스크 정의

##### Task 5.1: 구현 검증 및 버그 수정 (2시간)
###### 5.1.1: 크롤러 동작 검증 (Group 1)
- ppomppu-crawler 실제 동작 테스트
- 다른 5개 커뮤니티 크롤러 구현 상태 확인
- 크롤링 스케줄러 동작 검증

###### 5.1.2: 번역 시스템 검증 (Group 2)
- 실제 Google Translate API 연동 확인
- 번역 캐싱 동작 검증
- 7개 언어 지원 확인

##### Task 5.2: 누락된 기능 구현 (1시간)
###### 5.2.1: 통계 기능 구현 (Group 2)
- useHotDealStats 실제 구현 (현재 placeholder)
- 대시보드 통계 연동

###### 5.2.2: 크롤러 관리 UI (Group 1)
- /admin/crawler 페이지 Supabase 연동 확인
- crawling_logs 테이블 활용

##### Task 5.3: 성능 최적화 검증 (1시간)
###### 5.3.1: 실시간 업데이트 검증 (Group 3)
- 핫딜 좋아요 throttling 동작 확인
- 페이지 가시성 최적화 검증

###### 5.3.2: 이미지 최적화 (Group 3)
- CDN 캐싱 설정 확인
- 이미지 로딩 성능 측정

### 🌊 **Wave 6: 최종 마무리 및 배포 준비** (6시간) - 🚧 **새로운 Wave**
**목표**: 레거시 코드 정리, 문서화, 배포 준비

#### Task 6.1: 레거시 코드 정리 (2시간)
##### 6.1.1: LocalStorage 관련 코드 완전 제거
- database-service.ts 및 관련 파일들
- 레거시 Repository 패턴 제거
- 사용하지 않는 hooks 제거

##### 6.1.2: 마이그레이션 플래그 정리
- USE_SUPABASE 플래그 제거
- 조건부 렌더링 코드 단순화

#### Task 6.2: 문서화 및 테스트 (2시간)
##### 6.2.1: 마이그레이션 문서 업데이트
- 최종 아키텍처 다이어그램
- API 문서 업데이트

##### 6.2.2: E2E 테스트 작성
- 주요 사용자 플로우 테스트
- 크롤러 동작 테스트

#### Task 6.3: 배포 및 모니터링 (2시간)
##### 6.3.1: 프로덕션 배포 준비
- 환경 변수 검증
- 보안 설정 확인

##### 6.3.2: 모니터링 설정
- Supabase 대시보드 설정
- 에러 추적 시스템 구성

## 🧪 Phase 1-4 E2E 테스트 (15시간)

### Supabase 테이블 구조 확인 완료 ✅
**실제 확인된 18개 테이블**:
- admin_activity_logs, comment_likes, crawling_logs
- hot_deal_comments, hot_deal_likes, hot_deals, hotdeal_translations  
- notifications, order_status_history, payments
- proxy_purchase_addresses, proxy_purchase_quotes, proxy_purchases_request
- system_settings, user_addresses, user_favorite_hotdeals
- user_profiles, users

**comment_likes 테이블 구조**:
- id (uuid, primary key)
- comment_id (uuid, foreign key)  
- user_id (uuid, foreign key)
- created_at (timestamp)

### 테스트 환경 설정 (2시간)
```typescript
// Playwright 설정
// - 브라우저: Chrome, Firefox, Safari
// - 환경: Desktop, Mobile
// - 로케일: ko, en, zh, vi, mn, th, ja, ru
```

### E2E 테스트 시나리오

#### 1. 사용자 인증 플로우 테스트 (3시간)
**파일**: `e2e/auth-flow.spec.ts`

```typescript
// 테스트 시나리오
- 회원가입 → Clerk 연동 → Supabase users 테이블 생성 확인
- 로그인 → 사용자 정보 동기화 확인
- 프로필 수정 → 실시간 데이터 업데이트 확인
- 로그아웃 → 세션 정리 확인
```

**Playwright MCP 명령**:
```bash
# find_end_to_end_test.md --persona qa --focus auth
# create_end_to_end_test.md --self-healing --multi-browser
```

#### 2. Buy-for-me 주문 플로우 테스트 (4시간)
**파일**: `e2e/buy-for-me-flow.spec.ts`

```typescript
// 테스트 시나리오
- 핫딜 상세 페이지 → Buy-for-me 모달 오픈
- 주문 정보 입력 → 유효성 검사
- 주소 선택/입력 → user_addresses 테이블 연동
- 주문 생성 → proxy_purchases_request 생성 확인
- 마이페이지 → 주문 목록 표시 확인
```

**자가 치유 메커니즘**:
- 모바일 환경에서 버튼 위치 자동 감지
- 로딩 상태 대기 로직
- 네트워크 오류 재시도

#### 3. 커뮤니티 기능 테스트 (3시간)
**파일**: `e2e/community-features.spec.ts`

```typescript
// 테스트 시나리오
- 댓글 작성/수정/삭제 플로우
- 좋아요 토글 및 카운트 업데이트
- 즐겨찾기 추가/제거 및 목록 표시
- 대댓글 작성 및 계층 구조 표시
```

#### 4. 시스템 관리 기능 테스트 (3시간)
**파일**: `e2e/system-management.spec.ts`

```typescript
// 테스트 시나리오
- 알림 생성/읽음 처리/삭제
- 관리자 활동 로그 기록 확인
- 시스템 설정 변경 및 적용 확인
```

### E2E 테스트 실행 및 리포팅

**Playwright MCP 활용 (End-to-End Testing with Playwright MCP.md 지침 준수)**:
1. **페르소나 주입**: "당신은 엔드투엔드 테스트를 기획하는 Q 전문가입니다"
2. **자가 치유 메커니즘**: 실패하는 테스트를 성공할 때까지 스스로 분석하고 개선
3. **다중 환경 테스트**: Desktop/Mobile, Chrome/Firefox/Safari
4. **시각적 리포팅**: 스크린샷과 정확한 위치 표시

```bash
# find_end_to_end_test.md 커맨드 사용
# create_end_to_end_test.md 커맨드로 테스트 생성
# show report 명령으로 UI 기반 리포트 생성
```

**리포트 형식**:
- ✅/❌ 성공/실패 표시
- 스크린샷 첨부 (성공한 테스트의 정확한 위치 포함)
- 실패 원인 분석 및 영상 제공
- 실행 시간 측정
- 자동 개선 이력

## 🧪 Phase 5 E2E 테스트 계획 (5시간)

### ✅ 크롤러 시스템 구현 상태
**뽐뿌 크롤러 완료**: 실제 테스트 결과 정상 작동 확인
- ✅ `ppomppu-crawler.ts`: 완전히 구현되어 정상 작동 중 (Supabase 직접 저장)
- ✅ `crawler-manager.ts`: 크롤러 실행 매니저 (LocalStorage 사용 안함)
- ✅ `crawler-scheduler.ts`: 스케줄링 시스템 (LocalStorage 사용 안함)
- ✅ **실제 데이터**: Supabase에 246개의 뽐뿌 항목 확인 (2025-08-03)
- ❌ `supabase-crawler-service.ts`: 실제로 존재하지 않음 (문서 오류)
- ❌ `new-crawler-manager.ts`: 실제로 존재하지 않음 (문서 오류)

### 5.1 크롤러 정리 및 확장 계획 (2시간)
**파일**: `e2e/crawler-system.spec.ts`

```typescript
// 완료된 사항
- ✅ Ppomppu 크롤러 구현 및 테스트 완료
- ✅ SupabaseCrawlerService.saveHotDeals() 직접 저장 검증
- ✅ LocalStorage 우회 확인 (저장되지 않음)
- ✅ Supabase hot_deals 테이블 데이터 검증 (246개 항목)
- ✅ 중복 방지 메커니즘 작동 확인 (source_id + source)

// 남은 작업 (실제로는 거의 없음)
- 다른 사이트 크롤러 구현 (Phase 8 이후)
- 크롤러 시스템은 이미 LocalStorage를 사용하지 않음
```

**Playwright MCP 활용**:
```bash
# 크롤러 실행 모니터링
mcp__playwright__browser_navigate --url "http://localhost:3000/admin/crawler"
mcp__playwright__browser_snapshot

# Supabase 데이터 검증
mcp__supabase__execute_sql --query "SELECT * FROM hot_deals WHERE source = 'ppomppu' ORDER BY created_at DESC LIMIT 10"
```

### 5.2 실시간 UI 업데이트 테스트 (1.5시간)
**파일**: `e2e/hotdeal-realtime.spec.ts`

```typescript
// 테스트 시나리오
- 크롤러 실행 → Supabase 저장 확인
- /hotdeals 페이지 자동 업데이트 확인
- useHotDeals() hook 실시간 데이터 반영
- 필터링/정렬 기능 동작 확인
- 다국어 번역 실시간 로딩
```

**자가 치유 메커니즘**:
- WebSocket 재연결 자동 처리
- 네트워크 지연 시 폴백 전략
- 실시간 업데이트 실패 시 폴링 전환

### 5.3 데이터 정합성 테스트 (1시간)
**파일**: `e2e/data-integrity.spec.ts`

```typescript
// 테스트 시나리오
- 크롤링 데이터 → Supabase 저장 필드 매핑 검증
- snake_case 변환 정확성 (예: sourcePostId → source_post_id)
- 타임스탬프 및 타임존 처리
- 이미지 URL 및 콘텐츠 무결성
- 카테고리 매핑 정확성
```

### 5.4 크롤러 정리 계획 (0.5시간)
**✅ 크롤러 시스템 이미 완료**:
1. ✅ Ppomppu 크롤러 100% 작동 확인 (246개 항목, 최신 데이터 2025-08-03)
2. ✅ 모든 크롤러가 이미 Supabase 직접 저장 (LocalStorage 미사용)
3. ✅ 정리할 "LocalStorage 크롤러" 없음 - 이미 완료됨
4. 다른 사이트 크롤러는 Phase 8 이후 확장

## 🚀 Phase 5: Hot Deals 시스템 마이그레이션 (25시간 + 5시간 추가)

### 5.1 데이터베이스 구조 분석 (3시간)
**의존성**: DB.md 3단계 - hot_deals 의존 테이블

```bash
# 필수: Supabase MCP로 실제 테이블 구조 확인
mcp__supabase__execute_sql --query "SELECT * FROM hot_deals LIMIT 1"
mcp__supabase__execute_sql --query "SELECT * FROM hotdeal_translations LIMIT 1"
```

```typescript
// 관련 테이블 (Supabase에 이미 존재)
- hot_deals (독립)
- hotdeal_translations (hot_deals 참조)
- hot_deal_likes (hot_deals + users 참조) - 이미 구현됨
- user_favorite_hotdeals (hot_deals + users 참조) - 이미 구현됨
- hot_deal_comments (hot_deals + users 참조) - 이미 구현됨
```

**중요**: 절대 새 테이블 생성 금지! 기존 테이블 구조에 코드를 맞춰야 함

### 5.2 크롤러 아키텍처 현황 (검증 완료)
**✅ 크롤러는 이미 올바르게 구현됨**: ppomppu-crawler.ts가 Supabase에 직접 저장

```typescript
// ✅ ppomppu-crawler.ts 내의 실제 구현
private async saveToSupabase(hotdeals: HotDeal[]): Promise<{
  newDeals: number
  updatedDeals: number
  errors: number
}> {
  // 크롤링 데이터를 LocalStorage 거치지 않고 직접 Supabase에 저장
  // 중복 체크 (source + source_id로 unique 체크)
  // 기존 핫딜 업데이트 또는 새로운 핫딜 추가
}
```

**검증된 동작**:
- ✅ `ppomppu-crawler.ts`: Supabase 직접 저장 (246개 항목 확인)
- ✅ `crawler-manager.ts`: 단순 실행 매니저 (LocalStorage 미사용)
- ✅ `crawler-scheduler.ts`: 스케줄링 시스템 (LocalStorage 미사용)
- ✅ hot_deals 테이블에 실제 데이터 존재 확인

### 5.3 핫딜 서비스 구현 (5시간)
```typescript
// lib/services/supabase-hotdeal-service.ts
export class SupabaseHotDealService {
  // 핫딜 CRUD
  static async createHotDeal(data: HotDealInsert): Promise<HotDealRow | null>
  static async getHotDeals(options: HotDealQueryOptions): Promise<HotDealRow[]>
  static async updateHotDeal(id: string, updates: HotDealUpdate): Promise<boolean>
  
  // 번역 관리
  static async getTranslations(hotdealId: string, language?: string): Promise<TranslationRow[]>
  static async createTranslation(data: TranslationInsert): Promise<TranslationRow | null>
  
  // 통계 및 분석
  static async getHotDealStats(hotdealId?: string): Promise<HotDealStats>
  static async getPopularByCategory(category: string, limit?: number): Promise<HotDealRow[]>
}
```

### 5.4 UI 컴포넌트 업데이트 (5시간)
- HotDealList 컴포넌트 Supabase 연동
- HotDealCard 실시간 데이터 표시
- HotDealDetail 페이지 수정
- 검색 및 필터링 기능 구현
- useHotDeals() hook 활용

### 5.5 크롤러 시스템 정리 (3시간)
**✅ 크롤러 시스템 이미 LocalStorage 제거 완료**:
1. ✅ Ppomppu 크롤러 100% 작동 확인 완료 (246개 항목, 2025-08-03)
2. ✅ 현재 모든 크롤러가 Supabase에 직접 저장 (LocalStorage 사용 안함)
3. ✅ `crawler-manager.ts`: 단순 실행 매니저 (LocalStorage 미사용)
4. ✅ `crawler-scheduler.ts`: 스케줄링 시스템 (LocalStorage 미사용)
5. **크롤러 확장은 Phase 8 완료 후**: 
   - Ruliweb, Clien, Quasarzone 등 다른 사이트 크롤러
   - Ppomppu 크롤러를 베이스로 각 사이트별 맞춤 구현

### 5.6 마이그레이션 스크립트 (2시간)
```typescript
// scripts/migrate-hotdeals-to-supabase.ts
async function migrateHotDeals() {
  // 1. Supabase 테이블 구조 확인 (MCP 사용)
  const hotDealsColumns = await supabase.execute_sql(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hot_deals'"
  )
  
  // 2. 중복 방지 전략
  // - unique 제약조건 확인 (source_id + source)
  // - upsert 사용으로 중복 데이터 방지
  // - 기존 데이터와 비교하여 변경사항만 업데이트
  
  // 3. LocalStorage 데이터를 Supabase 구조에 맞춰 변환
  // 4. 필드 매핑 (100% 정확한 매핑 필수)
  // 5. 데이터 타입 변환 및 검증
  // 6. 관계 데이터 정합성 검증
  // 7. 배치 upsert with 트랜잭션 및 롤백 지원
}
```

## 📊 Phase 진행 상태 명확화

### 완료된 Phase (Phase 1-4) ✅
- **Phase 1**: 사용자 인증 및 프로필 - 100% 완료
- **Phase 2**: Buy-for-me 시스템 - 서비스 완료, UI 연동 필요
- **Phase 3**: 커뮤니티 기능 - 100% 완료
- **Phase 4**: 시스템 관리 - 100% 완료

### 진행 예정 Phase 🚧
- **Phase 5**: Hot Deals 시스템 (30시간)
- **Phase 6**: 관리자 기능 (13시간) - Posts 대체
- **Phase 7**: Orders & Payments 통합 (20시간)
- **Phase 8**: LocalStorage 완전 제거 (10시간)

## ❌ Phase 6 변경사항: Posts 시스템 제거

### 제거 결정 근거
- Supabase에 posts 관련 테이블 없음 확인
- HiKo의 핵심 기능이 아님 (핫딜과 구매대행이 핵심)
- 대시보드의 "Recent Posts" 위젯만을 위한 기능
- 관리자 핫딜 CRUD로 필요 기능 대체 가능

### 영향
- 프로젝트 시간 15시간 → 13시간으로 단축
- LocalStorage의 Post 모델 제거 예정
- 전체 프로젝트 기간 2시간 단축

## 🔧 Phase 6: 관리자 기능 구현 (13시간) - Posts 대체

### 6.1 관리자 핫딜 CRUD 기능 (8시간)

**구현 내용**:
- 경로: `/admin/hotdeal-manager`
- 권한: admin role only
- 기존 hot_deals 테이블 활용

**기능 명세**:
```typescript
// 핫딜 관리 기능
- 핫딜 목록 조회 (페이지네이션, 필터링, 검색)
- 핫딜 생성 (수동 입력)
- 핫딜 수정 (제목, 가격, 상태, 카테고리 등)
- 핫딜 삭제 (soft delete with deleted_at)
- 일괄 작업 (bulk operations)
- 이미지 업로드 및 관리

// 구현 방식
- 기존 SupabaseHotDealService 활용
- React Query로 실시간 동기화
- Zod 스키마 검증
- 관리자 활동 로그 자동 기록 (admin_activity_logs)
```

### 6.2 미연결 테이블 활용 계획 (5시간)

#### 1. proxy_purchase_addresses 테이블 (2시간)
```typescript
// Buy-for-me 전용 배송 주소 관리
- 용도: proxy_purchases_request와 연계된 배송 주소
- 구현: SupabaseAddressService 확장
- 기능: 주문별 배송 주소 이력 관리, 주소 검증
```

#### 2. proxy_purchase_quotes 테이블 (1시간)
```typescript
// Buy-for-me 견적 관리
- 용도: 구매대행 요청에 대한 견적서 관리
- 구현: SupabaseOrderService에 견적 기능 추가
- 기능: 자동 견적 계산, 견적 이력 관리, 승인/거절 프로세스
```

#### 3. order_status_history 테이블 (1시간)
```typescript
// 주문 상태 변경 이력
- 용도: 모든 주문의 상태 변경 추적
- 구현: SupabaseOrderStatusManager 생성
- 기능: 상태 전이 기록, 타임스탬프, 변경자 추적
```

#### 4. comment_likes 테이블 (0.5시간)
```typescript
// 현재 상태: UI/Service 구현 완료, LocalStorage 사용 중
// 즉시 작업에서 Supabase 전환 예정 (2시간 별도 배정)
```

#### 5. crawling_logs 테이블 (0.5시간)
```typescript
// 크롤링 로그 관리
- 용도: 크롤러 실행 이력 및 성능 모니터링
- 구현: SupabaseCrawlerService에 이미 부분 구현
- 기능: 크롤링 시작/종료 시간, 수집 건수, 오류 추적
```

## 💳 Phase 7: Orders & Payments 통합 (20시간)

### 7.1 결제 시스템 통합 (8시간)
```typescript
// lib/services/supabase-payment-integration.ts
export class SupabasePaymentIntegration {
  // 결제 게이트웨이 연동
  static async createPaymentIntent(orderId: string, amount: number): Promise<PaymentIntent>
  static async processPayment(paymentId: string, paymentData: PaymentData): Promise<PaymentResult>
  static async handleWebhook(event: PaymentWebhookEvent): Promise<void>
  
  // 결제 상태 관리
  static async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<boolean>
  static async getPaymentHistory(userId: string): Promise<PaymentRow[]>
}
```

### 7.2 주문 상태 관리 시스템 (6시간)
```typescript
// lib/services/supabase-order-status-manager.ts
export class SupabaseOrderStatusManager {
  // 상태 전이 관리
  static async transitionStatus(orderId: string, newStatus: OrderStatus, userId: string): Promise<boolean>
  static async getStatusHistory(orderId: string): Promise<OrderStatusHistoryRow[]>
  
  // 자동화 규칙
  static async checkAndUpdateExpiredOrders(): Promise<void>
  static async sendStatusNotifications(orderId: string, status: OrderStatus): Promise<void>
}
```

### 7.3 관리자 대시보드 (6시간)
- 주문 관리 인터페이스
- 결제 확인 및 환불 처리
- 주문 상태 일괄 업데이트
- 매출 통계 및 리포트

## 🗑️ Phase 8: LocalStorage 완전 제거 (10시간)

### 8.1 의존성 분석 및 제거 (4시간)
```typescript
// 제거 대상 파일
- lib/db/local/*
- lib/db/storage.ts
- hooks/use-local-db.ts
- scripts/initialize-mock-data.ts
```

### 8.2 코드 리팩토링 (4시간)
- 모든 LocalStorage 참조 제거
- Repository 패턴 → Supabase 서비스로 전환
- 타입 정의 정리

### 8.3 최종 검증 (2시간)
- 전체 기능 회귀 테스트
- 성능 벤치마크
- 보안 감사

## 📊 성과 지표 및 예상 일정

### 📅 현실적인 일정
- **총 소요 시간**: 44시간 (약 5.5일)
- **완료된 시간**: 42시간 (Wave 1-4 완료, Wave 5 90% 완료)
- **남은 시간**: 2시간 (Wave 6 최종 마무리)
- **우선순위**: Wave 6 Task 6.1 (검색) → Task 6.2 (대시보드) → Task 6.3 (정리)
- **즉시 실행 가능**: 모든 준비 완료

### ✅ 즉시 실행 가능한 작업
1. **search-results.tsx 수정** - useSearchHotDeals hook으로 교체
2. **recent-posts.tsx 수정** - Supabase hooks로 변경
3. **dashboard-stats.tsx 수정** - Supabase hooks로 변경
3. **테스트 실행** - 변경사항 검증

### 성능 목표
- API 응답 시간: <200ms (p95)
- 데이터베이스 쿼리: <50ms (p95)
- 페이지 로드: <3초 (3G 네트워크)

### 품질 지표
- 테스트 커버리지: >80%
- E2E 테스트 성공률: 100%
- 타입 안정성: 100% (no any)

### 보안 체크리스트
- [ ] RLS 정책 모든 테이블 적용
- [ ] API 키 환경 변수 관리
- [ ] SQL 인젝션 방지
- [ ] XSS 방지

## 🔄 위험 관리 - 상세 분석

### 🚨 주요 위험 요소 및 대응 방안

#### 1. **TypeScript 타입 안정성 문제** 🔴 위험도: 매우 높음
**새로 발견된 문제**:
- database.types.ts가 빈 파일 → 모든 Supabase 작업이 any 타입
- 타입 체크 없이 작업 시 런타임 오류 가능성 높음
- strict 모드 위반으로 ESLint 오류 발생

**대응 방안**:
- 즉시 `pnpm gen:types` 실행 필수
- 모든 서비스 파일 타입 검증
- CI/CD에 타입 체크 단계 추가

#### 2. **UI 연동 불일치 문제** 🔴 위험도: 높음
**새로 발견된 문제**:
- buy-for-me-modal이 여전히 LocalStorage hook 사용
- comment_likes UI는 구현됐지만 LocalStorage 사용
- 사용자 혼란 및 데이터 불일치 가능

**대응 방안**:
- import 경로 일괄 변경 스크립트 작성
- 모든 컴포넌트 의존성 검증
- 점진적 마이그레이션 대신 일괄 전환

#### 3. **데이터 무결성 및 매핑 문제** 🔴 위험도: 높음
**문제점**:
- LocalStorage (JSON 문자열) vs Supabase (강타입) 데이터 타입 불일치
- camelCase vs snake_case 필드명 변환 오류
- Foreign Key 제약조건으로 인한 참조 무결성 오류

**대응 방안**:
```typescript
// 데이터 타입 변환 유틸리티
class DataTypeConverter {
  static toSupabase(localData: any): SupabaseData {
    // 시간대 처리, ENUM 검증, UUID 형식 검증
  }
}
```

#### 2. **TypeScript 타입 안정성 문제** 🔴 위험도: 매우 높음
**문제점**:
- database.types.ts 파일이 비어있음 (1줄만 존재)
- 모든 Supabase 작업이 'any' 타입으로 진행
- 컴파일 타임 타입 검증 불가능

**대응 방안**:
```bash
# 즉시 실행 필요
pnpm gen:types
```
- Supabase CLI를 통한 타입 자동 생성
- 모든 서비스 파일 타입 적용 검증
- CI/CD에 타입 생성 자동화 추가

#### 3. **UI-Service 레이어 연동 불일치** 🔴 위험도: 높음
**문제점**:
- buy-for-me-modal.tsx가 여전히 LocalStorage hook 사용
- useSupabaseBuyForMe hook은 구현되었으나 미사용
- 사용자가 LocalStorage 데이터만 보게 됨

**대응 방안**:
```typescript
// 잘못된 import
import { useBuyForMe } from '@/hooks/use-buy-for-me'
// 올바른 import  
import { useSupabaseBuyForMe } from '@/hooks/use-supabase-buy-for-me'
```

#### 4. **성능 및 확장성 문제** 🔴 위험도: 높음
**문제점**:
- 동기(LocalStorage) → 비동기(Supabase) 전환으로 인한 UX 저하
- 다중 사용자 동시 업데이트 충돌
- Rate Limiting (특히 크롤링 시)

**대응 방안**:
```typescript
// 캐싱 전략
const cacheStrategy = {
  hotDeals: 5 * 60 * 1000, // 5분
  userProfile: 30 * 60 * 1000, // 30분
}

// Optimistic UI 패턴
const optimisticUpdate = {
  update: localCache,
  commit: supabaseUpdate,
  rollback: revertLocalCache
}
```

#### 5. **보안 및 권한 문제** 🔴 위험도: 매우 높음
**문제점**:
- RLS 정책 구현 누락 시 데이터 유출
- Service Role Key vs Anon Key 사용 구분
- Clerk role과 Supabase RLS 정책 동기화

**대응 방안**:
```sql
-- RLS 정책 템플릿
CREATE POLICY "Users can only see their own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

-- 절대 클라이언트에서 Service Role Key 사용 금지!
```

#### 6. **마이그레이션 실행 위험** 🟡 위험도: 중간
**문제점**:
- 스크립트 재실행 시 데이터 중복
- 트랜잭션 부분 실패 처리
- Phase별 롤백 복잡성

**대응 방안**:
- 마이그레이션 이력 테이블 관리
- 멱등성(Idempotency) 보장
- 체크포인트 기반 재시작

#### 7. **E2E 테스트 한계** 🟡 위험도: 중간
**문제점**:
- Playwright MCP 서버 의존성
- 48개 조합 (8개 언어 × 3개 브라우저 × 2개 환경) 테스트 시간

**대응 방안**:
- 우선순위 기반 테스트 (Critical Path 먼저)
- 병렬 테스트 실행
- 자가 치유 무한 루프 방지 (최대 재시도 3회)

#### 8. **Phase 6 (Posts) 제거 결정** ✅ 해결됨
**해결 내용**:
- Supabase에 posts 관련 테이블 없음 확인
- Phase 6 완전 제거 결정
- LocalStorage의 posts 기능 폐기

### 📊 위험 모니터링 대시보드
```typescript
interface MigrationMetrics {
  phase: string
  totalRecords: number
  processedRecords: number
  failedRecords: number
  duration: number
  errors: Error[]
  rollbackAvailable: boolean
}
```

### 🚦 Go/No-Go 체크리스트
각 Phase 시작 전 확인:
- [ ] 이전 Phase 100% 완료 및 검증
- [ ] 롤백 스크립트 준비 완료
- [ ] 성능 메트릭 기준선 측정
- [ ] RLS 정책 검토 완료
- [ ] 백업 완료

### 🔄 점진적 롤아웃 전략
```typescript
const featureFlags = {
  supabaseAuth: { enabled: true, rollout: 100 },
  supabaseHotDeals: { enabled: false, rollout: 0 },
  supabasePosts: { enabled: false, rollout: 0 }
}
```

## 📝 문서화

### 필수 문서
- [ ] API 문서 (OpenAPI 3.0)
- [ ] 데이터베이스 스키마 문서
- [ ] 마이그레이션 가이드
- [ ] 운영 매뉴얼

## 🛠️ 핵심 작업 원칙 (DB.md 지침 준수)

### 데이터베이스 접근 원칙
1. **Supabase MCP 우선 사용**
   - 모든 테이블 구조는 `mcp__supabase__` 명령으로 확인
   - `database.types.ts`를 참조하되, 실제 테이블이 최종 기준
   
2. **의존성 기반 구현 순서**
   - DB.md의 단계별 구현 순서 엄격히 준수
   - 독립 테이블 → 1차 의존 → 2차 의존 순서
   
3. **데이터 매핑 정확성**
   - LocalStorage 필드 → Supabase 컬럼 100% 매핑
   - snake_case ↔ camelCase 변환 철저히
   - 타입 호환성 검증 필수
   - **중복 데이터 방지**: upsert 사용, unique 제약조건 확인
   - 충돌/오류/누락/중복 방지를 위한 검증 로직 필수

## 🎯 성공 기준

1. **기능적 요구사항**
   - 모든 LocalStorage 기능 Supabase로 대체
   - 기존 기능 100% 호환성 유지
   - 실시간 동기화 지원
   - **새 테이블 생성 0건** (기존 테이블만 사용)

2. **비기능적 요구사항**
   - 99.9% 가용성
   - 동시 사용자 1,000명 지원
   - 월 100만 요청 처리

3. **개발 효율성**
   - 새 기능 개발 시간 50% 단축
   - 유지보수 비용 30% 감소
   - 배포 자동화 100%

## 📋 현재 프로젝트 상태

### 하이브리드 상태 (LocalStorage + Supabase)
현재 Phase 1-4가 완료되어 다음 기능들이 Supabase로 마이그레이션되었습니다:
- ✅ 사용자 인증 및 프로필 (Clerk + Supabase users)
- ✅ Buy-for-me 주문 시스템 (proxy_purchases_request)
- ✅ 커뮤니티 기능 (댓글, 좋아요, 즐겨찾기)
- ✅ 시스템 관리 (알림, 관리자 로그, 설정)
- ❌ Hot Deals 시스템 (아직 LocalStorage)
- ❌ Posts 시스템 (아직 LocalStorage)
- ❌ Orders & Payments 완전 통합 (부분적)

### 완료된 파일 위치

#### Phase 1: 사용자 시스템
- `lib/services/supabase-user-service.ts` - 사용자 서비스
- `hooks/use-supabase-profile.ts` - 프로필 React Query hook
- `actions/auth/sync-user.ts` - Clerk-Supabase 동기화
- `lib/auth/admin.ts` - 권한 관리

#### Phase 2: Buy-for-me 시스템
- `lib/services/supabase-order-service.ts` - 주문 서비스
- `lib/services/supabase-payment-service.ts` - 결제 서비스
- `lib/services/supabase-address-service.ts` - 주소 서비스
- `hooks/use-supabase-buy-for-me.ts` - Buy-for-me 통합 hook
- `components/features/order/buy-for-me-modal.tsx` - 수정된 UI
- `app/mypage/page.tsx` - 수정된 마이페이지

#### Phase 3: 커뮤니티 기능
- `lib/services/supabase-comment-service.ts` - 댓글 서비스
- `lib/services/supabase-like-service.ts` - 좋아요 서비스
- `lib/services/supabase-favorite-service.ts` - 즐겨찾기 서비스
- `hooks/use-supabase-community.ts` - 커뮤니티 통합 hook

#### Phase 4: 시스템 관리
- `lib/services/supabase-notification-service.ts` - 알림 서비스
- `lib/services/supabase-admin-log-service.ts` - 관리자 로그
- `lib/services/supabase-system-settings-service.ts` - 시스템 설정
- `hooks/use-supabase-system.ts` - 시스템 통합 hook

#### 테스트 스크립트
- `scripts/test-supabase-phase1.ts` - Phase 1 검증
- `scripts/test-phase2-buyfor-integration.ts` - Phase 2 통합 테스트
- `scripts/test-phase3-community.ts` - Phase 3 테스트
- `scripts/test-phase4-system.ts` - Phase 4 테스트

## 🔧 테스트 실행 명령어

### Phase별 테스트
```bash
# Phase 1-4 통합 테스트 (완료된 기능)
pnpm tsx scripts/test-supabase-phase1.ts
pnpm tsx scripts/test-phase2-buyfor-integration.ts  
pnpm tsx scripts/test-phase3-community.ts
pnpm tsx scripts/test-phase4-system.ts

# Phase 5 테스트 (Hot Deals - 예정)
pnpm tsx scripts/test-phase5-hotdeals.ts

# Phase 6 테스트 (Posts - 예정)
pnpm tsx scripts/test-phase6-posts.ts

# E2E 테스트 실행 (Playwright MCP)
mcp__playwright__browser_navigate --url "http://localhost:3000"
mcp__playwright__browser_snapshot
```

## 🚦 실행 승인

이 계획서는 LocalStorage를 Supabase로 완전히 대체하는 종합적인 로드맵입니다. Phase별로 진행하며, 각 단계마다 E2E 테스트를 통해 검증합니다.

**현재 상태**: Wave 1-4 완료, Wave 5 90% 완료 (42시간 소요)
**다음 단계**: Wave 6 실행 - 남은 3개 파일 마이그레이션 (2시간)

## 🆘 문제 해결 가이드

### 일반적인 문제

#### 1. Supabase 연결 오류
```typescript
// 오류: PostgrestError: JWT expired
// 해결: .env 파일의 SUPABASE_SERVICE_ROLE_KEY 확인
```

#### 2. TypeScript 타입 오류
```bash
# database.types.ts 재생성
pnpm gen:types
```

#### 3. RLS 정책 오류
```sql
-- 오류: permission denied for table
-- 해결: Service Role Key 사용 또는 RLS 정책 추가
```

#### 4. 데이터 매핑 오류
```typescript
// camelCase ↔ snake_case 변환
// LocalStorage: userId → Supabase: user_id
```

### MCP 관련 문제
- Supabase MCP 인증 실패: ACCESS_TOKEN 확인
- Playwright MCP 연결 실패: 브라우저 재시작
- Context7 MCP 속도 저하: 캐시 활용

## 📊 마이그레이션 진행 메트릭스

### 현재 상태 (2025-08-03) - 75% 완료
```
테이블 활용률: 13/18 = 72.2%
- ✅ 활용 중: users, user_profiles, user_addresses, hot_deals, hot_deal_comments, hot_deal_likes, user_favorite_hotdeals, proxy_purchases_request, payments, notifications, admin_activity_logs, system_settings, hotdeal_translations
- ❌ 미연결: proxy_purchase_addresses, proxy_purchase_quotes, order_status_history, comment_likes, crawling_logs

서비스 구현률: 13/13 = 100%
- ✅ 모든 서비스 파일 구현 완료

UI 연동률: 10/13 = 76.9%
- ✅ 완료: 프로필, 커뮤니티, 시스템 관리
- ❌ 미완: buy-for-me-modal, comment_likes UI, 핫딜 전체

LocalStorage 대체율: 13/18 = 72.2%
- ✅ 대체 완료: 사용자, 프로필, 주소, 댓글, 좋아요, 즐겨찾기, 알림, 로그, 설정
- ⚠️ 부분 대체: 핫딜, 주문, 결제
- ❌ 미대체: Posts (제거 예정)
```

### 목표 상태 (Phase 8 완료 후) - 100%
```
테이블 활용률: 18/18 = 100%
서비스 구현률: 13/13 = 100% (유지)
UI 연동률: 13/13 = 100%
LocalStorage 대체율: 18/18 = 100%
```

### Phase별 진행도
- Phase 1-4: ✅ 100% 완료
- Phase 5 (Hot Deals): 🚧 0% (30시간)
- Phase 6 (관리자): 🚧 0% (13시간)
- Phase 7 (Orders/Payments): 🚧 0% (20시간)
- Phase 8 (LocalStorage 제거): 🚧 0% (10시간)

## 📋 Wave 5-6 실행 요약

### Wave 5 핵심 사항 (90% 완료)
- ✅ **통계 대시보드** - 완전 구현됨 (useHotDealStats, 실시간 analytics)
- ✅ **번역 시스템** - Google Translate API + 7일 캐시 완료
- ✅ **실시간 업데이트** - Supabase realtime 구독 완료
- ✅ **크롤러 시스템** - ppomppu-crawler 작동 중
- ❌ **검색 기능** - 아직 LocalStorage 사용 중

### Wave 6 핵심 사항 (2시간)
- **검색 기능 전환** - search-results.tsx (45분)
- **대시보드 전환** - recent-posts.tsx, dashboard-stats.tsx (45분)
- **최종 정리** - USE_SUPABASE 플래그 제거, 테스트 (30분)

### 최종 타임라인
- Wave 1-4: ✅ 완료 (34시간)
- Wave 5: ✅ 90% 완료 (8시간)
- Wave 6: 🚧 2시간 예상
- **총 소요 시간**: 44시간 (42시간 완료, 2시간 남음)

## 🎯 핵심 요약 - 반드시 기억할 사항

### 1. Supabase MCP는 읽기 전용
- **절대 테이블 생성/수정 불가**
- 모든 필요한 테이블은 이미 존재
- 코드를 Supabase 스키마에 맞춰 수정해야 함

### 2. 크롤러 시스템 아키텍처
- ✅ **올바른 구현**: `supabase-crawler-service.ts` - LocalStorage 거치지 않고 직접 Supabase 저장
- ❌ **잘못된 구현**: LocalStorage에 먼저 저장하고 변환하는 방식
- **크롤러 확장 시기**: 모든 Supabase 마이그레이션 완료 후 (Phase 8 이후)

### 3. 데이터 저장 원칙
- **모든 데이터는 LocalStorage를 거치지 않고 바로 Supabase에 저장**
- 충돌/오류/누락/중복 방지를 위한 100% 정확한 데이터 매핑
- snake_case ↔ camelCase 변환 철저히

### 4. 즉시 필요 작업 (7시간)
- database.types.ts 생성 (1시간)
- buy-for-me-modal Supabase 연동 (2시간)
- comment_likes UI 연동 (2시간)
- 접근성 개선 (2시간)
- 중복 크롤러 시스템 정리
- E2E 테스트 구현
- 크롤러 확장은 Phase 8 이후로 연기

### 5. 테이블 활용 현황
- **전체 테이블**: 19개
- **현재 활용**: 16개 (84.2%)
- **미활용**: 2개 (hotdeal_translations, comment_likes)
- **중복 문제**: profiles vs user_profiles

### 6. 스키마 매핑 현황
- **Supabase → 프로젝트**: 17/19 (89.5%)
- **프로젝트 → Supabase**: 11/12 (91.7%)
- **LocalStorage 대체**: 15/19 (78.9%)

## 📊 마이그레이션 완성도 예측

### 현재 상태 (2025-08-03)
- **Supabase 테이블 활용률**: 16/19 = **84.2%**
- **프로젝트 스키마 매핑률**: 11/12 = **91.7%**
- **LocalStorage 대체율**: 12/19 = **63.2%**

### 전체 계획 실행 후
- **Supabase 테이블 활용률**: 19/19 = **100%**
- **프로젝트 스키마 매핑률**: 11/11 = **100%** (Post 제거)
- **LocalStorage 대체율**: 18/19 = **94.7%** (클라이언트 전용 제외)

### Gap 해결 전략
1. **미사용 테이블 활용**
   - hotdeal_translations: Phase 5-1에서 구현
   - comment_likes: UI 구현됨, Supabase 연동 필요 (2시간)

2. **스키마 불일치 해결**
   - clerk_user_id 연결
   - source_id vs sourcePostId 매핑
   - profiles 테이블 통합

3. **LocalStorage 전략**
   - 서버 데이터: 100% Supabase
   - 클라이언트 설정: 하이브리드 접근
   - 개인화 데이터: 선택적 마이그레이션

## 📊 현재 상태 요약 (2025-08-04)
- **전체 진행률**: 95% 완료
- **남은 작업**: LocalStorage 사용하는 3개 파일만 마이그레이션 필요
- **예상 소요시간**: 2시간
- **필요한 hooks**: 모두 이미 구현됨 (useSearchHotDeals, useSupabaseAdminStats 등)
- **크롤러 시스템**: 100% Supabase 직접 연동 (LocalStorage 미사용)

## 📅 상세 타임라인 (총 80시간 = 10일)

### ✅ 완료된 작업 (35시간 + 실제 34시간)
- **Phase 0**: 사실 확인 및 검증 (5시간) ✅
- **Phase 1**: 사용자 인증 및 프로필 (10시간) ✅
- **Phase 2**: Buy-for-me 시스템 (10시간) ✅
- **Phase 3**: 커뮤니티 기능 (5시간) ✅
- **Phase 4**: 시스템 관리 (5시간) ✅
- **Hot Deals 인프라**: 95% 완료 (실제 작업 34시간) ✅
  - 18개 테이블 모두 구현
  - 모든 서비스와 hooks 구현 완료
  - 크롤러 시스템 100% Supabase 연동

### 🚧 진행 예정 작업 (45시간)

#### 🔥 즉시 실행 가능한 작업 (2시간 - 남은 5%)
**LocalStorage를 사용하는 마지막 3개 파일 마이그레이션**:
1. **search-results.tsx** (45분)
   - `useSearchHotDeals` hook 사용으로 전환
   - HotDeal 타입을 HotDealRow로 매핑
   - 필터링 및 정렬 로직 조정
   
2. **dashboard-stats.tsx** (50분)
   - `useSupabaseAdminStats` 또는 새로운 통계 hook 생성
   - 사용자/핫딜/주문 통계 Supabase 연동
   - 실시간 데이터 업데이트 구현
   
3. **recent-posts.tsx** (25분)
   - 커뮤니티 posts 대신 hot deals 데이터 사용
   - `useHotDeals` 또는 `useRecentHotDeals` hook 활용
   - 최신 핫딜 표시로 변경
   
4. **최종 검증 및 정리** (10분)
   - ESLint 및 TypeScript 오류 확인
   - 모든 LocalStorage import 제거 확인
   - 테스트 실행

#### Week 1 (즉시 시작 - 7시간)
- **필수 인프라 수정** (7시간) - ⚠️ 실제로는 모두 완료됨
  - database.types.ts 생성 (1시간) - ✅ 이미 존재 (1046줄)
  - buy-for-me-modal Supabase 연동 (2시간) - ✅ 이미 완료
  - comment_likes UI 연동 (2시간) - ✅ 이미 구현됨
  - 접근성 개선 (2시간)

#### Week 2 (20시간)
- **Phase 5**: Hot Deals 시스템 마이그레이션 (20시간)
  - 컴포넌트 Supabase 연동
  - 크롤러 시스템 정리
  - 번역 시스템 활성화
  - 카테고리 매핑

#### Week 3 (18시간)
- **Phase 7**: E2E 테스트 자동화 (8시간)
  - Playwright MCP 설정
  - 테스트 시나리오 작성
  - CI/CD 통합
  
- **Phase 8**: LocalStorage 완전 제거 (10시간)
  - 모든 LocalStorage 참조 제거
  - 마이그레이션 스크립트 정리
  - 최종 검증 및 문서화

### 마일스톤
1. **7시간 후**: TypeScript 타입 안정성 확보, UI 연동 완료
2. **27시간 후**: Hot Deals 완전 마이그레이션
3. **35시간 후**: E2E 테스트 자동화 완성
4. **45시간 후**: LocalStorage 100% 제거, Supabase 전환 완료

### 리소스 배분
- **개발**: 60% (48시간)
- **테스트**: 25% (20시간)
- **문서화**: 15% (12시간)