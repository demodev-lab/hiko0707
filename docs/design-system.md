# 🎨 HiKo 디자인 시스템 v1.0

## 📌 디자인 원칙

### 1. 정보 우선 (Information First)
- 한국 핫딜 사이트의 효율적인 정보 전달력 계승
- 불필요한 장식 요소 최소화
- 핵심 정보의 빠른 스캔 가능

### 2. 문화적 포용성 (Cultural Inclusivity)
- 7개 언어 사용자를 고려한 중립적 디자인
- 직관적인 아이콘과 명확한 레이블
- 문화적 편견이 없는 이미지와 색상

### 3. 접근성 (Accessibility)
- WCAG 2.1 AA 기준 준수
- 큰 터치 타겟 (최소 44x44px)
- 명확한 색상 대비 (4.5:1 이상)

## 🎨 색상 시스템

### Primary Colors
```css
--primary-blue: #2563EB;      /* 메인 브랜드 색상 */
--primary-dark: #1E40AF;      /* 호버/액티브 상태 */
--primary-light: #60A5FA;     /* 보조 강조 */
```

### Semantic Colors
```css
--success: #10B981;           /* 성공, 할인율 */
--warning: #F59E0B;           /* 경고, 마감임박 */
--error: #EF4444;             /* 에러, 품절 */
--info: #3B82F6;              /* 정보 */
```

### Neutral Colors
```css
--gray-900: #111827;          /* 제목 텍스트 */
--gray-700: #374151;          /* 본문 텍스트 */
--gray-500: #6B7280;          /* 보조 텍스트 */
--gray-300: #D1D5DB;          /* 테두리 */
--gray-100: #F3F4F6;          /* 배경 */
--white: #FFFFFF;             /* 카드 배경 */
```

## 📝 타이포그래피

### Font Family
```css
--font-primary: 'Noto Sans KR', 'Noto Sans', system-ui, sans-serif;
--font-mono: 'Noto Sans Mono', monospace;
```

### Font Scale
```css
--text-xs: 0.75rem;     /* 12px - 라벨, 캡션 */
--text-sm: 0.875rem;    /* 14px - 보조 텍스트 */
--text-base: 1rem;      /* 16px - 본문 */
--text-lg: 1.125rem;    /* 18px - 서브 헤딩 */
--text-xl: 1.25rem;     /* 20px - 헤딩 */
--text-2xl: 1.5rem;     /* 24px - 페이지 타이틀 */
--text-3xl: 1.875rem;   /* 30px - 히어로 텍스트 */
```

### Font Weight
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## 📐 스페이싱 시스템

### Base Unit: 4px
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

## 🎯 컴포넌트 시스템

### 1. 핫딜 카드 (HotDeal Card)
```typescript
interface HotDealCard {
  variant: 'list' | 'grid';
  status: 'active' | 'ending-soon' | 'ended';
  showTranslation: boolean;
}
```

**특징:**
- 리스트/그리드 뷰 전환 가능
- 상태별 시각적 구분 (색상, 투명도)
- 번역된 제목 토글 표시

```css
.hotdeal-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.hotdeal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
```

### 2. 언어 선택기 (Language Selector)
```typescript
interface LanguageSelector {
  position: 'header' | 'mobile-menu';
  displayMode: 'dropdown' | 'inline';
  showFlags: boolean;
}
```

**특징:**
- 현재 언어를 해당 언어로 표시
- 선택 가능한 7개 언어
- 모바일 최적화된 풀스크린 선택 UI

### 3. 버튼 시스템 (Buttons)

#### Primary Button
```css
.btn-primary {
  background: var(--primary-blue);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--primary-blue-dark);
  transform: translateY(-1px);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: var(--primary-blue);
  border: 2px solid var(--primary-blue);
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: 600;
}
```

### 4. 필터 시스템 (Filter System)
```typescript
interface FilterComponent {
  type: 'category' | 'price' | 'status' | 'sort';
  layout: 'horizontal' | 'sidebar';
  collapsible: boolean;
}
```

**특징:**
- 다중 필터 조합 가능
- 적용된 필터 칩으로 표시
- 모바일에서 바텀시트로 전환

### 5. 뱃지 (Badges)

```css
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: var(--text-xs);
  font-weight: 600;
}

.badge-hot {
  background: var(--danger-red);
  color: white;
}

.badge-new {
  background: var(--primary-blue);
  color: white;
}

.badge-ending {
  background: var(--warning-orange);
  color: white;
}
```

## 📱 반응형 브레이크포인트

```css
--mobile: 0px;        /* 0-639px */
--tablet: 640px;      /* 640px-1023px */
--desktop: 1024px;    /* 1024px-1279px */
--wide: 1280px;       /* 1280px+ */
```

## 📐 레이아웃 시스템

### Container
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .container { padding: 0 24px; }
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: 16px;
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.xl\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```

## 🎭 인터랙션 패턴

### 1. 호버 효과
- 카드: 그림자 증가 + 살짝 위로 이동
- 버튼: 색상 어둡게 + 그림자
- 링크: 밑줄 애니메이션

### 2. 트랜지션
```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

## 🎬 애니메이션

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
```

### Skeleton Loading
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

## 🌐 다국어 지원 가이드라인

### 1. 텍스트 공간
- 영어 대비 30% 여유 공간 확보
- 줄바꿈 위치 자연스럽게 처리
- 텍스트 잘림 시 툴팁 제공

### 2. 아이콘 사용
- 텍스트와 함께 사용 (아이콘만 단독 사용 지양)
- 문화 중립적인 아이콘 선택
- 방향성 있는 아이콘 주의 (RTL 대응)

### 3. 날짜/시간 형식
- 지역별 형식 자동 적용
- 상대적 시간 표시 병행 ("3시간 전")

## 📊 성능 가이드라인

### 1. 이미지 최적화
- WebP 형식 우선 사용
- 적응형 이미지 (srcset)
- Lazy loading 기본 적용

### 2. 폰트 로딩
- 크리티컬 폰트 preload
- 폰트 표시 전략: swap
- 서브셋 폰트 사용

### 3. 애니메이션
- GPU 가속 속성 사용 (transform, opacity)
- will-change 신중히 사용
- 60fps 유지

## 🔧 구현 가이드

### Tailwind CSS 커스텀 설정
```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1E40AF',
          light: '#60A5FA',
        },
        // ... 나머지 색상
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'Noto Sans', ...],
      },
      // ... 나머지 설정
    },
  },
}
```

### shadcn/ui 컴포넌트 커스터마이징
- 기본 컴포넌트에 HiKo 스타일 적용
- 다국어 지원 props 추가
- 접근성 속성 강화

---

이 디자인 시스템은 HiKo 프로젝트의 성장에 따라 지속적으로 업데이트됩니다.