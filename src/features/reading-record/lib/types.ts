/**
 * 독서 기록 타입 정의
 */
export interface ReadingRecord {
  id: string;
  userId: string;
  childId: string | null; // null이면 본인
  isbn: string;
  bookTitle: string;
  bookAuthor?: string;
  bookCover?: string;
  reaction: ReactionType | null;
  note?: string;
  readDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface CreateReadingRecordDto {
  childId?: string;
  isbn: string;
  bookTitle: string;
  bookAuthor?: string;
  bookCover?: string;
  reaction?: ReactionType;
  note?: string;
  readDate?: string; // 기본값: 오늘
}

/**
 * 감상 반응 타입
 */
export type ReactionType = 'fun' | 'touching' | 'difficult' | 'boring';

export const REACTIONS: Record<ReactionType, { emoji: string; label: string }> = {
  fun: { emoji: '😆', label: '재미있었어요' },
  touching: { emoji: '❤️', label: '감동이었어요' },
  difficult: { emoji: '🤔', label: '어려웠어요' },
  boring: { emoji: '😴', label: '지루했어요' },
};

/**
 * 독서 통계
 */
export interface ReadingStats {
  totalBooks: number;
  thisMonthBooks: number;
  thisYearBooks: number;
  reactionCounts: Record<ReactionType, number>;
  monthlyTrend: { month: string; count: number }[];
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * 월 이름 반환 (1월, 2월, ...)
 */
export function getMonthLabel(month: number): string {
  return `${month}월`;
}
