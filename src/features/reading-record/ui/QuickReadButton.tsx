'use client';

import { useState } from 'react';
import { useReadingRecordStore } from '../lib/use-reading-record';
import { useFamilyStore } from '@/features/family/model/use-family-store';
import { REACTIONS, ReactionType } from '../lib/types';

interface QuickReadButtonProps {
  isbn: string;
  bookTitle: string;
  bookAuthor?: string;
  bookCover?: string;
  onComplete?: () => void;
}

/**
 * 간편 독서 기록 버튼
 * 책 상세 페이지에서 "읽었어요" 버튼으로 사용
 */
export function QuickReadButton({
  isbn,
  bookTitle,
  bookAuthor,
  bookCover,
  onComplete,
}: QuickReadButtonProps) {
  const [step, setStep] = useState<'idle' | 'child' | 'reaction' | 'done'>('idle');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addRecord } = useReadingRecordStore();
  const { children, getSelectedChild } = useFamilyStore();

  const hasMultipleChildren = children.length > 1;
  const selectedChild = getSelectedChild();

  const handleClick = () => {
    if (hasMultipleChildren) {
      // 다자녀면 자녀 선택 단계로
      setStep('child');
    } else {
      // 단일 자녀면 바로 반응 선택
      setSelectedChildId(selectedChild?.id || null);
      setStep('reaction');
    }
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    setStep('reaction');
  };

  const handleReactionSelect = async (reaction: ReactionType | null) => {
    setIsSubmitting(true);
    try {
      await addRecord({
        childId: selectedChildId || undefined,
        isbn,
        bookTitle,
        bookAuthor,
        bookCover,
        reaction: reaction || undefined,
      });
      setStep('done');
      setTimeout(() => {
        setStep('idle');
        onComplete?.();
      }, 1500);
    } catch (error) {
      console.error('Failed to add reading record:', error);
      alert('기록 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('idle');
    setSelectedChildId(null);
  };

  // 기본 상태: "읽었어요" 버튼
  if (step === 'idle') {
    return (
      <button
        onClick={handleClick}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <span>✅</span>
        <span>읽었어요</span>
      </button>
    );
  }

  // 완료 상태
  if (step === 'done') {
    return (
      <div className="w-full py-3 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2 animate-in zoom-in">
        <span className="text-2xl">🎉</span>
        <span>기록 완료!</span>
      </div>
    );
  }

  // 모달 형태로 표시
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            {step === 'child' ? '누가 읽었나요?' : '어땠나요?'}
          </h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* 자녀 선택 */}
        {step === 'child' && (
          <div className="space-y-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => handleChildSelect(child.id)}
                className="w-full p-4 flex items-center gap-3 rounded-xl border hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">{child.avatar}</span>
                <span className="font-medium">{child.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* 반응 선택 */}
        {step === 'reaction' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(REACTIONS) as [ReactionType, { emoji: string; label: string }][]).map(
                ([key, { emoji, label }]) => (
                  <button
                    key={key}
                    onClick={() => handleReactionSelect(key)}
                    disabled={isSubmitting}
                    className="p-4 flex flex-col items-center gap-2 rounded-xl border hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <span className="text-3xl">{emoji}</span>
                    <span className="text-sm text-gray-600">{label}</span>
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => handleReactionSelect(null)}
              disabled={isSubmitting}
              className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              ⏭️ 건너뛰기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
