/**
 * 한줄평 타입 정의
 */
export interface BookReview {
  id: string;
  userId: string;
  childId: string | null;
  isbn: string;
  content: string;
  childAge: number | null; // 작성 시점의 자녀 나이
  isReported: boolean;
  createdAt: string;
  // 조인된 데이터
  childName?: string;
  childAvatar?: string;
}

export interface CreateReviewDto {
  isbn: string;
  content: string;
  childId?: string;
  childAge?: number;
}

/**
 * 한줄평 최대 글자 수
 */
export const MAX_REVIEW_LENGTH = 100;

/**
 * 한줄평 예시 (입력 힌트용)
 */
export const REVIEW_PLACEHOLDERS = [
  '우리 아이가 100번은 읽었어요',
  '잠자기 전에 꼭 읽어달라고 해요',
  '그림이 너무 예뻐서 좋아해요',
  '재미있어서 계속 웃었어요',
  '조금 어려웠지만 끝까지 읽었어요',
];

/**
 * 랜덤 플레이스홀더 반환
 */
export function getRandomPlaceholder(): string {
  return REVIEW_PLACEHOLDERS[Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length)];
}
