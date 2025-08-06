# 📋 HiKo Next.js 15 비즈니스 로직 명세서

## 1. 핵심 기능 분류

### Server Components (SEO/초기렌더링)
- **핫딜 리스트 페이지**: `src/app/page.tsx` - 크롤링된 핫딜 목록을 서버에서 렌더링하여 SEO 최적화
- **핫딜 상세 페이지**: `src/app/hotdeals/[id]/page.tsx` - 개별 핫딜 정보를 동적 라우트로 제공
- **관리자 대시보드**: `src/app/admin/orders/page.tsx` - 주문 목록과 통계를 서버에서 렌더링
- **핫딜 카드**: `src/components/features/hotdeal/hotdeal-card.tsx` - 핫딜 정보 표시 컴포넌트
- **레이아웃**: `src/app/layout.tsx`, `src/components/layout/header.tsx` - 전체 앱 구조

### Client Components (상호작용)
- **언어 선택기**: `src/components/features/language/language-selector.tsx` - 사용자 언어 설정 변경
- **핫딜 필터**: `src/components/features/hotdeal/hotdeal-filter.tsx` - 카테고리, 가격, 상태별 필터링
- **검색 바**: `src/components/features/hotdeal/hotdeal-search.tsx` - 실시간 핫딜 검색
- **대신 사줘요 폼**: `src/components/features/order/order-request-form.tsx` - 3단계 주문 요청 폼
- **로그인 폼**: `src/components/forms/login-form.tsx` - 사용자 인증 처리

### Server Actions (데이터 처리)
- **크롤러 액션**: `src/actions/crawler-actions.ts` - 핫딜 크롤링 실행 및 데이터 저장
- **번역 액션**: `src/actions/translation-actions.ts` - 다국어 번역 처리 및 캐싱
- **주문 액션**: `src/actions/order-actions.ts` - 대신 사줘요 요청 처리
- **인증 액션**: `src/actions/auth-actions.ts` - 회원가입, 로그인, 로그아웃
- **관리자 액션**: `src/actions/admin-actions.ts` - 주문 상태 업데이트, 견적 전송

### Repository 패턴 (데이터 계층)
- **HotDeal Repository**: `src/lib/db/local/repositories/hotdeal-repository.ts` - 핫딜 CRUD + 필터링
- **Translation Repository**: `src/lib/db/local/repositories/translation-repository.ts` - 번역 캐시 관리
- **Order Repository**: `src/lib/db/local/repositories/order-repository.ts` - 주문 생성 및 상태 관리
- **User Repository**: `src/lib/db/local/repositories/user-repository.ts` - 사용자 정보 관리

## 2. 비즈니스 플로우 (핵심만)

### P0 Critical Flow:
```
사용자 접속 → Server Component (핫딜 리스트) → Client Component (언어/필터 선택)
→ Server Action (번역 처리) → Repository (캐시 저장) → UI 업데이트
→ 대신 사줘요 클릭 → Client Component (주문 폼) → Server Action (주문 생성)
→ Repository (주문 저장) → 관리자 알림
```

### 주요 비즈니스 규칙:
1. **크롤링 주기**: 10분마다 6개 사이트 크롤링, 종료된 핫딜 자동 감지
2. **번역 캐싱**: 24시간 캐시 유지, 동일 텍스트는 재번역 안함
3. **주문 수수료**: 주문 금액의 8% 자동 계산 및 표시
4. **권한 체크**: Guest는 조회만, Member는 주문 가능, Admin은 전체 관리

## 3. 타입 안전성 전략

### 핵심 인터페이스:
```typescript
// 주요 엔티티 타입
interface HotDeal {
  id: string;
  title: string;
  price: number;
  originalUrl: string;
  category: HotDealCategory;
  status: 'active' | 'ended';
  viewCount: number;
  crawledAt: Date;
}

interface Order {
  id: string;
  userId: string;
  hotDealId?: string;
  productInfo: ProductInfo;
  deliveryAddress: Address;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  fee: number;
  totalAmount: number;
}

// Server Action 반환 타입
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

### 로컬 → Supabase 호환성:
- camelCase (로컬) → snake_case (Supabase) 필드명 변환 유틸리티 필요
- Date 객체 → ISO 문자열 변환 (toISOString() / new Date())
- enum 타입 → string literal 타입으로 마이그레이션 준비

## 4. AI 코드 생성 가이드

### Server Component 생성 시:
"Next.js 15 Server Component로 핫딜 리스트 페이지 구현. 서버에서 HotDealRepository로부터 데이터 페칭하여 Card 컴포넌트로 렌더링. 'use client' 없이 구현하고 TypeScript 타입 안전성 보장. metadata 함수로 SEO 최적화."

### Client Component 생성 시:
"'use client' 지시어로 시작하는 언어 선택기 컴포넌트 구현. Select 드롭다운으로 7개 언어 표시하고 onChange로 setLanguageAction 호출. Jotai atom으로 전역 상태 관리하며 shadcn/ui Select 컴포넌트 사용."

### Server Action 생성 시:
"'use server' 지시어로 시작하는 createOrderAction 구현. FormData 받아서 orderSchema로 Zod 검증 후 OrderRepository.create() 호출. 성공 시 revalidatePath('/orders')로 캐시 무효화. ActionResult<Order> 타입 반환."

### Repository 생성 시:
"BaseRepository 확장하는 HotDealRepository 구현. 로컬 스토리지 기반 CRUD 메서드와 filterByCategory, updateStatus 특화 메서드 제공. getAllActive()는 status='active'인 항목만 반환. Supabase 마이그레이션 고려한 인터페이스 설계."

## 5. Phase별 구현 전략

### Phase 1 (Week 1-4): 로컬 DB 기반
- 크롤링 시스템 + 핫딜 리스트/상세 페이지 구현
- 로컬 Repository 패턴으로 빠른 프로토타이핑
- 필터/검색 Client Components 구현
- 기본 인증 시스템 (JWT + 로컬 스토리지)

### Phase 2 (Week 5-8): UX 최적화
- 7개 언어 번역 시스템 (Google Translate API)
- 대신 사줘요 3단계 폼 (React Hook Form + Zod)
- 관리자 대시보드 (주문 관리, 상태 업데이트)
- 이메일/SMS 알림 시스템

### Phase 3 (Week 9-12): 프로덕션 준비
- 토스페이먼츠 결제 연동 (결제 링크 방식)
- 배송 추적 API 연동
- 성능 최적화 (이미지 lazy loading, ISR)
- Supabase 마이그레이션 도구 개발

## 6. 개발 시 주의사항

### 필수 체크포인트:
- Server Components에 'use client' 사용 금지
- Client Components에서 직접 DB 접근 금지 (반드시 Server Action 경유)
- Server Actions에서 try-catch로 에러 처리 및 ActionResult 반환
- 파일명 kebab-case (hotdeal-card.tsx), 컴포넌트명 PascalCase (HotDealCard)

### 성능 고려사항:
- 핫딜 리스트는 Server Component + 페이지네이션 (무한 스크롤 대신)
- 이미지는 Next/Image 컴포넌트 + blur placeholder
- 번역 결과는 24시간 캐싱으로 API 호출 최소화
- Bundle analyzer로 Client Component 크기 모니터링

---

## 🎯 AI 코드 생성 준비 완료!

위 가이드의 "AI 코드 생성 가이드" 섹션 프롬프트를 사용하여 각 컴포넌트/액션/Repository를 순차적으로 구현하세요.

### 구현 순서 추천:
1. T-001: 프로젝트 설정
2. T-002: Repository 패턴 구현
3. T-003: 크롤링 시스템
4. T-004: 메인 페이지 UI
5. T-005: 상세 페이지
6. T-006: 필터/검색 기능

각 작업별로 AI 프롬프트를 활용하여 빠르게 구현하고, TypeScript 타입 안전성과 Next.js 15 best practices를 준수하세요.