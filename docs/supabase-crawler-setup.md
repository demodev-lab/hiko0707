# Supabase 크롤러 설정 가이드

## 1. 환경변수 설정

`.env.local` 파일에 다음 환경변수를 설정하세요:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vyvzihzjivcfhietrpnd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 크롤러가 Supabase를 사용하도록 설정 (크롤링만 Supabase 적용)
USE_SUPABASE=true
```

## 2. Supabase 마이그레이션 실행

Supabase Dashboard의 SQL Editor에서 다음 파일의 내용을 실행하세요:

1. `/supabase/migrations/000_crawler_tables.sql` - 모든 필요한 테이블과 함수를 한 번에 생성

## 3. 크롤러 실행 확인

### 백엔드 크롤러 시작
```bash
pnpm dev
```

### 크롤러 관리 페이지 접속
http://localhost:3000/admin/hotdeal-manager

### 크롤러 동작 확인
1. 크롤러 관리 페이지에서 원하는 커뮤니티 크롤링 시작
2. Supabase Dashboard에서 hotdeals 테이블 확인
3. 크롤링된 데이터가 Supabase에 저장되는지 확인

## 4. 마이그레이션 스크립트 실행 (선택사항)

기존 LocalStorage 데이터를 Supabase로 마이그레이션하려면:

```bash
pnpm run migrate-to-supabase
```

## 5. 현재 상태

- ✅ 크롤러는 Supabase에 데이터 저장
- ✅ 백엔드에서 크롤러 실행
- ✅ SSE를 통한 실시간 진행 상황 업데이트
- ⏳ 다른 기능들(사용자, 주문 등)은 여전히 LocalStorage 사용

## 6. 문제 해결

### "function update_updated_at_column() does not exist" 오류
- `000_crawler_tables.sql` 파일을 사용하면 이 오류가 발생하지 않습니다
- 함수 정의와 사용이 같은 파일에 있어 순서 문제가 없습니다

### 크롤링 데이터가 저장되지 않는 경우
1. 환경변수 확인 (특히 `USE_SUPABASE=true`)
2. Service Role Key가 올바른지 확인
3. Supabase 프로젝트가 ACTIVE 상태인지 확인
4. 브라우저 개발자 도구에서 네트워크 오류 확인