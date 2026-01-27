-- 또래 인기 도서 조회 RPC 함수
-- 같은 나이대의 아이들이 많이 읽은 책 목록 반환

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
  JOIN children c ON r.child_id = c.id
  WHERE
    -- 나이 계산: 현재 날짜 기준
    EXTRACT(YEAR FROM AGE(c.birth_date)) >= min_age
    AND EXTRACT(YEAR FROM AGE(c.birth_date)) <= max_age
  GROUP BY r.isbn, r.book_title, r.book_author, r.book_cover
  ORDER BY read_count DESC
  LIMIT result_limit;
END;
$$;

-- 또래 비교 통계 RPC 함수
-- 우리 아이 vs 또래 평균 비교

CREATE OR REPLACE FUNCTION get_peer_comparison(
  p_child_id UUID,
  p_min_age INTEGER,
  p_max_age INTEGER
)
RETURNS TABLE (
  my_total_books BIGINT,
  my_this_month_books BIGINT,
  peer_avg_total NUMERIC,
  peer_avg_month NUMERIC,
  peer_count BIGINT,
  percentile INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_total BIGINT;
  v_my_month BIGINT;
  v_peer_avg_total NUMERIC;
  v_peer_avg_month NUMERIC;
  v_peer_count BIGINT;
  v_my_rank BIGINT;
  v_percentile INTEGER;
BEGIN
  -- 내 자녀의 총 독서량
  SELECT COUNT(*) INTO v_my_total
  FROM reading_records
  WHERE child_id = p_child_id;

  -- 내 자녀의 이번 달 독서량
  SELECT COUNT(*) INTO v_my_month
  FROM reading_records
  WHERE child_id = p_child_id
    AND EXTRACT(YEAR FROM read_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM read_date) = EXTRACT(MONTH FROM CURRENT_DATE);

  -- 또래 평균 (총)
  SELECT
    AVG(cnt)::NUMERIC,
    COUNT(DISTINCT child_id)
  INTO v_peer_avg_total, v_peer_count
  FROM (
    SELECT r.child_id, COUNT(*) AS cnt
    FROM reading_records r
    JOIN children c ON r.child_id = c.id
    WHERE
      EXTRACT(YEAR FROM AGE(c.birth_date)) >= p_min_age
      AND EXTRACT(YEAR FROM AGE(c.birth_date)) <= p_max_age
      AND r.child_id != p_child_id
    GROUP BY r.child_id
  ) sub;

  -- 또래 평균 (이번 달)
  SELECT AVG(cnt)::NUMERIC INTO v_peer_avg_month
  FROM (
    SELECT r.child_id, COUNT(*) AS cnt
    FROM reading_records r
    JOIN children c ON r.child_id = c.id
    WHERE
      EXTRACT(YEAR FROM AGE(c.birth_date)) >= p_min_age
      AND EXTRACT(YEAR FROM AGE(c.birth_date)) <= p_max_age
      AND r.child_id != p_child_id
      AND EXTRACT(YEAR FROM r.read_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND EXTRACT(MONTH FROM r.read_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    GROUP BY r.child_id
  ) sub;

  -- 내 순위 계산 (상위 몇 %인지)
  SELECT COUNT(*) + 1 INTO v_my_rank
  FROM (
    SELECT r.child_id, COUNT(*) AS cnt
    FROM reading_records r
    JOIN children c ON r.child_id = c.id
    WHERE
      EXTRACT(YEAR FROM AGE(c.birth_date)) >= p_min_age
      AND EXTRACT(YEAR FROM AGE(c.birth_date)) <= p_max_age
    GROUP BY r.child_id
    HAVING COUNT(*) > v_my_total
  ) sub;

  -- 백분위 계산
  IF v_peer_count > 0 THEN
    v_percentile := GREATEST(1, LEAST(100, 100 - (v_my_rank * 100 / (v_peer_count + 1))));
  ELSE
    v_percentile := 50; -- 데이터 없으면 중간
  END IF;

  RETURN QUERY SELECT
    v_my_total,
    v_my_month,
    COALESCE(v_peer_avg_total, 0),
    COALESCE(v_peer_avg_month, 0),
    COALESCE(v_peer_count, 0),
    v_percentile;
END;
$$;
