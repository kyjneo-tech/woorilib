import { createBrowserClient } from '@/shared/lib/supabase/client';
import { PeerComparisonData, PeerPopularBook } from './types';

/**
 * 또래 비교 서비스
 */
class PeerComparisonService {
  private getSupabase() {
    return createBrowserClient();
  }

  /**
   * 또래 비교 데이터 조회
   */
  async getComparison(childId: string, childAge: number): Promise<PeerComparisonData | null> {
    const supabase = this.getSupabase();

    // 나이 범위: 같은 나이 ± 1세
    const minAge = Math.max(0, childAge - 1);
    const maxAge = childAge + 1;

    const { data, error } = await supabase
      .rpc('get_peer_comparison', {
        p_child_id: childId,
        p_min_age: minAge,
        p_max_age: maxAge,
      });

    if (error) {
      console.error('Peer comparison error:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const row = data[0];
    return {
      myTotalBooks: row.my_total_books || 0,
      myThisMonthBooks: row.my_this_month_books || 0,
      peerAvgTotal: row.peer_avg_total || 0,
      peerAvgMonth: row.peer_avg_month || 0,
      peerCount: row.peer_count || 0,
      percentile: row.percentile || 50,
    };
  }

  /**
   * 또래 인기 도서 조회
   */
  async getPeerPopularBooks(childAge: number, limit = 10): Promise<PeerPopularBook[]> {
    const supabase = this.getSupabase();

    const minAge = Math.max(0, childAge - 1);
    const maxAge = childAge + 1;

    const { data, error } = await supabase
      .rpc('get_peer_popular_books', {
        min_age: minAge,
        max_age: maxAge,
        result_limit: limit,
      });

    if (error) {
      console.error('Peer popular books error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      isbn: row.isbn,
      bookTitle: row.book_title,
      bookAuthor: row.book_author,
      bookCover: row.book_cover,
      readCount: row.read_count,
    }));
  }

  /**
   * 자녀의 읽기 통계 조회 (간단 버전)
   */
  async getChildStats(childId: string): Promise<{
    totalBooks: number;
    thisMonthBooks: number;
    thisWeekBooks: number;
  }> {
    const supabase = this.getSupabase();

    // 총 독서량
    const { count: totalBooks } = await supabase
      .from('reading_records')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId);

    // 이번 달
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count: thisMonthBooks } = await supabase
      .from('reading_records')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .gte('read_date', startOfMonth);

    // 이번 주
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { count: thisWeekBooks } = await supabase
      .from('reading_records')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .gte('read_date', startOfWeek.toISOString());

    return {
      totalBooks: totalBooks || 0,
      thisMonthBooks: thisMonthBooks || 0,
      thisWeekBooks: thisWeekBooks || 0,
    };
  }
}

export const peerComparisonService = new PeerComparisonService();
