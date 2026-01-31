-- Add missing domain column to tables
-- This column is present in Prisma schema but missing in DB

-- 1. Bookshelf
ALTER TABLE public.bookshelf ADD COLUMN IF NOT EXISTS domain TEXT;

-- 2. Verified Books
ALTER TABLE public.verified_books ADD COLUMN IF NOT EXISTS domain TEXT;