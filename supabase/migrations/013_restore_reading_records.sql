-- Restore reading_records table which was missing
-- Update it to reference child_profiles matching Prisma schema
-- child_profiles.id is TEXT in DB, so child_id must be TEXT

CREATE TABLE IF NOT EXISTS public.reading_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id TEXT REFERENCES public.child_profiles(id) ON DELETE SET NULL,
  isbn TEXT NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT,
  book_cover TEXT,
  reaction TEXT CHECK (reaction IN ('fun', 'touching', 'difficult', 'boring')),
  note TEXT,
  read_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  domain TEXT
);

-- RLS
ALTER TABLE public.reading_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (in case table existed but was broken)
DROP POLICY IF EXISTS "Users can view own reading records" ON public.reading_records;
DROP POLICY IF EXISTS "Users can insert own reading records" ON public.reading_records;
DROP POLICY IF EXISTS "Users can update own reading records" ON public.reading_records;
DROP POLICY IF EXISTS "Users can delete own reading records" ON public.reading_records;

CREATE POLICY "Users can view own reading records" ON public.reading_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading records" ON public.reading_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading records" ON public.reading_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading records" ON public.reading_records
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reading_records_user_id ON public.reading_records(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_records_child_id ON public.reading_records(child_id);
CREATE INDEX IF NOT EXISTS idx_reading_records_isbn ON public.reading_records(isbn);
CREATE INDEX IF NOT EXISTS idx_reading_records_read_date ON public.reading_records(read_date);