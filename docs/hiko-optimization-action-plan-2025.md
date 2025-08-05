# HiKo 프로젝트 최적화 실행 계획 (2025년 8월)

## 📊 현재 상태 분석 요약

### 프로젝트 상태
- **공식 문서 상태**: 100% 완료 (supabase-migration-optimized.md)
- **실제 진행률**: 85% 완료
- **주요 차이점**: 이중 데이터 레이어 존재, LocalStorage 의존성 잔존

### 발견된 주요 이슈
1. **이중 데이터 레이어**: Supabase ↔ LocalStorage 변환 어댑터 사용 중
2. **LocalStorage 의존성**: 54개 파일에서 여전히 사용
3. **UUID 형식 오류**: 하드코딩된 'temp-user-id' 사용
4. **미구현 기능**: 크롤러 5개, 실제 API 연동 미완료

### 현재 작동 상태
- ✅ 개발 서버: 정상 작동 (1.2초 부팅)
- ✅ 프로덕션 빌드: 성공 (52개 페이지)
- ✅ TypeScript: 오류 없음
- ⚠️ ESLint: 8개 경고 존재

## 🎯 작업 필요성 분석

### 필수 작업 (Must Have)
1. **UUID 오류 수정** - 데이터 무결성 위협
2. **이중 데이터 레이어 통합** - 성능 및 복잡도 문제
3. **LocalStorage 의존성 제거** - 보안 및 데이터 영속성
4. **크롤러 확장** - 비즈니스 핵심 기능 (현재 16.7%만 구현)

### 중요 작업 (Should Have)
5. **번역 API 연동** - 현재 시뮬레이션으로 작동
6. **ESLint 경고 해결** - 코드 품질
7. **불필요한 파일 정리** - 유지보수성

### 보류 가능 (Nice to Have)
8. **결제 시스템 PG사 연동** - 장기 과제
9. **자동 구매 프로세스** - 높은 복잡도

## 📋 Phase별 실행 계획

### Phase 1: 긴급 수정 (1-2일) ⚡

#### 1.1 UUID 오류 수정
- [ ] 'temp-user-id' 하드코딩 검색 및 제거
- [ ] UUID 생성 유틸리티 함수 구현
- [ ] 영향받는 컴포넌트 수정
- [ ] 테스트 및 검증

#### 1.2 ESLint 경고 해결
- [ ] app/search/page.tsx - useEffect 의존성 수정
- [ ] app/test-image/page.tsx - Image 컴포넌트 사용
- [ ] components/features/admin/hotdeal-trend-charts.tsx - 불필요한 의존성 제거
- [ ] components/features/order/buy-for-me-modal.tsx - 의존성 추가
- [ ] components/features/rewards/points-history.tsx - 의존성 추가

#### 1.3 불필요한 파일 정리
- [ ] 테스트 스크립트 정리 (25개)
  - test-*.js/ts 파일들
  - scripts/test-*.ts 파일들
- [ ] 백업 파일 제거
  - actions/auth-actions.ts.backup
- [ ] 사용하지 않는 mock 데이터 정리

### Phase 2: 데이터 레이어 통합 (3-5일) 🔄

#### 2.1 변환 어댑터 제거 (우선순위 1)
- [ ] transformSupabaseToLocal 사용처 파악 (11개 파일)
- [ ] 각 파일에서 직접 Supabase 타입 사용으로 변경
  - [ ] app/hotdeals/page.tsx
  - [ ] app/hotdeals/[id]/page.tsx
  - [ ] app/page.tsx
  - [ ] components/features/home/hotdeals-section.tsx
  - [ ] components/features/hotdeal/hotdeal-list-client.tsx
  - [ ] 기타 6개 파일
- [ ] hotdeal-transformers.ts 파일 제거

#### 2.2 LocalStorage 의존성 제거 - Step 1 (검색/필터)
- [ ] hooks/use-search-suggestions.ts - Supabase로 전환
- [ ] hooks/use-filter-presets.ts - Supabase로 전환
- [ ] 관련 컴포넌트 수정

#### 2.3 LocalStorage 의존성 제거 - Step 2 (온보딩/설정)
- [ ] hooks/use-onboarding.ts - Supabase 프로필로 통합
- [ ] hooks/use-local-storage.ts - 사용처 파악 및 대체
- [ ] 관련 컴포넌트 수정

#### 2.4 LocalStorage 의존성 제거 - Step 3 (기타)
- [ ] 나머지 36개 파일 순차적 처리
- [ ] contexts/theme-context.tsx - CSS 변수 방식으로 전환
- [ ] lib/i18n/context.tsx - 언어 설정 처리 개선

#### 2.5 database-service.ts 완전 제거
- [ ] 모든 import 제거
- [ ] 파일 삭제

### Phase 3: 시스템 안정화 (2-3일) 🛡️

#### 3.1 인증 시스템 통합
- [ ] states/auth-store.ts - Clerk 전용으로 전환
- [ ] LocalStorage 인증 상태 제거
- [ ] Clerk 세션 관리 최적화

#### 3.2 테마 시스템 개선
- [ ] CSS 변수 기반 테마 시스템 구현
- [ ] LocalStorage 의존성 완전 제거
- [ ] 서버 컴포넌트 호환성 확보

#### 3.3 USE_SUPABASE 플래그 제거
- [ ] 6개 파일에서 플래그 제거
- [ ] 조건부 로직 정리
- [ ] 환경 변수 정리

### Phase 4: 신규 기능 구현 (2-3주) 🚀

#### 4.1 크롤러 확장 (우선순위 1)
- [ ] 루리웹 크롤러 구현
  - [ ] RuliwebCrawler 클래스 생성
  - [ ] 셀렉터 설정 및 테스트
  - [ ] 데이터 변환 로직 구현
- [ ] 클리앙 크롤러 구현
  - [ ] ClienCrawler 클래스 생성
  - [ ] 셀렉터 설정 및 테스트
  - [ ] 데이터 변환 로직 구현
- [ ] 퀘이사존 크롤러 구현
- [ ] 쿨엔조이 크롤러 구현
- [ ] 어미새 크롤러 구현
- [ ] 스케줄러 통합 테스트

#### 4.2 번역 API 연동 (우선순위 2)
- [ ] Google 번역 API 계정 설정
- [ ] API 키 환경 변수 추가
- [ ] lib/i18n/google-translate.ts 실제 구현
- [ ] 번역 캐싱 시스템 구현
- [ ] 번역 품질 관리 UI 구현

#### 4.3 기타 개선사항
- [ ] 영문 주소 API 연동
- [ ] 성능 최적화
  - [ ] 이미지 최적화
  - [ ] 번들 크기 최적화
  - [ ] React 컴포넌트 최적화

## 📈 진행 상황 추적

### Phase 1 (긴급 수정)
- 시작일: 
- 완료일: 
- 진행률: 0%
- 담당자: 

### Phase 2 (데이터 레이어 통합)
- 시작일: 
- 완료일: 
- 진행률: 0%
- 담당자: 

### Phase 3 (시스템 안정화)
- 시작일: 
- 완료일: 
- 진행률: 0%
- 담당자: 

### Phase 4 (신규 기능)
- 시작일: 
- 완료일: 
- 진행률: 0%
- 담당자: 

## 🚦 실행 원칙

1. **점진적 변경**: 각 단계별 검증 후 다음 진행
2. **데이터 무결성**: 변경 전 백업, 변경 후 검증
3. **병렬 작업**: 독립적인 작업은 동시 진행 가능
4. **문서화**: 각 Phase 완료시 이 문서 업데이트

## ⏰ 예상 일정

| Phase | 예상 기간 | 우선순위 | 상태 |
|-------|----------|---------|------|
| Phase 1 | 1-2일 | 긴급 | 대기 |
| Phase 2 | 3-5일 | 높음 | 대기 |
| Phase 3 | 2-3일 | 높음 | 대기 |
| Phase 4 | 2-3주 | 중간 | 대기 |

**전체 예상 소요 시간**: 3-4주

## 📝 참고사항

### 관련 문서
- [Supabase 마이그레이션 현황](./supabase-migration-optimized.md)
- [프로젝트 분석 요약](./project-analysis-summary.md)

### 주의사항
1. 각 Phase는 순차적으로 진행
2. Phase 2는 특히 신중하게 진행 (데이터 레이어 변경)
3. 각 작업 완료 후 반드시 테스트
4. 문제 발생시 즉시 롤백

### 성공 기준
- [ ] 모든 TypeScript 오류 없음
- [ ] ESLint 경고 0개
- [ ] 프로덕션 빌드 성공
- [ ] 개발 서버 정상 작동
- [ ] 데이터 무결성 유지
- [ ] 성능 저하 없음

---

**마지막 업데이트**: 2025-08-05
**문서 버전**: 1.0.0
**작성자**: Claude Code Assistant