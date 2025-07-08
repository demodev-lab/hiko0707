# 📊 HiKo 프로젝트 분석 요약

## 🎯 프로젝트 개요
- **프로젝트명**: HiKo (하이코) - 내부 코드명 Shrimp
- **목적**: 한국 거주 외국인을 위한 핫딜 정보 집계 및 구매 대행 플랫폼
- **대상**: 한국 거주 외국인 250만명 중 초기 목표 1만명
- **개발 기간**: 3개월 (12주)
- **기술 스택**: Next.js 15, TypeScript (strict), Tailwind CSS, shadcn/ui, Jotai, TanStack Query

## 📌 핵심 기능 분석

### 1. 실시간 핫딜 크롤링 (P0)
- **대상 사이트**: 뽐뿌, 루리웹, zod, 퀘이사존, 어미새, 클리앙 (6개)
- **크롤링 주기**: 10분
- **핵심 기능**:
  - 종료된 핫딜 자동 감지
  - 카테고리별 자동 분류
  - 중복 제거 로직

### 2. 다국어 번역 시스템 (P1)
- **지원 언어**: 영어, 중국어, 베트남어, 몽골어, 태국어, 일본어, 러시아어 (7개)
- **번역 캐싱**: 24시간
- **구현 방식**: Server Action + Translation Repository

### 3. 대신 사줘요 서비스 (P2)
- **수수료**: 주문 금액의 8%
- **프로세스**: 요청 → 관리자 확인 → 견적 → 결제 → 배송
- **결제 방식**: 토스페이먼츠 (카드/무통장입금)

## 🏗️ 아키텍처 분석

### Server Components (SEO 중심)
- 핫딜 리스트 페이지 (`app/page.tsx`)
- 핫딜 상세 페이지 (`app/hotdeals/[id]/page.tsx`)
- 관리자 대시보드 (`app/admin/orders/page.tsx`)

### Client Components (인터랙션)
- 언어 선택기
- 필터/검색
- 주문 폼
- 로그인 폼

### 데이터 레이어
- **현재**: LocalStorage + Repository 패턴
- **향후**: Supabase 마이그레이션
- **핵심 엔티티**: HotDeal, Translation, Order, User

## 📅 개발 우선순위

### Phase 1 (Week 1-4): 기반 구축
1. ✅ 프로젝트 초기 설정 및 문서 분석 (현재 태스크)
2. 경쟁사 및 디자인 트렌드 분석
3. Mock 데이터 크롤링 시스템 구축
4. HotDeal 엔티티 및 Repository 구현
5. 핫딜 리스트/상세 페이지 개발

### Phase 2 (Week 5-8): 핵심 기능
1. 다국어 지원 시스템 (i18next)
2. Buy for Me 주문 폼
3. 관리자 대시보드

### Phase 3 (Week 9-12): 완성 및 배포
1. 결제 시스템 통합
2. 성능 최적화 및 SEO
3. 최종 테스트 및 배포

## 🔍 현재 프로젝트 상태
- **기존 구조**: Next.js 보일러플레이트 (Posts, Comments CRUD)
- **필요 작업**: HiKo 전용 기능으로 전환
- **첫 단계**: 기존 코드를 분석하여 재사용 가능한 부분 식별

## 💡 다음 단계 권장사항
1. **즉시 실행**: 경쟁사 및 디자인 트렌드 분석
2. **병행 작업**: Mock 데이터 준비 (실제 크롤링 데이터)
3. **기술 검증**: 크롤링 도구 선택 (Playwright vs Puppeteer)
4. **설계 우선**: HotDeal 엔티티 및 Repository 인터페이스 정의

## ⚠️ 주의사항
- Server Components에 'use client' 사용 금지
- Client Components에서 Repository 직접 접근 금지
- 모든 텍스트는 번역 시스템 사용 (한국어 하드코딩 금지)
- TypeScript strict mode 필수