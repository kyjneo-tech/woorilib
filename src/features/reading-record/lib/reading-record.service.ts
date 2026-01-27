import { createBrowserClient } from '@/shared/lib/supabase/client';
import {
  ReadingRecord,
  CreateReadingRecordDto,
  ReadingStats,
  ReactionType,
  getTodayString,
} from './types';

/**
 * 독서 기록 서비스
 */
class ReadingRecordService {
  private getSupabase() {
    return createBrowserClient();
  }

  /**
   * 독서 기록 목록 조회
   */
  async getRecords(childId?: string, limit?: number): Promise<ReadingRecord[]> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    let query = supabase
      .from('reading_records')
      .select('*')
      .eq('user_id', user.id)
      .order('read_date', { ascending: false });

    if (childId) {
      query = query.eq('child_id', childId);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(this.mapToRecord);
  }

  /**
   * 특정 책의 독서 기록 확인 (이미 읽었는지)
   */
  async checkIfRead(isbn: string, childId?: string): Promise<ReadingRecord | null> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let query = supabase
      .from('reading_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('isbn', isbn);

    if (childId) {
      query = query.eq('child_id', childId);
    }

    const { data, error } = await query.single();
    if (error) return null;

    return data ? this.mapToRecord(data) : null;
  }

  /**
   * 독서 기록 추가
   */
  async addRecord(dto: CreateReadingRecordDto): Promise<ReadingRecord> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    const { data, error } = await supabase
      .from('reading_records')
      .insert({
        user_id: user.id,
        child_id: dto.childId || null,
        isbn: dto.isbn,
        book_title: dto.bookTitle,
        book_author: dto.bookAuthor,
        book_cover: dto.bookCover,
        reaction: dto.reaction || null,
        note: dto.note,
        read_date: dto.readDate || getTodayString(),
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToRecord(data);
  }

  /**
   * 독서 기록 수정 (반응 추가 등)
   */
  async updateRecord(
    id: string,
    updates: { reaction?: ReactionType; note?: string }
  ): Promise<ReadingRecord> {
    const supabase = this.getSupabase();

    const { data, error } = await supabase
      .from('reading_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToRecord(data);
  }

  /**
   * 독서 기록 삭제
   */
  async deleteRecord(id: string): Promise<void> {
    const supabase = this.getSupabase();

    const { error } = await supabase
      .from('reading_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * 독서 통계 조회
   */
  async getStats(childId?: string): Promise<ReadingStats> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    let query = supabase
      .from('reading_records')
      .select('*')
      .eq('user_id', user.id);

    if (childId) {
      query = query.eq('child_id', childId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const records = data || [];
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth() + 1;

    // 이번 달, 이번 연도 필터링
    const thisMonthRecords = records.filter((r) => {
      const date = new Date(r.read_date);
      return date.getFullYear() === thisYear && date.getMonth() + 1 === thisMonth;
    });

    const thisYearRecords = records.filter((r) => {
      const date = new Date(r.read_date);
      return date.getFullYear() === thisYear;
    });

    // 반응 집계
    const reactionCounts: Record<ReactionType, number> = {
      fun: 0,
      touching: 0,
      difficult: 0,
      boring: 0,
    };
    records.forEach((r) => {
      if (r.reaction && reactionCounts[r.reaction as ReactionType] !== undefined) {
        reactionCounts[r.reaction as ReactionType]++;
      }
    });

    // 월별 트렌드 (최근 6개월)
    const monthlyTrend: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(thisYear, thisMonth - 1 - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const count = records.filter((r) => {
        const rDate = new Date(r.read_date);
        return rDate.getFullYear() === year && rDate.getMonth() + 1 === month;
      }).length;

      monthlyTrend.push({
        month: `${month}월`,
        count,
      });
    }

    return {
      totalBooks: records.length,
      thisMonthBooks: thisMonthRecords.length,
      thisYearBooks: thisYearRecords.length,
      reactionCounts,
      monthlyTrend,
    };
  }

  /**
   * DB 응답을 ReadingRecord 타입으로 변환
   */
  private mapToRecord(data: any): ReadingRecord {
    return {
      id: data.id,
      userId: data.user_id,
      childId: data.child_id,
      isbn: data.isbn,
      bookTitle: data.book_title,
      bookAuthor: data.book_author,
      bookCover: data.book_cover,
      reaction: data.reaction,
      note: data.note,
      readDate: data.read_date,
      createdAt: data.created_at,
    };
  }
}

export const readingRecordService = new ReadingRecordService();
