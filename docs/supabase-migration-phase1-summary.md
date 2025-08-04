# Phase 1: 사용자 프로필 & 주소 시스템 구현 완료

## 구현 내용

### 1. 서비스 레이어
- **SupabaseProfileService** (`lib/services/supabase-profile-service.ts`)
  - 프로필 CRUD 작업 (생성, 조회, 업데이트)
  - 주소 관리 (추가, 수정, 삭제, 기본 주소 설정)
  - 데이터베이스 필드 매핑 (camelCase ↔ snake_case)

### 2. React Hooks
- **useSupabaseProfile** (`hooks/use-supabase-profile.ts`)
  - React Query를 사용한 상태 관리
  - 프로필 및 주소 데이터 캐싱
  - 뮤테이션 상태 관리
  - 토스트 알림 통합

### 3. UI 컴포넌트
- **ProfileSettings** (`components/features/profile/profile-settings.tsx`)
  - 프로필 정보 관리 UI
  - 언어 설정 (7개 언어 지원)
  - 알림 설정 관리
  - 폼 유효성 검사

### 4. 통합
- **마이페이지 통합** (`app/mypage/page.tsx`)
  - 프로필 탭 추가
  - 3개 탭 구성: 대리구매 주문, 배송지 관리, 프로필 설정
  
- **사용자 동기화** (`actions/auth/sync-user.ts`)
  - Clerk 사용자 생성 시 자동 프로필 생성
  - Supabase 사용 시에만 프로필 생성 (USE_SUPABASE=true)

### 5. 타입 정의
- **UserProfile, UserAddress** (`types/user.ts`)
  - TypeScript 타입 정의
  - 다국어 지원 타입
  - 알림 유형 열거형

## 데이터베이스 스키마

### profiles 테이블
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  display_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  language TEXT (ko|en|zh|vi|mn|th|ja|ru),
  notification_enabled BOOLEAN,
  notification_types TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### user_addresses 테이블
```sql
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  address TEXT NOT NULL,
  address_detail TEXT,
  is_default BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## 보안
- Row Level Security (RLS) 활성화
- 사용자는 자신의 프로필과 주소만 접근 가능
- Service Role은 모든 데이터 접근 가능

## 테스트
- `pnpm test-profile-system`: 프로필 시스템 테스트
- `pnpm check-supabase-tables`: 테이블 존재 확인

## 다음 단계

### 필요한 작업
1. Supabase 대시보드에서 profiles 테이블 생성 (SQL 파일 제공됨)
2. 타입 재생성: `pnpm gen:types`
3. 프로덕션 환경 변수 설정

### Phase 2 준비
Buy-for-me 시스템을 Supabase로 마이그레이션할 준비가 되었습니다.
- buy_for_me_requests 테이블 설계
- 관련 서비스 및 훅 마이그레이션
- 주문 상태 관리 시스템 구현