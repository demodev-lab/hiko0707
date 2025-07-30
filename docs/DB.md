# DB 구현 가이드 - 의존성 기반 점진적 구현 순서

## 사용 가이드

- `supabase mcp` -> 데이터가 잘 들어갔는지 확인할 때
- `database.types.ts` -> 데이터베이스 구조를 AI에게 알려줄 때

## 현재 상황

1. Supabase DB가 구성되어 있음
2. Supabase와 웹사이트가 연결되어 있음
3. 실제 데이터 저장/조회 코드는 아직 없음 → 이제 구현 필요
4. 데이터베이스 구조는 `database.types.ts`에 정의됨

## 구현 순서 개요

### 1단계: 독립 테이블 (의존성 없음)

다음 테이블들은 다른 테이블에 의존하지 않으므로 가장 먼저 구현할 수 있습니다:

1. **users** - 모든 테이블의 기본이 되는 사용자 테이블
2. **crawling_logs** - 독립적인 크롤링 로그
3. **hot_deals** - 핫딜 정보 (독립적)
4. **system_settings** - 시스템 설정 (users에 약한 의존성)

### 2단계: 1차 의존 테이블

users 테이블 구현 후 가능:

1. **user_profiles** (users 1:1)
2. **user_addresses** (users 1:1)
3. **notifications** (users 참조)
4. **admin_activity_logs** (users 참조)

### 3단계: hot_deals 의존 테이블

hot_deals 테이블 구현 후 가능:

1. **hotdeal_translations** (hot_deals 참조)
2. **hot_deal_likes** (hot_deals + users 참조)
3. **user_favorite_hotdeals** (hot_deals + users 참조)
4. **hot_deal_comments** (hot_deals + users 참조, 자기참조)

### 4단계: 2차 의존 테이블

hot_deal_comments 구현 후:

1. **comment_likes** (hot_deal_comments + users 참조)

### 5단계: 주문 관련 테이블

users, hot_deals, user_addresses 구현 후:

1. **proxy_purchases_request** (users + hot_deals + user_addresses 참조)
2. **proxy_purchase_addresses** (proxy_purchases_request 참조)
3. **proxy_purchase_quotes** (proxy_purchases_request 참조)
4. **payments** (proxy_purchases_request + users 참조)
5. **order_status_history** (proxy_purchases_request + users 참조)

## 상세 구현 가이드

### 1단계 상세

#### users 테이블

```typescript
// 가장 먼저 구현 - 모든 테이블의 기반
interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  name: string;
  phone?: string;
  preferred_language: string; // 기본값: 'ko'
  role: string; // 'guest' | 'member' | 'admin'
  status: string; // 'active' | 'inactive' | 'suspended'
  last_logined_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
```

#### crawling_logs 테이블

```typescript
// 독립적 - 크롤링 시스템용
interface CrawlingLog {
  id: string;
  source: string; // 'ppomppu' | 'ruliweb' | 'clien' 등
  status: string; // 'started' | 'completed' | 'failed'
  started_at: string;
  completed_at?: string;
  items_found: number;
  items_added: number;
  items_updated: number;
  duplicates: number;
  duration_ms?: number;
  error_message?: string;
  error_details?: Json;
}
```

#### hot_deals 테이블

```typescript
// 독립적 - 핫딜 정보
interface HotDeal {
  id: string;
  source: string;
  source_id: string;
  title: string;
  description?: string;
  original_url: string;
  original_price: number;
  sale_price: number;
  discount_rate: number;
  category: string;
  seller?: string;
  author_name: string;
  shopping_comment: string;
  image_url: string;
  thumbnail_url: string;
  is_free_shipping: boolean;
  status: string; // 'active' | 'expired' | 'sold_out'
  end_date: string;
  views: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
```

### 2단계 상세

#### user_profiles 테이블

```typescript
// users 테이블 필요
interface UserProfile {
  id: string;
  user_id: string; // FK: users.id
  avatar_url: string;
  date_of_birth: string;
  gender: string;
  created_at: string;
  updated_at: string;
}
```

#### user_addresses 테이블

```typescript
// users 테이블 필요
interface UserAddress {
  id: string;
  user_id: string; // FK: users.id
  name: string;
  phone: string;
  post_code: string;
  address: string;
  address_detail?: string;
  label?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
```

### 3단계 상세

#### hot_deal_comments 테이블

```typescript
// users, hot_deals 테이블 필요
// 자기참조 있음 (대댓글)
interface HotDealComment {
  id: string;
  hotdeal_id: string; // FK: hot_deals.id
  user_id: string; // FK: users.id
  parent_id?: string; // FK: hot_deal_comments.id (자기참조)
  content: string;
  like_count: number;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}
```

### 5단계 상세

#### proxy_purchases_request 테이블

```typescript
// users, hot_deals, user_addresses 테이블 필요
interface ProxyPurchaseRequest {
  id: string;
  user_id: string; // FK: users.id
  hot_deal_id: string; // FK: hot_deals.id
  shipping_address_id?: string; // FK: user_addresses.id
  order_number: string;
  product_info: Json;
  quantity: number;
  option?: string;
  special_requests?: string;
  status: string; // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  created_at: string;
  updated_at: string;
}
```

## 구현 코드 예시

### 1. Supabase 클라이언트 설정

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

### 2. Users 서비스 구현 예시

```typescript
// actions/users/create-user.ts
'use server';

import { supabase } from '@/lib/supabase/server';

export async function createUser(data: {
  clerk_user_id: string;
  email: string;
  name: string;
  role: string;
}) {
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      ...data,
      status: 'active',
      preferred_language: 'ko',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return user;
}
```

### 3. Hot Deals 조회 예시

```typescript
// actions/hot-deals/get-hot-deals.ts
'use server';

import { supabase } from '@/lib/supabase/server';

export async function getActiveHotDeals(limit = 20) {
  const { data, error } = await supabase
    .from('hot_deals')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
```

## 구현 팁

### 1. 트랜잭션 고려사항

- 관련 테이블 간 데이터 정합성 유지
- 예: user 생성 시 user_profile도 함께 생성

### 2. RLS (Row Level Security) 정책

```sql
-- users 테이블 RLS 예시
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 자신의 정보만 조회 가능
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = clerk_user_id);

-- 관리자는 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE clerk_user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### 3. 인덱스 설계

```sql
-- 자주 조회되는 컬럼에 인덱스 추가
CREATE INDEX idx_hot_deals_source ON hot_deals(source);
CREATE INDEX idx_hot_deals_status ON hot_deals(status);
CREATE INDEX idx_hot_deals_created_at ON hot_deals(created_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
```

### 4. 마이그레이션 순서

```bash
# 1단계
20250730_001_create_users.sql
20250730_002_create_crawling_logs.sql
20250730_003_create_hot_deals.sql
20250730_004_create_system_settings.sql

# 2단계
20250730_005_create_user_profiles.sql
20250730_006_create_user_addresses.sql
20250730_007_create_notifications.sql
20250730_008_create_admin_activity_logs.sql

# 3단계
20250730_009_create_hotdeal_translations.sql
20250730_010_create_hot_deal_likes.sql
20250730_011_create_user_favorite_hotdeals.sql
20250730_012_create_hot_deal_comments.sql

# 4단계
20250730_013_create_comment_likes.sql

# 5단계
20250730_014_create_proxy_purchases_request.sql
20250730_015_create_proxy_purchase_addresses.sql
20250730_016_create_proxy_purchase_quotes.sql
20250730_017_create_payments.sql
20250730_018_create_order_status_history.sql
```

### 5. 테스트 데이터 순서

1. users 생성
2. hot_deals 생성
3. user_profiles, user_addresses 생성
4. hot_deal_comments 생성
5. 나머지 관계 데이터 생성

## 주의사항

1. **외래키 제약**: Supabase에서는 RLS 정책과 함께 외래키 제약이 작동하므로 순서가 중요
2. **Clerk 연동**: users 테이블의 clerk_user_id는 Clerk 인증 시스템과 연동
3. **소프트 삭제**: deleted_at 컬럼이 있는 테이블은 하드 삭제 대신 소프트 삭제 사용
4. **타임스탬프**: 모든 created_at, updated_at은 UTC 기준
5. **JSON 타입**: product_info, error_details 등은 구조화된 JSON 저장

## 성능 최적화

1. **배치 삽입**: 크롤링 데이터는 배치로 삽입
2. **캐싱**: hotdeal_translations는 캐싱 활용
3. **파티셔닝**: hot_deals 테이블은 날짜별 파티셔닝 고려
4. **비동기 처리**: 알림, 번역 등은 비동기로 처리

## 데이터 확인 방법

Supabase MCP를 사용하여 데이터가 잘 들어갔는지 확인:

```bash
# 예시: users 테이블 조회
mcp__supabase__execute_sql --query "SELECT * FROM users LIMIT 10"

# 예시: hot_deals 개수 확인
mcp__supabase__execute_sql --query "SELECT COUNT(*) FROM hot_deals WHERE status = 'active'"
```
