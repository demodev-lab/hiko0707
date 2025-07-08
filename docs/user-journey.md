# HiKo User Journey & Design System

## 🎯 핵심 원칙
1. **One-Click Philosophy**: 모든 주요 액션은 한 번의 클릭으로
2. **Visual First**: 텍스트보다 비주얼 우선 (외국인 친화적)
3. **Consistent Flow**: 어느 페이지에서든 동일한 패턴

## 📱 사용자 여정 (User Journey)

### 1️⃣ 첫 방문 (First Visit)
```
랜딩 → 언어 자동 감지 → 메인 페이지
         ↓
    언어 선택 팝업 (필요시)
```

### 2️⃣ 핫딜 탐색 (Browse Deals)
```
메인 페이지 → 카테고리 선택 → 상품 리스트
    ↓              ↓              ↓
무한 스크롤    시각적 필터    원클릭 번역
```

### 3️⃣ 구매 결정 (Purchase Decision)
```
상품 카드 → 상세 페이지 → 구매 결정
    ↓           ↓            ↓
 번역 버튼   가격 비교   Buy for me
```

### 4️⃣ 대신 사줘요 (Buy for Me)
```
Buy for me 클릭 → 간단 폼 → 확인 → 완료
       ↓             ↓        ↓       ↓
   자동 입력    3단계 이내  즉시 확인  알림
```

## 🎨 통합 디자인 언어

### 색상 체계 (Simplified)
```css
/* Primary Actions */
--action-primary: #0066FF    /* Buy for me, 주요 CTA */
--action-success: #00C48C    /* 무료배송, 성공 */
--action-alert: #FF4757      /* 할인, 긴급 */

/* UI Colors */
--ui-background: #FFFFFF
--ui-surface: #F8F9FA
--ui-border: #E9ECEF
--ui-text: #212529
--ui-muted: #6C757D
```

### 버튼 시스템 (3 Types Only)
1. **Primary Action** - Buy for me, 구매하기
2. **Secondary Action** - 번역, 상세보기
3. **Ghost Action** - 좋아요, 공유

### 카드 레이아웃 (Universal Card)
```jsx
<Card>
  <Image />        // 항상 상단, 큰 이미지
  <Badge />        // 할인율, 상태
  <Title />        // 2줄 제한
  <Price />        // 크고 명확하게
  <Actions />      // 최대 2개 버튼
</Card>
```

## 🔄 일관된 인터랙션 패턴

### 1. 번역 (Translation)
- 위치: 항상 우측 상단 Globe 아이콘
- 동작: 클릭 시 즉시 번역 (로딩 없음)
- 표시: [Translated] 프리픽스

### 2. 가격 표시 (Price Display)
```
$156 USD        ← 큰 글씨, 주요 통화
₩203,000 KRW    ← 작은 글씨, 원화
```

### 3. 상태 표시 (Status Indicators)
- 🟢 Active - 진행중
- 🟡 Ending - 24시간 이내 종료
- 🔴 Hot - 인기 상품
- ⚪ Ended - 종료됨

### 4. 로딩 상태 (Loading States)
- Skeleton UI 사용 (깜빡임 없음)
- 기존 레이아웃 유지
- 점진적 로딩

## 📐 레이아웃 그리드

### Desktop (1280px+)
- 4 columns grid
- 24px gap
- Container: 1280px max

### Tablet (768px - 1279px)
- 2 columns grid
- 16px gap
- Fluid container

### Mobile (< 768px)
- 1 column
- 16px padding
- Full width cards

## 🚀 성능 최적화 UX

### 1. Instant Feedback
- 모든 클릭은 즉각 반응
- Optimistic UI updates
- 로딩 중에도 인터랙션 가능

### 2. Progressive Enhancement
- 핵심 기능 먼저 로드
- 이미지는 lazy loading
- 부가 기능은 백그라운드

### 3. Offline Support
- 최근 본 상품 캐시
- 오프라인 알림
- 자동 재시도

## 🌏 다국어 UX

### 지원 언어 (우선순위)
1. English (기본)
2. 中文 (Chinese)
3. Tiếng Việt (Vietnamese)
4. 日本語 (Japanese)
5. Русский (Russian)
6. ภาษาไทย (Thai)
7. Монгол (Mongolian)

### 언어별 특수 처리
- **중국어**: 큰 글씨, 간체 우선
- **일본어**: 카타카나 강조
- **태국어**: 긴 텍스트 대응
- **러시아어**: 키릴 문자 최적화

## 📱 모바일 우선 인터랙션

### Touch Targets
- 최소 크기: 44x44px
- 간격: 8px 이상
- 스와이프 제스처 지원

### Mobile Navigation
```
[Logo] [Search] [Language] [Menu]
--------------------------------
         Content Area
--------------------------------
[Home] [Deals] [Orders] [Profile]
```

### Mobile Specific Features
- Pull to refresh
- Swipe to like/dismiss
- Bottom sheet for filters
- One-handed operation

## ✅ 접근성 체크리스트

### Visual
- [ ] Color contrast 4.5:1 이상
- [ ] Focus indicators 명확
- [ ] 색맹 대응 (색상+아이콘)

### Interaction
- [ ] Keyboard navigation
- [ ] Screen reader 지원
- [ ] Touch target 44px+

### Content
- [ ] 명확한 레이블
- [ ] 에러 메시지 친절
- [ ] 도움말 제공

## 🎯 핵심 사용자 시나리오

### Scenario 1: 빠른 구매
```
1. 메인 페이지 진입 (자동 언어 설정)
2. 핫딜 카드 확인 (이미지+가격)
3. Buy for me 클릭
4. 3-step 폼 완성
5. 주문 완료
```
**목표 시간: 2분 이내**

### Scenario 2: 탐색 후 구매
```
1. 카테고리 필터링
2. 여러 상품 비교
3. 상세 페이지 확인
4. 번역 기능 사용
5. Buy for me 진행
```
**목표 시간: 5분 이내**

### Scenario 3: 주문 추적
```
1. 프로필 → 주문 내역
2. 주문 상태 확인
3. 배송 추적
4. 문의하기 (필요시)
```
**목표 시간: 30초 이내**

## 🔧 구현 우선순위

### Phase 1 (Must Have)
- 언어 자동 감지 & 선택
- 상품 카드 (이미지 중심)
- Buy for me 버튼
- 간단한 주문 폼

### Phase 2 (Should Have)
- 실시간 번역
- 가격 환율 변환
- 필터 & 정렬
- 주문 추적

### Phase 3 (Nice to Have)
- 개인화 추천
- 소셜 공유
- 리뷰 시스템
- 푸시 알림