-- 1. 전집 (Collections): '전집' 단위의 정보 저장
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- 전집명 (예: 안녕 마음아)
  publisher TEXT NOT NULL, -- 출판사
  target_age_months_start INTEGER, -- 권장 연령(개월) 시작
  target_age_months_end INTEGER, -- 권장 연령(개월) 끝
  total_count INTEGER, -- 총 권수
  category TEXT, -- 분류 (인성, 자연관찰, 사회탐구 등)
  
  -- 하드웨어 및 특수 기능 (세이펜, QR, 워크북 등)
  features JSONB DEFAULT '{}'::jsonb, 
  -- 예: { "saypen": true, "qr_code": true, "workbook_included": true }
  
  -- AI 분석 데이터
  summary TEXT, -- AI 요약 설명
  pros TEXT[], -- 장점 키워드
  cons TEXT[], -- 단점/주의사항
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 검증된 도서 (Verified Books): AI 및 API로 검증된 단행본/전집 구성원
CREATE TABLE IF NOT EXISTS verified_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn13 TEXT UNIQUE, -- ISBN (없는 경우 가상 ID 사용 가능하지만 원칙적으로 필수)
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  pub_date DATE,
  cover_url TEXT,
  description TEXT,
  price_standard INTEGER, -- 정가 (참고용)
  
  -- 도서 타입
  type TEXT NOT NULL CHECK (type IN ('single', 'collection_item')), 
  -- 'single': 단행본, 'collection_item': 전집의 구성품
  
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL, -- 전집 소속일 경우 링크
  
  -- 큐레이션용 메타 데이터
  target_ages INTEGER[], -- 적합 나이(만 나이) 배열 (예: [3, 4, 5]) 
  target_months_range INT4RANGE, -- 적합 월령 범위 (Postgres Range 타입 사용)
  
  tags TEXT[], -- 태그 (예: ['잠자리독서', '배변훈련'])
  
  -- 데이터 출처 및 검증 상태
  source TEXT DEFAULT 'aladin', -- aladin, naver_book 등
  is_verified BOOLEAN DEFAULT FALSE, -- API 실존 확인 여부
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 큐레이션 발행 (Curations): 월간/테마별 추천 리스트
CREATE TABLE IF NOT EXISTS curations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- 큐레이션 제목 (예: "3월, 어린이집 적응을 돕는 그림책")
  subtitle TEXT, 
  
  -- 타겟팅
  target_age_group INTEGER, -- UI 표시용 연령대 (0, 1, ..., 8)
  keywords TEXT[], -- 관련 키워드
  
  -- 추천 도서 리스트 (JSONB로 순서와 코멘트 관리)
  -- 구조: [ { "book_id": "uuid", "isbn": "...", "reason": "...", "is_collection": boolean } ]
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  is_public BOOLEAN DEFAULT FALSE, -- 공개 여부
  published_at TIMESTAMPTZ, -- 발행일
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_verified_books_isbn ON verified_books(isbn13);
CREATE INDEX IF NOT EXISTS idx_verified_books_tags ON verified_books USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_curations_target_age ON curations(target_age_group);
CREATE INDEX IF NOT EXISTS idx_collections_publisher ON collections(publisher);

-- RLS (공개 읽기, 관리자 쓰기 - 여기서는 간단히 설정)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE curations ENABLE ROW LEVEL SECURITY;

-- 읽기는 누구나 가능
DROP POLICY IF EXISTS "Public read access collections" ON collections;
CREATE POLICY "Public read access collections" ON collections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access verified_books" ON verified_books;
CREATE POLICY "Public read access verified_books" ON verified_books FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access curations" ON curations;
CREATE POLICY "Public read access curations" ON curations FOR SELECT USING (true);

-- 쓰기는 일단 Authenticated User (나중에 Admin만 가능하게 수정 필요)
DROP POLICY IF EXISTS "Auth write access collections" ON collections;
CREATE POLICY "Auth write access collections" ON collections FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth write access verified_books" ON verified_books;
CREATE POLICY "Auth write access verified_books" ON verified_books FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth write access curations" ON curations;
CREATE POLICY "Auth write access curations" ON curations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
