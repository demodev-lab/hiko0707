# Profiles 테이블 생성 가이드

## 📌 현재 상황
- `profiles` 테이블이 생성되지 않아 프로필 시스템이 작동하지 않습니다.
- `user_addresses` 테이블은 이미 존재합니다.

## 🚀 해결 방법

### 1. Supabase 대시보드 접속
[Supabase SQL Editor](https://supabase.com/dashboard/project/vyvzihzjivcfhietrpnd/editor)로 이동하세요.

### 2. SQL 실행
아래 SQL을 복사하여 SQL Editor에 붙여넣고 실행하세요:

```sql
-- 프로필 테이블 생성 (user_addresses는 이미 존재함)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'en', 'zh', 'vi', 'mn', 'th', 'ja', 'ru')),
  notification_enabled BOOLEAN DEFAULT true,
  notification_types TEXT[] DEFAULT ARRAY['order_status', 'hot_deal'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE
  ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 프로필 정책: 사용자는 자신의 프로필만 볼 수 있음
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 서비스 역할은 모든 것에 접근 가능 (RLS 우회)
CREATE POLICY "Service role has full access to profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');
```

### 3. 실행 확인
SQL 실행 후 "Success. No rows returned" 메시지가 나타나면 성공입니다.

### 4. 타입 재생성
터미널에서 다음 명령을 실행하여 TypeScript 타입을 재생성하세요:
```bash
pnpm gen:types
```

### 5. 테스트 실행
프로필 시스템이 정상 작동하는지 테스트하세요:
```bash
pnpm test-profile-system
```

## ⚠️ 주의사항
- SQL은 한 번만 실행하면 됩니다. 
- 이미 테이블이 존재하는 경우 `IF NOT EXISTS` 때문에 오류가 발생하지 않습니다.

## 🔍 확인 방법
```bash
npx tsx scripts/check-supabase-tables.ts
```
위 명령으로 테이블이 생성되었는지 확인할 수 있습니다.