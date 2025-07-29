-- Hotdeals 테이블 생성
CREATE TABLE IF NOT EXISTS public.hotdeals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  source_post_id VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  original_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  discount_rate INTEGER,
  delivery_fee DECIMAL(10, 2),
  shop_name VARCHAR(255),
  url TEXT NOT NULL,
  image_url TEXT,
  post_date TIMESTAMPTZ NOT NULL,
  is_hot BOOLEAN DEFAULT false,
  is_expired BOOLEAN DEFAULT false,
  is_nsfw BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  community_recommend_count INTEGER DEFAULT 0,
  community_comment_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  crawled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 방지를 위한 유니크 제약
  UNIQUE(source, source_post_id)
);

-- 인덱스 생성
CREATE INDEX idx_hotdeals_source ON public.hotdeals(source);
CREATE INDEX idx_hotdeals_post_date ON public.hotdeals(post_date DESC);
CREATE INDEX idx_hotdeals_crawled_at ON public.hotdeals(crawled_at DESC);
CREATE INDEX idx_hotdeals_status ON public.hotdeals(status);
CREATE INDEX idx_hotdeals_is_hot ON public.hotdeals(is_hot);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hotdeals_updated_at BEFORE UPDATE
    ON public.hotdeals FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Row Level Security (RLS) 설정
ALTER TABLE public.hotdeals ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read hotdeals" ON public.hotdeals
  FOR SELECT USING (true);

-- 서비스 롤만 삽입/수정/삭제 가능
CREATE POLICY "Service role can manage hotdeals" ON public.hotdeals
  FOR ALL USING (auth.role() = 'service_role');