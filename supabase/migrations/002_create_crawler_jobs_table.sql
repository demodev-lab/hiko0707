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

-- 인덱스 생성
CREATE INDEX idx_crawler_jobs_source ON public.crawler_jobs(source);
CREATE INDEX idx_crawler_jobs_enabled ON public.crawler_jobs(enabled);
CREATE INDEX idx_crawler_jobs_status ON public.crawler_jobs(status);

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_crawler_jobs_updated_at BEFORE UPDATE
    ON public.crawler_jobs FOR EACH ROW EXECUTE FUNCTION 
    update_updated_at_column();

-- Row Level Security (RLS) 설정
ALTER TABLE public.crawler_jobs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read crawler jobs" ON public.crawler_jobs
  FOR SELECT USING (true);

-- 서비스 롤만 관리 가능
CREATE POLICY "Service role can manage crawler jobs" ON public.crawler_jobs
  FOR ALL USING (auth.role() = 'service_role');