import { createBrowserClient } from '@/shared/lib/supabase/client';
import { BookReview, CreateReviewDto, MAX_REVIEW_LENGTH } from './types';

/**
 * 한줄평 서비스
 */
class ReviewService {
  private getSupabase() {
    return createBrowserClient();
  }

  /**
   * 책의 한줄평 목록 조회
   */
  async getReviews(isbn: string, limit = 10): Promise<BookReview[]> {
    const supabase = this.getSupabase();

    const { data, error } = await supabase
      .from('book_reviews')
      .select(`
        *,
        children:child_id (name, avatar)
      `)
      .eq('isbn', isbn)
      .eq('is_reported', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item) => this.mapToReview(item));
  }

  /**
   * 또래 한줄평 조회 (같은 나이대)
   */
  async getPeerReviews(isbn: string, age: number, limit = 10): Promise<BookReview[]> {
    const supabase = this.getSupabase();
    const minAge = Math.max(0, age - 1);
    const maxAge = age + 1;

    const { data, error } = await supabase
      .from('book_reviews')
      .select(`
        *,
        children:child_id (name, avatar)
      `)
      .eq('isbn', isbn)
      .eq('is_reported', false)
      .gte('child_age', minAge)
      .lte('child_age', maxAge)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item) => this.mapToReview(item));
  }

  /**
   * 한줄평 작성
   */
  async createReview(dto: CreateReviewDto): Promise<BookReview> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    // 글자 수 검증
    if (dto.content.length > MAX_REVIEW_LENGTH) {
      throw new Error(`한줄평은 ${MAX_REVIEW_LENGTH}자 이내로 작성해주세요`);
    }

    if (dto.content.trim().length < 5) {
      throw new Error('한줄평은 5자 이상 작성해주세요');
    }

    // 중복 작성 확인 (같은 책에 같은 사용자가 이미 작성했는지)
    const { data: existing } = await supabase
      .from('book_reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('isbn', dto.isbn)
      .eq('child_id', dto.childId || null)
      .single();

    if (existing) {
      throw new Error('이미 이 책에 한줄평을 작성하셨어요');
    }

    const { data, error } = await supabase
      .from('book_reviews')
      .insert({
        user_id: user.id,
        isbn: dto.isbn,
        content: dto.content.trim(),
        child_id: dto.childId || null,
        child_age: dto.childAge || null,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToReview(data);
  }

  /**
   * 한줄평 삭제 (본인 것만)
   */
  async deleteReview(id: string): Promise<void> {
    const supabase = this.getSupabase();

    const { error } = await supabase
      .from('book_reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * 한줄평 신고
   */
  async reportReview(id: string): Promise<void> {
    const supabase = this.getSupabase();

    const { error } = await supabase
      .from('book_reviews')
      .update({ is_reported: true })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * DB 응답을 BookReview 타입으로 변환
   */
  private mapToReview(data: any): BookReview {
    return {
      id: data.id,
      userId: data.user_id,
      childId: data.child_id,
      isbn: data.isbn,
      content: data.content,
      childAge: data.child_age,
      isReported: data.is_reported,
      createdAt: data.created_at,
      childName: data.children?.name,
      childAvatar: data.children?.avatar,
    };
  }
}

export const reviewService = new ReviewService();
