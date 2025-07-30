-- RLS 우회를 위한 권한 설정
-- 생성일: 2025-01-30
-- 설명: 모든 테이블의 RLS를 비활성화하고 필요한 권한을 부여합니다.

-- 1. 모든 public 스키마 테이블의 RLS 비활성화
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hot_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hot_deal_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_favorite_hotdeals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hotdeal_translations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hot_deal_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comment_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proxy_purchases_request DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proxy_purchase_addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proxy_purchase_quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crawling_logs DISABLE ROW LEVEL SECURITY;

-- 2. 기존 권한 취소 (clean slate)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 3. public 스키마 사용 권한 부여
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 4. 모든 테이블에 대한 전체 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 5. 향후 생성될 객체에 대한 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- 6. 권한 확인 (users 테이블 기준)
SELECT
    'RLS disabled for users' as test,
    NOT relrowsecurity as result
FROM pg_class
WHERE relname = 'users' AND relnamespace = 'public'::regnamespace
UNION ALL
SELECT
    'anon can SELECT from users' as test,
    has_table_privilege('anon', 'public.users', 'SELECT') as result
UNION ALL
SELECT
    'anon can INSERT into users' as test,
    has_table_privilege('anon', 'public.users', 'INSERT') as result
UNION ALL
SELECT
    'authenticated can SELECT from users' as test,
    has_table_privilege('authenticated', 'public.users', 'SELECT') as result
UNION ALL
SELECT
    'authenticated can INSERT into users' as test,
    has_table_privilege('authenticated', 'public.users', 'INSERT') as result
UNION ALL
SELECT
    'service_role can SELECT from users' as test,
    has_table_privilege('service_role', 'public.users', 'SELECT') as result
UNION ALL
SELECT
    'service_role can INSERT into users' as test,
    has_table_privilege('service_role', 'public.users', 'INSERT') as result;