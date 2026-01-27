'use client';

import { useEffect, useState } from 'react';
import { reviewService } from '../lib/review.service';
import { BookReview } from '../lib/types';
import { ReviewList } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { useFamilyStore } from '@/features/family/model/use-family-store';
import { calculateAge } from '@/features/family/model/types';

interface ReviewSectionProps {
  isbn: string;
  className?: string;
}

/**
 * 한줄평 섹션 (책 상세 페이지용)
 */
export function ReviewSection({ isbn, className }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  const { getSelectedChild } = useFamilyStore();
  const selectedChild = getSelectedChild();
  const childAge = selectedChild ? calculateAge(selectedChild.birthDate) : null;

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      // 또래 한줄평 우선, 없으면 전체
      let data: BookReview[];
      if (childAge) {
        data = await reviewService.getPeerReviews(isbn, childAge, 10);
        // 또래 리뷰가 적으면 전체 리뷰로 보완
        if (data.length < 3) {
          const allReviews = await reviewService.getReviews(isbn, 10);
          // 중복 제거
          const ids = new Set(data.map((r) => r.id));
          data = [...data, ...allReviews.filter((r) => !ids.has(r.id))].slice(0, 10);
        }
      } else {
        data = await reviewService.getReviews(isbn, 10);
      }
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 사용자 ID 가져오기
  useEffect(() => {
    const getUser = async () => {
      const { createBrowserClient } = await import('@/shared/lib/supabase/client');
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [isbn, childAge]);

  const handleReviewSuccess = () => {
    setShowForm(false);
    fetchReviews();
  };

  return (
    <section className={className}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
          📝 {childAge ? `${childAge}세 또래` : ''} 한줄평
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            + 작성하기
          </button>
        )}
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm">한줄평 작성</span>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <ReviewForm isbn={isbn} onSuccess={handleReviewSuccess} />
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="animate-spin text-2xl">📝</div>
        </div>
      )}

      {/* 한줄평 목록 */}
      {!isLoading && (
        <ReviewList
          reviews={reviews}
          currentUserId={currentUserId}
          onReviewDeleted={fetchReviews}
        />
      )}
    </section>
  );
}
