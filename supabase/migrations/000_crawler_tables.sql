-- 크롤러 관련 테이블 생성 (크롤링만 Supabase에 적용)

-- 업데이트 시간 자동 갱신 함수 (한 번만 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Hotdeals 인덱스 생성
CREATE INDEX idx_hotdeals_source ON public.hotdeals(source);
CREATE INDEX idx_hotdeals_post_date ON public.hotdeals(post_date DESC);
CREATE INDEX idx_hotdeals_crawled_at ON public.hotdeals(crawled_at DESC);
CREATE INDEX idx_hotdeals_status ON public.hotdeals(status);
CREATE INDEX idx_hotdeals_is_hot ON public.hotdeals(is_hot);

-- Hotdeals 업데이트 트리거
CREATE TRIGGER update_hotdeals_updated_at BEFORE UPDATE
    ON public.hotdeals FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Hotdeals RLS 설정
ALTER TABLE public.hotdeals ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read hotdeals" ON public.hotdeals
  FOR SELECT USING (true);

-- 서비스 롤만 삽입/수정/삭제 가능
CREATE POLICY "Service role can manage hotdeals" ON public.hotdeals
  FOR ALL USING (auth.role() = 'service_role');

-- Crawler Jobs 테이블 생성
CREATE TABLE IF NOT EXISTS public.crawler_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  schedule VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'idle',
  statistics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crawler Jobs 인덱스 생성
CREATE INDEX idx_crawler_jobs_source ON public.crawler_jobs(source);
CREATE INDEX idx_crawler_jobs_enabled ON public.crawler_jobs(enabled);
CREATE INDEX idx_crawler_jobs_status ON public.crawler_jobs(status);

-- Crawler Jobs 업데이트 트리거
CREATE TRIGGER update_crawler_jobs_updated_at BEFORE UPDATE
    ON public.crawler_jobs FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Crawler Jobs RLS 설정
ALTER TABLE public.crawler_jobs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read crawler jobs" ON public.crawler_jobs
  FOR SELECT USING (true);

-- 서비스 롤만 관리 가능
CREATE POLICY "Service role can manage crawler jobs" ON public.crawler_jobs
  FOR ALL USING (auth.role() = 'service_role');