-- 전체 데이터베이스 초기화 (개발용)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 테이블 생성
CREATE TABLE "users" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "clerk_user_id" text NOT NULL,
    "email" text NOT NULL,
    "name" text NOT NULL,
    "phone" text NULL,
    "role" text NOT NULL,
    "status" text NOT NULL,
    "preferred_language" text DEFAULT 'ko' NOT NULL,
    "last_logined_at" timestamptz NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "deleted_at" timestamptz NULL,
    CONSTRAINT "pk_users" PRIMARY KEY ("id"),
    CONSTRAINT "uk_users_clerk_user_id" UNIQUE ("clerk_user_id"),
    CONSTRAINT "chk_users_role" CHECK (role IN ('customer', 'admin')),
    CONSTRAINT "chk_users_status" CHECK (status IN ('active', 'inactive', 'suspended'))
);

CREATE TABLE "user_addresses" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "user_id" UUID NOT NULL,
    "name" text NOT NULL,
    "phone" text NOT NULL,
    "post_code" text NOT NULL,
    "address" text NOT NULL,
    "address_detail" text NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "label" text NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_user_addresses" PRIMARY KEY ("id"),
    CONSTRAINT "uk_user_addresses_user_id" UNIQUE ("user_id")
);

CREATE TABLE "user_profiles" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "user_id" UUID NOT NULL,
    "date_of_birth" date NOT NULL,
    "gender" text NOT NULL,
    "avatar_url" text NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_user_profiles" PRIMARY KEY ("id"),
    CONSTRAINT "uk_user_profiles_user_id" UNIQUE ("user_id")
);

CREATE TABLE "admin_activity_logs" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "admin_id" UUID NOT NULL,
    "action" text NOT NULL,
    "action_category" text NOT NULL,
    "entity_type" text NULL,
    "entity_id" UUID NULL,
    "old_value" JSONB NULL,
    "new_value" JSONB NULL,
    "details" JSONB NULL,
    "ip_address" INET NULL,
    "user_agent" text NULL,
    "session_id" text NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_admin_activity_logs" PRIMARY KEY ("id")
);

CREATE TABLE "system_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "updated_by" UUID NULL,
    "key" text NOT NULL,
    "value" JSONB NOT NULL,
    "category" text NOT NULL,
    "data_type" text NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "is_editable" boolean DEFAULT true NOT NULL,
    "description" text NULL,
    "validation_rules" JSONB NULL,
    "default_value" JSONB NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_system_settings" PRIMARY KEY ("id"),
    CONSTRAINT "uk_system_settings_key" UNIQUE ("key")
);

CREATE TABLE "hot_deals" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "description" text NULL,
    "original_price" int NOT NULL,
    "sale_price" int NOT NULL,
    "discount_rate" int NOT NULL,
    "thumbnail_url" text NOT NULL,
    "image_url" text NOT NULL,
    "original_url" text NOT NULL,
    "category" text NOT NULL,
    "source" text NOT NULL,
    "source_id" text NOT NULL,
    "seller" text NULL,
    "is_free_shipping" boolean NOT NULL,
    "status" text NOT NULL,
    "end_date" timestamptz NOT NULL,
    "views" int DEFAULT 0 NOT NULL,
    "comment_count" int DEFAULT 0 NOT NULL,
    "like_count" int DEFAULT 0 NOT NULL,
    "author_name" text NOT NULL,
    "shopping_comment" text NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "deleted_at" timestamptz NULL,
    CONSTRAINT "pk_hot_deals" PRIMARY KEY ("id"),
    CONSTRAINT "uk_hot_deals_source_id" UNIQUE ("source", "source_id")
);

CREATE TABLE "hot_deal_likes" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "hot_deal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_hot_deal_likes" PRIMARY KEY ("id"),
    CONSTRAINT "uk_hot_deal_likes_user_hotdeal" UNIQUE ("user_id", "hot_deal_id")
);

CREATE TABLE "user_favorite_hotdeals" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "user_id" UUID NOT NULL,
    "hotdeal_id" UUID NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_user_favorite_hotdeals" PRIMARY KEY ("id"),
    CONSTRAINT "uk_user_favorite_hotdeals" UNIQUE ("user_id", "hotdeal_id")
);

CREATE TABLE "hotdeal_translations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "hotdeal_id" UUID NOT NULL,
    "language" text NOT NULL,
    "title" text NOT NULL,
    "description" text NULL,
    "is_auto_translated" boolean DEFAULT true NOT NULL,
    "translated_at" timestamptz DEFAULT now() NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_hotdeal_translations" PRIMARY KEY ("id"),
    CONSTRAINT "uk_hotdeal_translations_hotdeal_language" UNIQUE ("hotdeal_id", "language"),
    CONSTRAINT "chk_hotdeal_translations_language" CHECK (language IN ('en', 'zh', 'vi', 'mn', 'th', 'ja', 'ru'))
);

CREATE TABLE "hot_deal_comments" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "parent_id" UUID NULL,
    "user_id" UUID NOT NULL,
    "hotdeal_id" UUID NOT NULL,
    "content" text NOT NULL,
    "is_deleted" boolean DEFAULT false NULL,
    "like_count" int DEFAULT 0 NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_hot_deal_comments" PRIMARY KEY ("id")
);

CREATE TABLE "comment_likes" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_comment_likes" PRIMARY KEY ("id"),
    CONSTRAINT "uk_comment_likes_user_comment" UNIQUE ("user_id", "comment_id")
);

CREATE TABLE "proxy_purchases_request" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "order_number" text NOT NULL,
    "user_id" UUID NOT NULL,
    "hot_deal_id" UUID NOT NULL,
    "shipping_address_id" UUID NULL,
    "quantity" int NOT NULL,
    "option" text NULL,
    "special_requests" text NULL,
    "product_info" JSONB DEFAULT '{}' NOT NULL,
    "status" text DEFAULT 'pending_review' NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_proxy_purchases_request" PRIMARY KEY ("id"),
    CONSTRAINT "uk_proxy_purchases_order_number" UNIQUE ("order_number"),
    CONSTRAINT "chk_proxy_purchases_quantity" CHECK (quantity > 0),
    CONSTRAINT "chk_proxy_purchases_status" CHECK (status IN ('pending_review', 'quote_sent', 'quote_approved', 'payment_pending', 'payment_completed', 'purchasing', 'shipping', 'delivered', 'cancelled'))
);

CREATE TABLE "proxy_purchase_addresses" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "proxy_purchase_id" UUID NOT NULL,
    "recipient_name" text NOT NULL,
    "email" text NOT NULL,
    "phone_number" text NOT NULL,
    "address" text NOT NULL,
    "detail_address" text NOT NULL,
    CONSTRAINT "pk_proxy_purchase_addresses" PRIMARY KEY ("id")
);

CREATE TABLE "proxy_purchase_quotes" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "request_id" UUID NOT NULL,
    "product_cost" int NOT NULL,
    "domestic_shipping" int DEFAULT 0 NOT NULL,
    "fee" int NOT NULL,
    "international_shipping" int DEFAULT 0 NOT NULL,
    "total_amount" int NOT NULL,
    "payment_method" text NOT NULL,
    "notes" text NULL,
    "notification" text NULL,
    "approval_state" text DEFAULT 'pending' NOT NULL,
    "valid_until" timestamptz NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "approved_at" timestamptz NULL,
    "rejected_at" timestamptz NULL,
    CONSTRAINT "pk_proxy_purchase_quotes" PRIMARY KEY ("id"),
    CONSTRAINT "chk_proxy_purchase_quotes_approval" CHECK (approval_state IN ('approved', 'pending', 'rejected'))
);

CREATE TABLE "order_status_history" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "request_id" UUID NOT NULL,
    "changed_by" UUID NULL,
    "from_status" text NULL,
    "to_status" text NOT NULL,
    "notes" text NULL,
    "metadata" JSONB NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_order_status_history" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "request_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" int NOT NULL,
    "currency" text DEFAULT 'KRW' NOT NULL,
    "payment_method" text NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "external_payment_id" text NULL,
    "payment_gateway" text NULL,
    "paid_at" timestamptz NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_payments" PRIMARY KEY ("id"),
    CONSTRAINT "chk_payments_status" CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded'))
);

CREATE TABLE "notifications" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "user_id" UUID NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "is_read" boolean NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "pk_notifications" PRIMARY KEY ("id")
);

CREATE TABLE "crawling_logs" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "source" text NOT NULL,
    "status" text NOT NULL,
    "items_found" int DEFAULT 0 NOT NULL,
    "items_added" int DEFAULT 0 NOT NULL,
    "items_updated" int DEFAULT 0 NOT NULL,
    "duplicates" int DEFAULT 0 NOT NULL,
    "error_message" text NULL,
    "error_details" JSONB NULL,
    "started_at" timestamptz DEFAULT now() NOT NULL,
    "completed_at" timestamptz NULL,
    "duration_ms" int NULL,
    CONSTRAINT "pk_crawling_logs" PRIMARY KEY ("id")
);

-- 외래키 제약조건
ALTER TABLE "user_addresses" ADD CONSTRAINT "fk_user_addresses_user_id"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "user_profiles" ADD CONSTRAINT "fk_user_profiles_user_id"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "fk_admin_activity_logs_admin_id"
    FOREIGN KEY ("admin_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "system_settings" ADD CONSTRAINT "fk_system_settings_updated_by"
    FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL;

ALTER TABLE "hot_deal_likes" ADD CONSTRAINT "fk_hot_deal_likes_hot_deal_id"
    FOREIGN KEY ("hot_deal_id") REFERENCES "hot_deals" ("id") ON DELETE CASCADE;

ALTER TABLE "hot_deal_likes" ADD CONSTRAINT "fk_hot_deal_likes_user_id"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "user_favorite_hotdeals" ADD CONSTRAINT "fk_user_favorite_hotdeals_user_id"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "user_favorite_hotdeals" ADD CONSTRAINT "fk_user_favorite_hotdeals_hotdeal_id"
    FOREIGN KEY ("hotdeal_id") REFERENCES "hot_deals" ("id") ON DELETE CASCADE;

ALTER TABLE "hotdeal_translations" ADD CONSTRAINT "fk_hotdeal_translations_hotdeal_id"
    FOREIGN KEY ("hotdeal_id") REFERENCES "hot_deals" ("id") ON DELETE CASCADE;

ALTER TABLE "hot_deal_comments" ADD CONSTRAINT "fk_hot_deal_comments_parent_id"
    FOREIGN KEY ("parent_id") REFERENCES "hot_deal_comments" ("id") ON DELETE CASCADE;

ALTER TABLE "hot_deal_comments" ADD CONSTRAINT "fk_hot_deal_comments_user_id"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "hot_deal_comments" ADD CONSTRAINT "fk_hot_deal_comments_hotdeal_id"
    FOREIGN KEY ("hotdeal_id") REFERENCES "hot_deals" ("id") ON DELETE CASCADE;

ALTER TABLE "comment_likes" ADD CONSTRAINT "fk_comment_likes_comment_id"
    FOREIGN KEY ("comment_id") REFERENCES "hot_deal_comments" ("id") ON DELETE CASCADE;

ALTER TABLE "comment_likes" ADD CONSTRAINT "fk_comment_likes_user_id"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "proxy_purchases_request" ADD CONSTRAINT "fk_proxy_purchases_request_user_id"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "proxy_purchases_request" ADD CONSTRAINT "fk_proxy_purchases_request_hot_deal_id"
    FOREIGN KEY ("hot_deal_id") REFERENCES "hot_deals" ("id");

ALTER TABLE "proxy_purchases_request" ADD CONSTRAINT "fk_proxy_purchases_request_shipping_address_id"
    FOREIGN KEY ("shipping_address_id") REFERENCES "user_addresses" ("id") ON DELETE SET NULL;

ALTER TABLE "proxy_purchase_addresses" ADD CONSTRAINT "fk_proxy_purchase_addresses_proxy_purchase_id"
    FOREIGN KEY ("proxy_purchase_id") REFERENCES "proxy_purchases_request" ("id") ON DELETE CASCADE;

ALTER TABLE "proxy_purchase_quotes" ADD CONSTRAINT "fk_proxy_purchase_quotes_request_id"
    FOREIGN KEY ("request_id") REFERENCES "proxy_purchases_request" ("id") ON DELETE CASCADE;

ALTER TABLE "order_status_history" ADD CONSTRAINT "fk_order_status_history_request_id"
    FOREIGN KEY ("request_id") REFERENCES "proxy_purchases_request" ("id") ON DELETE CASCADE;

ALTER TABLE "order_status_history" ADD CONSTRAINT "fk_order_status_history_changed_by"
    FOREIGN KEY ("changed_by") REFERENCES "users" ("id") ON DELETE SET NULL;

ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_request_id"
    FOREIGN KEY ("request_id") REFERENCES "proxy_purchases_request" ("id") ON DELETE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_user_id"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_user_id"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- 인덱스 생성
-- 외래키 인덱스
CREATE INDEX "idx_user_addresses_user_id" ON "user_addresses"("user_id");
CREATE INDEX "idx_admin_activity_logs_admin_id" ON "admin_activity_logs"("admin_id");
CREATE INDEX "idx_hot_deal_likes_hot_deal_id" ON "hot_deal_likes"("hot_deal_id");
CREATE INDEX "idx_hot_deal_likes_user_id" ON "hot_deal_likes"("user_id");
CREATE INDEX "idx_user_favorite_hotdeals_user_id" ON "user_favorite_hotdeals"("user_id");
CREATE INDEX "idx_user_favorite_hotdeals_hotdeal_id" ON "user_favorite_hotdeals"("hotdeal_id");
CREATE INDEX "idx_hotdeal_translations_hotdeal_id" ON "hotdeal_translations"("hotdeal_id");
CREATE INDEX "idx_hot_deal_comments_parent_id" ON "hot_deal_comments"("parent_id");
CREATE INDEX "idx_hot_deal_comments_user_id" ON "hot_deal_comments"("user_id");
CREATE INDEX "idx_hot_deal_comments_hotdeal_id" ON "hot_deal_comments"("hotdeal_id");
CREATE INDEX "idx_comment_likes_comment_id" ON "comment_likes"("comment_id");
CREATE INDEX "idx_proxy_purchases_user_id" ON "proxy_purchases_request"("user_id");
CREATE INDEX "idx_proxy_purchases_hot_deal_id" ON "proxy_purchases_request"("hot_deal_id");
CREATE INDEX "idx_proxy_purchase_quotes_request_id" ON "proxy_purchase_quotes"("request_id");
CREATE INDEX "idx_order_status_history_request_id" ON "order_status_history"("request_id");
CREATE INDEX "idx_payments_request_id" ON "payments"("request_id");
CREATE INDEX "idx_payments_user_id" ON "payments"("user_id");
CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id");

-- 자주 검색되는 컬럼 인덱스
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_users_status" ON "users"("status") WHERE "deleted_at" IS NULL;
CREATE INDEX "idx_hot_deals_status" ON "hot_deals"("status") WHERE "deleted_at" IS NULL;
CREATE INDEX "idx_hot_deals_created_at" ON "hot_deals"("created_at" DESC) WHERE "deleted_at" IS NULL;
CREATE INDEX "idx_hot_deals_category" ON "hot_deals"("category") WHERE "deleted_at" IS NULL;
CREATE INDEX "idx_hot_deals_end_date" ON "hot_deals"("end_date") WHERE "deleted_at" IS NULL;
CREATE INDEX "idx_proxy_purchases_status" ON "proxy_purchases_request"("status");
CREATE INDEX "idx_proxy_purchases_created_at" ON "proxy_purchases_request"("created_at" DESC);
CREATE INDEX "idx_payments_status" ON "payments"("status");
CREATE INDEX "idx_notifications_user_read" ON "notifications"("user_id", "is_read");
CREATE INDEX "idx_crawling_logs_source_status" ON "crawling_logs"("source", "status");
CREATE INDEX "idx_crawling_logs_started_at" ON "crawling_logs"("started_at" DESC);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON "user_addresses"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON "user_profiles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON "system_settings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hot_deals_updated_at BEFORE UPDATE ON "hot_deals"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotdeal_translations_updated_at BEFORE UPDATE ON "hotdeal_translations"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hot_deal_comments_updated_at BEFORE UPDATE ON "hot_deal_comments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proxy_purchases_request_updated_at BEFORE UPDATE ON "proxy_purchases_request"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON "payments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 의미있는 주석 추가
COMMENT ON COLUMN "hot_deals"."discount_rate" IS '자동계산: ((original_price - sale_price) / original_price) * 100';
COMMENT ON TABLE "proxy_purchases_request" IS '대리구매 요청 관리 테이블';
COMMENT ON TABLE "hot_deals" IS '핫딜 정보 테이블';
COMMENT ON COLUMN "payments"."payment_gateway" IS '토스페이먼츠 등 결제 게이트웨이';
