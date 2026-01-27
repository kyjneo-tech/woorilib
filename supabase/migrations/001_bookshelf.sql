-- ============================================
-- 우리아이도서관 - Bookshelf Table Migration
-- ============================================
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. 책장 테이블 생성
DROP TABLE IF EXISTS public.bookshelf CASCADE;

CREATE TABLE public.bookshelf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  isbn TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  book_image TEXT,
  status TEXT CHECK (status IN ('want_to_read', 'reading', 'finished')) DEFAULT 'want_to_read',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  UNIQUE(user_id, isbn)
);

-- 2. RLS (Row Level Security) 활성화
ALTER TABLE public.bookshelf ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책: 사용자는 자신의 책만 조회/생성/수정/삭제 가능
CREATE POLICY "Users can view their own books"
  ON public.bookshelf FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books"
  ON public.bookshelf FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books"
  ON public.bookshelf FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
  ON public.bookshelf FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_bookshelf_user_id ON public.bookshelf(user_id);
CREATE INDEX IF NOT EXISTS idx_bookshelf_status ON public.bookshelf(status);
CREATE INDEX IF NOT EXISTS idx_bookshelf_added_at ON public.bookshelf(added_at DESC);

-- ============================================
-- 완료! 이제 앱에서 책장 기능을 사용할 수 있습니다.
-- ============================================
