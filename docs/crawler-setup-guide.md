# 한국 핫딜 크롤러 설정 가이드

## 개요

이 문서는 HiKo 프로젝트의 새로운 크롤링 시스템 설정 및 사용 방법을 설명합니다.

## 시스템 구조

### 핵심 파일
- `/lib/crawlers/base-hotdeal-crawler.ts`: 베이스 크롤러 클래스
- `/lib/crawlers/new-ppomppu-crawler.ts`: 뽐뿌 크롤러 구현
- `/lib/crawlers/new-crawler-manager.ts`: 크롤러 매니저
- `/scripts/crawl-hotdeals.ts`: CLI 도구
- `/app/admin/crawler/page.tsx`: 관리자 웹 인터페이스
- `/actions/crawler-actions.ts`: Server Actions

## 설치 방법

### 1. Playwright 설치
```bash
npx playwright install chromium
```

### 2. 의존성 확인
필요한 의존성들이 이미 설치되어 있습니다:
- playwright
- commander  
- chalk
- ora

## 사용 방법

### CLI 사용

#### 기본 크롤링 (뽐뿌 2페이지)
```bash
pnpm crawl
```

#### 옵션 지정
```bash
# 5페이지 크롤링
pnpm crawl -p 5

# JSON 파일로 저장
pnpm crawl --save-json

# 데이터베이스에 저장
pnpm crawl --save-db

# 브라우저 UI 보면서 크롤링
pnpm crawl --headless false
```

#### JSON 파일 가져오기
```bash
pnpm crawl --import ./exports/hotdeal-ppomppu-2025-07-12.json --save-db
```

### 웹 인터페이스 사용

1. 관리자로 로그인
   - Email: admin@hiko.kr
   - Password: admin123

2. `/admin/crawler` 페이지 접속

3. 크롤링 옵션 설정:
   - 소스 선택 (현재 뽐뿌만 가능)
   - 페이지 수 설정
   - 헤드리스 모드 설정
   - DB 저장 여부
   - JSON 파일 저장 여부

4. "크롤링 시작" 버튼 클릭

## 데이터 구조

### HotDeal 객체
```typescript
{
  id: string                    // 고유 ID
  title: string                 // 제목
  content: string              // 본문 내용
  price: string | null         // 가격
  originalPrice: string | null // 원가
  discount: string | null      // 할인율
  storeName: string | null     // 쇼핑몰명
  category: string             // 카테고리
  thumbnailImageUrl: string | null    // 썸네일 이미지
  originalImageUrl: string | null     // 원본 이미지
  imageUrl: string | null            // 표시용 이미지
  author: string               // 작성자
  postDate: string            // 게시일 (ISO 8601)
  views: number               // 조회수
  recommendCount: number      // 추천수
  commentCount: number        // 댓글수
  url: string                 // 게시글 URL
  isEnded: boolean           // 종료 여부
  isFreeShipping: boolean    // 무료배송 여부
  isPopular: boolean         // 인기글 여부
  source: string             // 출처 (ppomppu)
  sourcePostId: string       // 원본 게시글 ID
  crawledPage: number        // 크롤링 페이지
  createdAt: string          // 생성일시
  updatedAt: string          // 수정일시
}
```

## 새로운 크롤러 추가 방법

### 1. 크롤러 클래스 생성
```typescript
// /lib/crawlers/new-ruliweb-crawler.ts
import { BaseHotdealCrawler } from './base-hotdeal-crawler'

export class RuliwebCrawler extends BaseHotdealCrawler {
  // 구현...
}
```

### 2. 크롤러 매니저에 등록
```typescript
// /lib/crawlers/new-crawler-manager.ts
private initializeCrawlers(): void {
  this.crawlers.set('ppomppu', new PpomppuCrawler(this.options))
  this.crawlers.set('ruliweb', new RuliwebCrawler(this.options)) // 추가
}
```

### 3. 관리자 페이지 업데이트
```tsx
// /app/admin/crawler/page.tsx
<SelectItem value="ruliweb">루리웹</SelectItem>
```

## 주요 기능

### 1. 중복 처리
- source + sourcePostId 조합으로 중복 확인
- 기존 데이터는 업데이트, 신규 데이터는 생성

### 2. 카테고리 자동 분류
- 제목의 키워드 기반 자동 분류
- 카테고리: 의류/잡화, 식품/건강, 가전/디지털, 생활/가구, 도서/문구, 화장품/미용, 기타

### 3. 가격 및 쇼핑몰 추출
- 제목에서 자동 추출
- 무료배송 여부 확인

### 4. 통계 생성
- 총 딜 수, 활성/종료 딜
- 카테고리별/쇼핑몰별 통계
- 무료배송, 인기글, 이미지 포함 통계

## 문제 해결

### Playwright 설치 오류
```bash
# 수동 설치
npx playwright install-deps
npx playwright install chromium
```

### 크롤링 타임아웃
- 페이지 수를 줄이거나 딜레이 증가
- 헤드리스 모드 사용

### 메모리 부족
- 한 번에 크롤링할 페이지 수 제한
- JSON 파일 분할 저장 옵션 사용

## 성능 최적화

### 1. 상세 페이지 제한
- 페이지당 첫 10개 게시글만 상세 정보 수집
- 나머지는 목록 정보만 저장

### 2. 이미지 필터링
- 100x100 픽셀 이상만 수집
- 아이콘, 이모티콘 제외

### 3. 딜레이 설정
- 페이지 간 2초 기본 딜레이
- 서버 부하 방지

## 보안 고려사항

### 1. 인증 확인
- Server Actions에서 admin 권한 확인
- 비인증 사용자 접근 차단

### 2. robots.txt 준수
- 각 사이트의 크롤링 정책 확인
- 적절한 딜레이 설정

### 3. User-Agent 설정
- 일반 브라우저로 식별
- 봇 차단 회피

## 향후 개발 계획

### 1. 추가 크롤러
- 루리웹, 클리앙, 퀘이사존 등
- 각 사이트별 특성 반영

### 2. 스케줄러 구현
- 정기적 자동 크롤링
- 크론 작업 설정

### 3. 알림 시스템
- 새로운 핫딜 알림
- 키워드 알림

### 4. API 엔드포인트
- 외부 서비스 연동
- 모바일 앱 지원