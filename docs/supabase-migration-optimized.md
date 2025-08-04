# Supabase Migration Master Plan - AI 최적화 버전

## 📊 현재 상태 대시보드 (2025-08-04)
```
전체 진행률: ████████████████████░ 95% 완료
완료: Wave 1-4 (100%) + Wave 5 (90%)
남은 작업: 3개 파일만 LocalStorage → Supabase 전환
예상 소요시간: 2시간
실제 Supabase 데이터: hot_deals(246개), users(4개)
```

## 🚨 즉시 실행 작업 (2시간)

### ✅ Task 1: search-results.tsx 마이그레이션 (45분)
```typescript
// 현재 (❌ LocalStorage)
import { db } from '@/lib/db/database-service'
const deals = await db.hotdeals.searchByKeyword(query)
const deals = await db.hotdeals.findActive()

// 변경 (✅ Supabase)
import { useSearchHotDeals, useHotDeals } from '@/hooks/use-supabase-hotdeals'
const { data: searchResults } = useSearchHotDeals(query, filters)
const { data: allDeals } = useHotDeals(filters)
```
**파일 위치**: `components/features/search/search-results.tsx`

### ✅ Task 2: dashboard-stats.tsx 마이그레이션 (30분)
```typescript
// 현재 (❌ LocalStorage)
import { usePosts, useUsers, useComments } from '@/hooks/use-local-db'

// 변경 (✅ Supabase)
import { useSupabaseAdminStats } from '@/hooks/use-supabase-admin'
const { data: stats } = useSupabaseAdminStats()
```
**파일 위치**: `components/features/dashboard/dashboard-stats.tsx`

### ✅ Task 3: recent-posts.tsx 마이그레이션 (15분)
```typescript
// 현재 (❌ LocalStorage)
import { usePosts, useUsers } from '@/hooks/use-local-db'

// 변경 (✅ Supabase)
import { useHotDeals } from '@/hooks/use-supabase-hotdeals'
const { data: recentDeals } = useHotDeals({ limit: 5, orderBy: 'created_at' })
```
**파일 위치**: `components/features/dashboard/recent-posts.tsx`

### ✅ Task 4: 최종 검증 (30분)
```bash
# 1. TypeScript 및 ESLint 검증
pnpm lint
pnpm tsc --noEmit

# 2. 개발 서버 실행 및 테스트
pnpm dev

# 3. 검색 기능 테스트
# http://localhost:3000/search 에서 검색 기능 확인

# 4. 대시보드 확인
# http://localhost:3000/dashboard 에서 통계 및 최근 항목 확인
```

## 🔧 환경 설정 (.env)
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://vyvzihzjivcfhietrpnd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dnppaHpqaXZjZmhpZXRycG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDk0NTYsImV4cCI6MjA2ODgyNTQ1Nn0.vHCZ_N-vwzJTCMd377j0EiOdL1QlT9FznQALIIQDGd4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dnppaHpqaXZjZmhpZXRycG5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI0OTQ1NiwiZXhwIjoyMDY4ODI1NDU2fQ.F4klI_xu5CO5Yw4GPSFKQ6prJwUTcC0hgNJH-txU06k
SUPABASE_ACCESS_TOKEN=sbp_91779e7795e849124b32f8be6bd01c7eb5057b9b

# Clerk 설정
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dG9nZXRoZXItdmlwZXItNTkuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_m9vBfuG3DKCxC8VxBR4Fyr3Wx3vEasaLNMX0S7DPDv

# 기타 설정
USE_SUPABASE=true
```

## ⚠️ 핵심 제약사항
1. **절대 테이블 생성 금지** - 모든 테이블은 이미 Supabase에 존재
2. **Supabase MCP는 읽기 전용** - 테이블 생성/수정 불가
3. **LocalStorage 우회** - 모든 데이터는 바로 Supabase에 저장
4. **타입 안전성** - `any` 타입 사용 금지, strict mode 준수
5. **코드 품질** - 반드시 `pnpm lint && pnpm tsc --noEmit` 통과

## 📁 Supabase 테이블 현황 (18개 모두 생성 완료)
```
✅ users                    ✅ hot_deal_comments
✅ user_profiles            ✅ hot_deal_likes
✅ user_addresses           ✅ user_favorite_hotdeals
✅ hot_deals                ✅ notifications
✅ hotdeal_translations     ✅ admin_activity_logs
✅ proxy_purchases_request  ✅ system_settings
✅ proxy_purchase_quotes    ✅ crawling_logs
✅ payments                 ✅ comment_likes
✅ order_status_history     ✅ proxy_purchase_addresses
```

## ✅ 완료된 작업 체크리스트

### Wave 1: 사용자 인증 (10시간) ✅
- [x] Clerk + Supabase users 연동
- [x] 프로필 시스템 구현
- [x] 실시간 동기화

### Wave 2: Buy-for-me (10시간) ✅
- [x] 주문 시스템 전환
- [x] buy-for-me-modal.tsx Supabase 연동
- [x] 결제 시스템 기초

### Wave 3: 커뮤니티 (10시간) ✅
- [x] 댓글 시스템
- [x] 좋아요 기능
- [x] 즐겨찾기

### Wave 4: 시스템 (5시간) ✅
- [x] 알림 시스템
- [x] 관리자 로그
- [x] 시스템 설정

### Wave 5: Hot Deals (90% 완료) ✅
- [x] 크롤러 시스템 (ppomppu 246개 항목)
- [x] 번역 시스템 (Google Translate API)
- [x] 실시간 업데이트
- [x] 통계 대시보드
- [ ] 검색 컴포넌트 (search-results.tsx) - **남은 작업**

### Wave 6: 최종 마무리 (진행 중) 🚧
- [ ] 검색 결과 컴포넌트 전환 - **45분**
- [ ] 대시보드 통계 전환 - **30분**
- [ ] 최근 항목 위젯 전환 - **15분**
- [ ] USE_SUPABASE 플래그 제거 - **10분**
- [ ] 최종 테스트 - **20분**

## 📚 기술 참조

<details>
<summary>완료된 서비스 파일들 (클릭하여 펼치기)</summary>

### 구현된 서비스 (14개)
- `lib/services/supabase-user-service.ts`
- `lib/services/supabase-profile-service.ts`
- `lib/services/supabase-order-service.ts`
- `lib/services/supabase-payment-service.ts`
- `lib/services/supabase-address-service.ts`
- `lib/services/supabase-comment-service.ts`
- `lib/services/supabase-like-service.ts`
- `lib/services/supabase-favorite-service.ts`
- `lib/services/supabase-notification-service.ts`
- `lib/services/supabase-admin-log-service.ts`
- `lib/services/supabase-system-settings-service.ts`
- `lib/services/supabase-hotdeal-service.ts`
- `lib/services/supabase-translation-service.ts`
- `lib/services/supabase-crawler-service.ts`

### 구현된 Hooks (10개)
- `hooks/use-supabase-user.ts`
- `hooks/use-supabase-profile.ts`
- `hooks/use-supabase-buy-for-me.ts`
- `hooks/use-supabase-order.ts`
- `hooks/use-supabase-community.ts`
- `hooks/use-supabase-system.ts`
- `hooks/use-supabase-hotdeals.ts`
- `hooks/use-supabase-admin.ts`
- `hooks/use-clerk-role.ts`
- `hooks/use-supabase-*-addresses.ts`

</details>

<details>
<summary>TypeScript 타입 정의 (클릭하여 펼치기)</summary>

### database.types.ts 상태
- ✅ 완전히 구현됨 (1046줄)
- ✅ 18개 테이블 모두 타입 정의
- ✅ Supabase CLI로 자동 생성

### 타입 생성 명령어
```bash
pnpm gen:types
```

</details>

<details>
<summary>문제 해결 가이드 (클릭하여 펼치기)</summary>

### 일반적인 오류

1. **TypeScript 타입 오류**
```bash
pnpm gen:types  # 타입 재생성
```

2. **Supabase 연결 오류**
```typescript
// JWT expired → .env의 SUPABASE_SERVICE_ROLE_KEY 확인
```

3. **데이터 매핑 오류**
```typescript
// camelCase ↔ snake_case
// userId → user_id
// sourcePostId → source_post_id
```

</details>

## 🎯 작업 완료 후 업데이트 방법

1. 완료된 작업에 [x] 체크
2. 새로운 이슈 발견 시 "즉시 실행 작업" 섹션에 추가
3. 진행률 업데이트 (현재 95% → 100%)
4. 소요 시간 기록

---

**마지막 업데이트**: 2025-08-04  
**다음 목표**: 2시간 내 100% 완료