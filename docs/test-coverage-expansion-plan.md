# 테스트 커버리지 확대 계획 (5% → 60%)

## 📋 현재 상태 분석

### 현재 문제점
1. **E2E 테스트 충돌**: Playwright 테스트가 Vitest에서 실행되어 충돌 발생
2. **낮은 테스트 커버리지**: 현재 약 5% 수준
3. **테스트 파일 부족**: 26개 테스트 파일 중 4개만 통과
4. **타임아웃 이슈**: 테스트 실행 시 타임아웃 발생

### 현재 테스트 구조
- **단위 테스트**: Vitest 사용 (tests/ 디렉터리)
- **E2E 테스트**: Playwright 사용 (e2e/ 디렉터리)
- **통과 테스트**: 컴포넌트 테스트 일부 (74/174 테스트 통과)

## 🎯 목표

**목표 커버리지**: 60% (2025년 8월 말까지)
- 단위 테스트: 70% 커버리지
- 통합 테스트: 50% 커버리지
- E2E 테스트: 주요 사용자 플로우 100% 커버

## 📊 우선순위 기반 테스트 확대 계획

### Phase 1: 테스트 인프라 정비 (1주차)
1. **테스트 환경 분리**
   - Vitest 설정 개선 (E2E 테스트 제외)
   - Playwright 설정 파일 생성
   - 테스트 스크립트 분리 (unit, integration, e2e)

2. **Mock 시스템 구축**
   - Supabase 클라이언트 mock
   - Clerk 인증 mock
   - API 응답 mock

### Phase 2: 핵심 비즈니스 로직 테스트 (2-3주차)

#### 2.1 Supabase 서비스 테스트 (우선순위: 최상)
테스트 대상 파일:
- `lib/services/supabase-hotdeal-service.ts`
- `lib/services/supabase-user-service.ts`
- `lib/services/supabase-order-service.ts`
- `lib/services/supabase-payment-service.ts`
- `lib/services/supabase-settings-service.ts`

테스트 항목:
- CRUD 작업 정확성
- 에러 처리
- 데이터 검증
- 타입 안정성

#### 2.2 크롤러 테스트 (우선순위: 상)
테스트 대상:
- `lib/crawlers/base-hotdeal-crawler.ts`
- 각 커뮤니티별 크롤러 (6개)

테스트 항목:
- 데이터 파싱 정확성
- 시간 필터링
- 중복 처리
- 에러 복구

#### 2.3 훅 테스트 (우선순위: 상)
테스트 대상:
- `hooks/use-supabase-*.ts` (모든 Supabase 훅)
- `hooks/use-translation.ts`
- `hooks/use-currency.ts`

테스트 항목:
- 상태 관리
- 캐싱 동작
- 에러 상태
- 로딩 상태

### Phase 3: UI 컴포넌트 테스트 (4주차)

#### 3.1 기능별 컴포넌트 테스트
- `components/features/hotdeals/*`
- `components/features/order/*`
- `components/features/auth/*`
- `components/features/payment/*`

#### 3.2 공통 컴포넌트 테스트
- `components/common/*`
- `components/ui/*` (shadcn 컴포넌트)

### Phase 4: 통합 테스트 (5주차)

#### 4.1 페이지 레벨 테스트
- 홈페이지 렌더링
- 핫딜 리스트 페이지
- 주문 플로우
- 결제 플로우

#### 4.2 API 통합 테스트
- Server Actions 테스트
- 데이터 플로우 검증
- 에러 시나리오

### Phase 5: E2E 테스트 정비 (6주차)

#### 5.1 Playwright 설정 개선
- playwright.config.ts 생성
- 테스트 환경 설정
- CI/CD 통합

#### 5.2 주요 시나리오 커버
- 사용자 회원가입/로그인
- 핫딜 검색 및 필터링
- Buy-for-me 주문 생성
- 결제 처리
- 관리자 기능

## 📈 예상 커버리지 진행률

| 주차 | 목표 커버리지 | 주요 작업 |
|------|--------------|----------|
| 1주 | 10% | 테스트 인프라 정비 |
| 2주 | 25% | Supabase 서비스 테스트 |
| 3주 | 35% | 크롤러 & 훅 테스트 |
| 4주 | 45% | UI 컴포넌트 테스트 |
| 5주 | 55% | 통합 테스트 |
| 6주 | 60%+ | E2E 테스트 정비 |

## 🛠️ 구현 전략

### 1. 테스트 작성 가이드라인
```typescript
// 테스트 파일 구조
describe('ServiceName', () => {
  beforeEach(() => {
    // Setup mocks
  })

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      // Act
      // Assert
    })

    it('should handle error case', async () => {
      // Test error scenarios
    })
  })
})
```

### 2. Mock 전략
```typescript
// Supabase mock 예시
vi.mock('@/lib/supabase/client', () => ({
  supabase: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }))
  })
}))
```

### 3. 커버리지 목표
- Statement Coverage: 60%
- Branch Coverage: 50%
- Function Coverage: 70%
- Line Coverage: 60%

## 🔄 실행 계획

### 즉시 실행 (Today)
1. vitest.config.ts 수정 완료 ✅
2. 테스트 스크립트 분리
3. 첫 번째 서비스 테스트 작성 시작

### 이번 주 목표
1. Supabase 서비스 테스트 5개 작성
2. Mock 시스템 구축
3. CI 파이프라인 설정

### 측정 지표
- 일일 테스트 추가 수
- 주간 커버리지 증가율
- 실패 테스트 수정 속도
- CI 빌드 성공률

## 📌 주의사항

1. **테스트 품질 > 수량**: 의미 있는 테스트 작성에 집중
2. **점진적 개선**: 한 번에 모든 것을 하려 하지 않기
3. **CI 통합**: 테스트가 CI에서도 안정적으로 실행되도록 보장
4. **문서화**: 테스트 작성 가이드 지속적 업데이트

## 🎯 성공 지표

- [ ] 테스트 커버리지 60% 달성
- [ ] CI/CD 파이프라인에서 모든 테스트 통과
- [ ] 핵심 비즈니스 로직 100% 테스트 커버
- [ ] E2E 테스트로 주요 사용자 플로우 검증
- [ ] 테스트 실행 시간 5분 이내 유지

---

**작성일**: 2025-08-05
**목표 완료일**: 2025-08-31