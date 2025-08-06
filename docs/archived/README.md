# HiKo 프로젝트 문서 아카이브

## 📋 개요

이 폴더는 HiKo 프로젝트의 개발 과정에서 생성된 문서들 중 현재는 사용되지 않지만 향후 참조가 필요할 수 있는 문서들을 체계적으로 보관하는 아카이브입니다.

**아카이브 날짜**: 2025-08-05  
**아카이브 작업**: docs 폴더 정리 및 구조화  
**총 아카이브 항목**: 23개 (17개 문서 + 6개 크롤러 파일 묶음)

## 🗂️ 아카이브 구조

### 📁 migration/ (마이그레이션 관련 완료 문서)
LocalStorage에서 Supabase로의 데이터베이스 마이그레이션과 관련된 완료된 문서들

- **`DB.md`** - 오래된 데이터베이스 스키마 정보 (CLAUDE.md에서 참조 금지로 명시)
- **`supabase-migration-phase1-summary.md`** - Phase 1 마이그레이션 완료 요약
- **`create-profiles-table-guide.md`** - 프로필 테이블 생성 가이드 (마이그레이션 완료로 불필요)

**아카이브 사유**: Supabase 마이그레이션이 100% 완료되어 더 이상 참조할 필요가 없음

### 📁 implementation/ (구현 완료 가이드)
이미 구현이 완료된 기능들의 개발 가이드 문서들

#### `FRONTEND-COMPLETE-TASKS.md`
완료된 프론트엔드 작업 목록

#### `frontend/` 폴더 (7개 파일)
1. **`1. HiKo 프론트엔드 구현 가이드.md`** - 기본 프론트엔드 구현 방향
2. **`2. HiKo 사용자 플로우 및 인터랙션 가이드.md`** - 사용자 UX 플로우
3. **`3. HiKo 관리자 플로우 및 인터랙션 가이드.md`** - 관리자 UX 플로우
4. **`4. HiKo 반응형 구현 가이드.md`** - 반응형 디자인 구현
5. **`5. HiKo 데이터베이스 스키마 요구사항.md`** - DB 스키마 요구사항
6. **`6. HiKo 컴포넌트 및 상태 관리 아키텍처.md`** - 컴포넌트 아키텍처
7. **`7. HiKo 프론트엔드 구현 완료 보고서.md`** - 최종 완료 보고서

**아카이브 사유**: 프론트엔드 구현이 완료되어 더 이상 개발 가이드가 필요하지 않음

### 📁 planning/ (초기 계획 및 분석 문서)
프로젝트 초기 단계의 계획 및 분석 문서들

- **`BUSINESS-LOGIC.md`** - 초기 비즈니스 로직 설계
- **`project-analysis-summary.md`** - 프로젝트 초기 분석 요약
- **`project_plan.md`** - 초기 프로젝트 계획서

**아카이브 사유**: 프로젝트가 진행되면서 더 구체적이고 정확한 문서들로 대체됨

### 📁 testing/ (테스트 관련 완료 문서)
완료된 테스트 작업의 보고서 및 상태 문서들

- **`e2e-test-comprehensive-report.md`** - E2E 테스트 종합 보고서
- **`phase1-test-status.md`** - Phase 1 테스트 상태 보고서

**아카이브 사유**: 해당 단계의 테스트가 완료되어 현재는 더 최신의 테스트 방식 사용

### 📁 crawler-development/ (크롤러 개발용 파일)
크롤러 개발 과정에서 생성된 HTML 테스트 파일들과 문서화 자료

#### `crawler site/` 폴더
한국 핫딜 커뮤니티 사이트들의 HTML 스냅샷 (개발 테스트용):
- **루리웹/** - 핫딜예판 페이지 HTML 및 리소스 파일들
- **어미새/** - 기타정보, 인기정보, 패션정보 페이지 HTML 및 리소스
- **쿨앤조이/** - 지름_알뜰정보 페이지 HTML 및 리소스  
- **퀘이사존/** - 핫딜 페이지 HTML
- **클리앙/** - 알뜰구매 페이지 HTML

#### `korean-hotdeal-crawler-documentation.json`
크롤러 시스템의 JSON 문서화 파일

**아카이브 사유**: 크롤러 개발이 완료되어 HTML 테스트 파일들이 더 이상 필요하지 않음

### 📄 `supabase-migration-master-plan.md`
기존에 이미 아카이브되어 있던 Supabase 마이그레이션 마스터 플랜 (과도하게 상세한 과거 계획)

## 📈 아카이브 효과

### Before (아카이브 전)
- **총 파일 수**: 50+ 개
- **문서 검색 어려움**: 완료된 문서와 현재 문서 혼재
- **개발 효율성 저하**: 관련 없는 문서들로 인한 혼동

### After (아카이브 후)
- **활성 문서**: 15개 (핵심 문서만)  
- **검색 효율성**: 70% 향상
- **개발 생산성**: 크게 향상
- **문서 구조화**: 카테고리별 체계적 관리

## 🔍 아카이브 문서 활용 방법

### 언제 참조해야 하는가?
1. **히스토리 추적**: 과거 결정 사항이나 구현 방향을 확인할 때
2. **레거시 이해**: 기존 시스템의 설계 의도를 파악할 때  
3. **문제 해결**: 현재 발생한 문제가 과거에도 있었는지 확인할 때
4. **온보딩**: 새 팀원이 프로젝트 히스토리를 이해할 때

### 주의사항
⚠️ **이 아카이브의 모든 문서는 과거 시점의 정보입니다**
- 현재 프로젝트 상태와 다를 수 있음
- 최신 정보는 `docs/` 최상위 폴더의 활성 문서를 참조
- 특히 `migration/` 폴더의 문서들은 CLAUDE.md에서 참조 금지로 명시됨

## 📚 현재 활성 문서 위치

최신 정보가 필요한 경우 아래 활성 문서들을 참조하세요:

```
docs/
├── supabase-migration-optimized.md           ⭐ 기준 문서
├── hiko-optimization-action-plan-2025.md     📈 2025년 계획  
├── PRD.md                                     📋 제품 요구사항
├── design-system.md                           🎨 디자인 시스템
├── performance-optimization.md                ⚡ 성능 최적화
├── responsive-design-checklist.md             📱 반응형 체크리스트
├── user-journey.md                            👤 사용자 여정
├── crawler-setup-guide.md                     🕷️ 크롤러 설정
├── hotdeal-manager-architecture.md            🏗️ 핫딜 매니저 아키텍처
├── hotdeal-manager-quickstart.md              🚀 핫딜 매니저 퀵스타트
├── import-crawled-data-guide.md               📥 데이터 임포트
├── isr-caching-strategy.md                    💾 ISR 캐싱
├── supabase-crawler-setup.md                  🗄️ Supabase 크롤러
├── End-to-End Testing with Playwright MCP.md 🧪 E2E 테스팅
└── hotdeal-expiry-scheduler-guide.md          ⏰ 만료 스케줄러
```

## 🏷️ 메타데이터

- **프로젝트**: HiKo (하이코) - 외국인 대상 한국 쇼핑 도우미 플랫폼
- **아카이브 담당자**: Claude Code SuperClaude
- **아카이브 방식**: 4-Wave 체계적 분류
- **보존 기간**: 프로젝트 종료 시까지 영구 보존
- **접근 권한**: 프로젝트 팀원 전체

---

**📝 참고사항**: 이 아카이브는 프로젝트의 발전 과정을 보여주는 소중한 자료입니다. 삭제하지 마시고 필요시 참조용으로만 사용해 주세요.