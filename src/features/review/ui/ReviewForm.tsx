'use client';

import { useState } from 'react';
import { reviewService } from '../lib/review.service';
import { MAX_REVIEW_LENGTH, getRandomPlaceholder } from '../lib/types';
import { useFamilyStore } from '@/features/family/model/use-family-store';
import { calculateAge } from '@/features/family/model/types';

interface ReviewFormProps {
  isbn: string;
  onSuccess?: () => void;
}

/**
 * 한줄평 작성 폼
 */
export function ReviewForm({ isbn, onSuccess }: ReviewFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholder] = useState(getRandomPlaceholder());

  const { children, getSelectedChild } = useFamilyStore();
  const selectedChild = getSelectedChild();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const childAge = selectedChild ? calculateAge(selectedChild.birthDate) : undefined;

      await reviewService.createReview({
        isbn,
        content: content.trim(),
        childId: selectedChild?.id,
        childAge,
      });

      setContent('');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || '한줄평 작성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > MAX_REVIEW_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 자녀 표시 */}
      {selectedChild && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{selectedChild.avatar}</span>
          <span>{selectedChild.name} ({calculateAge(selectedChild.birthDate)}세)로 작성</span>
        </div>
      )}

      {/* 입력 필드 */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          maxLength={MAX_REVIEW_LENGTH + 10} // 약간의 여유
          rows={2}
          className={`w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-green-500 ${
            isOverLimit ? 'border-red-300' : 'border-gray-200'
          }`}
          style={{ background: 'var(--color-surface-secondary)' }}
        />
        {/* 글자 수 */}
        <div className={`absolute bottom-2 right-3 text-xs ${
          isOverLimit ? 'text-red-500' : 'text-gray-400'
        }`}>
          {charCount}/{MAX_REVIEW_LENGTH}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={!content.trim() || isOverLimit || isSubmitting}
        className="w-full py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: content.trim() && !isOverLimit ? 'var(--color-primary)' : '#ccc',
          color: 'white',
        }}
      >
        {isSubmitting ? '작성 중...' : '한줄평 남기기'}
      </button>
    </form>
  );
}
