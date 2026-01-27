
-- Library Curation Table: 도서관 관점에서 정제된 인기 도서 저장
CREATE TABLE IF NOT EXISTS library_curations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn13 TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  cover_url TEXT,
  
  -- 큐레이션 메타
  age_group INTEGER NOT NULL, -- 0-8 (영유아~초등 저학년)
  loan_count INTEGER DEFAULT 0, -- 전국 도서관 대출 횟수
  buzz_count INTEGER DEFAULT 0, -- 네이버 블로그 언급 횟수 (Total)
  age_density_ratio FLOAT, -- 특정 연령대 키워드 언급 비율 (0.0 ~ 1.0)
  
  -- 정제 상태
  is_purified BOOLEAN DEFAULT FALSE, -- 검증 통과 여부
  purified_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(isbn13, age_group)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_lib_curation_age ON library_curations(age_group);
CREATE INDEX IF NOT EXISTS idx_lib_curation_purified ON library_curations(is_purified);

-- RLS
ALTER TABLE library_curations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access library_curations" ON library_curations;
CREATE POLICY "Public read access library_curations" ON library_curations FOR SELECT USING (true);
