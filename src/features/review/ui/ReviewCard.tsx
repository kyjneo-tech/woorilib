'use client';

import { useState } from 'react';
import { BookReview } from '../lib/types';
import { reviewService } from '../lib/review.service';

interface ReviewCardProps {
  review: BookReview;
  isOwner?: boolean;
  onDelete?: () => void;
}

/**
 * 한줄평 카드 컴포넌트
 */
export function ReviewCard({ review, isOwner, onDelete }: ReviewCardProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleReport = async () => {
    if (!confirm('이 한줄평을 신고하시겠어요?')) return;

    setIsReporting(true);
    try {
      await reviewService.reportReview(review.id);
      alert('신고가 접수되었습니다.');
      setShowMenu(false);
    } catch (error) {
      alert('신고 처리 중 오류가 발생했습니다.');
    } finally {
      setIsReporting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('한줄평을 삭제하시겠어요?')) return;

    try {
      await reviewService.deleteReview(review.id);
      onDelete?.();
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 시간 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

  return (
    <div className="p-3 rounded-xl bg-gray-50 relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{review.childAvatar || '👶'}</span>
          <span className="text-sm font-medium text-gray-700">
            {review.childAge ? `${review.childAge}세` : ''}
            {review.childName ? ` ${review.childName}` : '익명'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
          {/* 더보기 메뉴 */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 top-7 bg-white rounded-lg shadow-lg border py-1 min-w-[100px] z-10">
                {isOwner ? (
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                  >
                    삭제하기
                  </button>
                ) : (
                  <button
                    onClick={handleReport}
                    disabled={isReporting}
                    className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isReporting ? '신고 중...' : '신고하기'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 내용 */}
      <p className="text-sm text-gray-700 leading-relaxed">
        "{review.content}"
      </p>
    </div>
  );
}

/**
 * 한줄평 목록 컴포넌트
 */
interface ReviewListProps {
  reviews: BookReview[];
  currentUserId?: string;
  onReviewDeleted?: () => void;
}

export function ReviewList({ reviews, currentUserId, onReviewDeleted }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <span className="text-3xl mb-2 block">📝</span>
        <p className="text-sm">아직 한줄평이 없어요</p>
        <p className="text-xs">첫 한줄평을 남겨보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          isOwner={review.userId === currentUserId}
          onDelete={onReviewDeleted}
        />
      ))}
    </div>
  );
}
