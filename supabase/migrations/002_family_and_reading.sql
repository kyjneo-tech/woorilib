-- 기존 테이블 초기화 (재실행 시 에러 방지)
DROP TABLE IF EXISTS children, reading_records, challenges, user_challenges, user_badges, book_reviews CASCADE;

-- 자녀(가족 멤버) 테이블
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  avatar TEXT DEFAULT '👶',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 독서 기록 테이블
CREATE TABLE IF NOT EXISTS reading_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  isbn TEXT NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT,
  book_cover TEXT,
  reaction TEXT CHECK (reaction IN ('fun', 'touching', 'difficult', 'boring')),
  note TEXT,
  read_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 챌린지 테이블
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'achievement')),
  goal INTEGER NOT NULL,
  badge_emoji TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 챌린지 진행 상황 테이블
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, child_id, challenge_id)
);

-- 뱃지 획득 테이블
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  badge_emoji TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 한줄평 테이블
CREATE TABLE IF NOT EXISTS book_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  isbn TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 100),
  child_age INTEGER, -- 작성 시점의 자녀 나이 (또래 필터용)
  is_reported BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_records_user_id ON reading_records(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_records_child_id ON reading_records(child_id);
CREATE INDEX IF NOT EXISTS idx_reading_records_isbn ON reading_records(isbn);
CREATE INDEX IF NOT EXISTS idx_reading_records_read_date ON reading_records(read_date);
CREATE INDEX IF NOT EXISTS idx_book_reviews_isbn ON book_reviews(isbn);
CREATE INDEX IF NOT EXISTS idx_book_reviews_child_age ON book_reviews(child_age);

-- RLS 정책
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;

-- children 테이블 RLS
CREATE POLICY "Users can view own children" ON children
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own children" ON children
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own children" ON children
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own children" ON children
  FOR DELETE USING (auth.uid() = user_id);

-- reading_records 테이블 RLS
CREATE POLICY "Users can view own reading records" ON reading_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reading records" ON reading_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reading records" ON reading_records
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reading records" ON reading_records
  FOR DELETE USING (auth.uid() = user_id);

-- user_challenges 테이블 RLS
CREATE POLICY "Users can view own challenges" ON user_challenges
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON user_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON user_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- user_badges 테이블 RLS
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- book_reviews 테이블 RLS (본인 작성 + 전체 조회)
CREATE POLICY "Anyone can view non-reported reviews" ON book_reviews
  FOR SELECT USING (is_reported = FALSE);
CREATE POLICY "Users can insert own reviews" ON book_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON book_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON book_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 기본 챌린지 데이터 삽입
INSERT INTO challenges (title, description, type, goal, badge_emoji, badge_name) VALUES
  ('이번 주 3권 읽기', '이번 주에 책 3권을 읽어보세요', 'weekly', 3, '📚', '주간 독서왕'),
  ('이번 달 10권 읽기', '이번 달에 책 10권을 읽어보세요', 'monthly', 10, '👑', '월간 독서왕'),
  ('7일 연속 읽기', '7일 연속으로 책을 읽어보세요', 'achievement', 7, '🔥', '꾸준한 독서가'),
  ('5개 분야 도전', '5개의 다른 분야 책을 읽어보세요', 'achievement', 5, '🧭', '독서 탐험가'),
  ('도서관 20권 빌리기', '도서관에서 20권을 빌려 읽어보세요', 'achievement', 20, '🏛️', '도서관 마스터'),
  ('첫 독서 기록', '첫 독서 기록을 남겨보세요', 'achievement', 1, '🌱', '독서 새싹')
ON CONFLICT DO NOTHING;
