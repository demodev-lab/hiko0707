-- 크롤러에서 사용하는 hotdeals 테이블 생성
-- 기존 hot_deals 테이블과는 다른 구조로, 크롤러 데이터에 최적화된 스키마

-- 테이블 생성
CREATE TABLE IF NOT EXISTS "public"."hotdeals" (
    -- 기본 필드
    "id" TEXT NOT NULL PRIMARY KEY,
    
    -- 크롤링 정보
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0, -- 0: 프로모션, -1: 가격다양
    "imageUrl" TEXT,
    "thumbnailImageUrl" TEXT,
    "originalImageUrl" TEXT,
    "originalUrl" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourcePostId" TEXT NOT NULL,
    "crawledAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "userId" TEXT,
    "communityCommentCount" INTEGER DEFAULT 0,
    "communityRecommendCount" INTEGER DEFAULT 0,
    "isPopular" BOOLEAN DEFAULT FALSE,
    "isHot" BOOLEAN DEFAULT FALSE,
    "ranking" INTEGER,
    "shipping" JSONB, -- 배송 정보 JSON
    "productComment" TEXT,
    "category" TEXT,
    
    -- 상태
    "status" TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    
    -- 사이트 고유 기능
    "viewCount" INTEGER DEFAULT 0,
    "likeCount" INTEGER DEFAULT 0,
    "commentCount" INTEGER DEFAULT 0,
    
    -- 번역 필드
    "translatedTitle" TEXT,
    "translatedProductComment" TEXT,
    "translationStatus" TEXT CHECK (translationStatus IN ('pending', 'translating', 'completed', 'failed')),
    "translatedAt" TIMESTAMP WITH TIME ZONE,
    
    -- 메타데이터
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 중복 방지를 위한 유니크 제약조건 (source + sourcePostId 조합)
CREATE UNIQUE INDEX IF NOT EXISTS "uk_hotdeals_source_post" 
ON "public"."hotdeals" ("source", "sourcePostId");

-- 성능을 위한 인덱스들
CREATE INDEX IF NOT EXISTS "idx_hotdeals_source" ON "public"."hotdeals" ("source");
CREATE INDEX IF NOT EXISTS "idx_hotdeals_crawled_at" ON "public"."hotdeals" ("crawledAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_hotdeals_status" ON "public"."hotdeals" ("status");
CREATE INDEX IF NOT EXISTS "idx_hotdeals_price" ON "public"."hotdeals" ("price");
CREATE INDEX IF NOT EXISTS "idx_hotdeals_seller" ON "public"."hotdeals" ("seller");
CREATE INDEX IF NOT EXISTS "idx_hotdeals_category" ON "public"."hotdeals" ("category");

-- updated_at 자동 업데이트 함수 (존재하지 않을 경우만 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_hotdeals_updated_at ON "public"."hotdeals";
CREATE TRIGGER update_hotdeals_updated_at 
    BEFORE UPDATE ON "public"."hotdeals"
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 테이블에 코멘트 추가
COMMENT ON TABLE "public"."hotdeals" IS '크롤러에서 수집한 핫딜 정보를 저장하는 메인 테이블';
COMMENT ON COLUMN "public"."hotdeals"."price" IS '가격: 0=프로모션, -1=가격다양, 양수=실제가격';
COMMENT ON COLUMN "public"."hotdeals"."sourcePostId" IS '커뮤니티 원본 게시글 ID (중복 체크용)';
COMMENT ON COLUMN "public"."hotdeals"."shipping" IS '배송 정보 JSON: {isFree: boolean, cost?: number, description?: string}';

SELECT 'hotdeals 테이블 생성 완료' as result;