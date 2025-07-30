-- RLS (Row Level Security) 비활성화 마이그레이션
-- 생성일: 2025-01-xx
-- 설명: 모든 테이블의 RLS를 비활성화합니다.

-- 사용자 관련 테이블
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_addresses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_activity_logs" DISABLE ROW LEVEL SECURITY;

-- 시스템 설정 테이블
ALTER TABLE "system_settings" DISABLE ROW LEVEL SECURITY;

-- 핫딜 관련 테이블
ALTER TABLE "hot_deals" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "hot_deal_likes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_favorite_hotdeals" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "hotdeal_translations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "hot_deal_comments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "comment_likes" DISABLE ROW LEVEL SECURITY;

-- 대리구매 관련 테이블
ALTER TABLE "proxy_purchases_request" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "proxy_purchase_addresses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "proxy_purchase_quotes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "order_status_history" DISABLE ROW LEVEL SECURITY;

-- 결제 관련 테이블
ALTER TABLE "payments" DISABLE ROW LEVEL SECURITY;

-- 알림 테이블
ALTER TABLE "notifications" DISABLE ROW LEVEL SECURITY;

-- 크롤링 로그 테이블
ALTER TABLE "crawling_logs" DISABLE ROW LEVEL SECURITY;

-- 롤백을 위한 주석 처리된 명령어들
-- 필요시 아래 명령어들을 사용하여 RLS를 다시 활성화할 수 있습니다.
/*
-- 사용자 관련 테이블
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_activity_logs" ENABLE ROW LEVEL SECURITY;

-- 시스템 설정 테이블
ALTER TABLE "system_settings" ENABLE ROW LEVEL SECURITY;

-- 핫딜 관련 테이블
ALTER TABLE "hot_deals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hot_deal_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_favorite_hotdeals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hotdeal_translations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hot_deal_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comment_likes" ENABLE ROW LEVEL SECURITY;

-- 대리구매 관련 테이블
ALTER TABLE "proxy_purchases_request" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proxy_purchase_addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proxy_purchase_quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_status_history" ENABLE ROW LEVEL SECURITY;

-- 결제 관련 테이블
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

-- 알림 테이블
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- 크롤링 로그 테이블
ALTER TABLE "crawling_logs" ENABLE ROW LEVEL SECURITY;
*/
