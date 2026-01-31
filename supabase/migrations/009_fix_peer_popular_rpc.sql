-- Fix for missing get_peer_popular_books RPC function
-- Dropping and recreating to ensure it exists with correct signature

DROP FUNCTION IF EXISTS get_peer_popular_books(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_peer_popular_books(
  min_age INTEGER,
  max_age INTEGER,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  isbn TEXT,
  book_title TEXT,
  book_author TEXT,
  book_cover TEXT,
  read_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.isbn,
    r.book_title,
    r.book_author,
    r.book_cover,
    COUNT(*) AS read_count
  FROM reading_records r
  JOIN child_profiles c ON r.child_id = c.id
  WHERE
    -- 나이 계산: 현재 연도 - 태어난 연도
    (EXTRACT(YEAR FROM CURRENT_DATE) - c.birth_year) >= min_age
    AND (EXTRACT(YEAR FROM CURRENT_DATE) - c.birth_year) <= max_age
  GROUP BY r.isbn, r.book_title, r.book_author, r.book_cover
  ORDER BY read_count DESC
  LIMIT result_limit;
END;
$$;
