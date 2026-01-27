/**
 * 챌린지 & 뱃지 타입 정의
 */

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'achievement';
  goal: number;
  badgeEmoji: string;
  badgeName: string;
  isActive: boolean;
}

export interface UserChallenge {
  id: string;
  userId: string;
  childId: string | null;
  challengeId: string;
  challenge?: Challenge;
  progress: number;
  completedAt: string | null;
  createdAt: string;
}

export interface Badge {
  id: string;
  userId: string;
  childId: string | null;
  badgeEmoji: string;
  badgeName: string;
  earnedAt: string;
}

/**
 * 기본 챌린지 목록
 */
export const DEFAULT_CHALLENGES: Omit<Challenge, 'id'>[] = [
  {
    title: '이번 주 3권 읽기',
    description: '이번 주에 책 3권을 읽어보세요',
    type: 'weekly',
    goal: 3,
    badgeEmoji: '📚',
    badgeName: '주간 독서왕',
    isActive: true,
  },
  {
    title: '이번 달 10권 읽기',
    description: '이번 달에 책 10권을 읽어보세요',
    type: 'monthly',
    goal: 10,
    badgeEmoji: '👑',
    badgeName: '월간 독서왕',
    isActive: true,
  },
  {
    title: '7일 연속 읽기',
    description: '7일 연속으로 책을 읽어보세요',
    type: 'achievement',
    goal: 7,
    badgeEmoji: '🔥',
    badgeName: '꾸준한 독서가',
    isActive: true,
  },
  {
    title: '5개 분야 도전',
    description: '5개의 다른 분야 책을 읽어보세요',
    type: 'achievement',
    goal: 5,
    badgeEmoji: '🧭',
    badgeName: '독서 탐험가',
    isActive: true,
  },
  {
    title: '도서관 20권 빌리기',
    description: '도서관에서 20권을 빌려 읽어보세요',
    type: 'achievement',
    goal: 20,
    badgeEmoji: '🏛️',
    badgeName: '도서관 마스터',
    isActive: true,
  },
  {
    title: '첫 독서 기록',
    description: '첫 독서 기록을 남겨보세요',
    type: 'achievement',
    goal: 1,
    badgeEmoji: '🌱',
    badgeName: '독서 새싹',
    isActive: true,
  },
];

/**
 * 챌린지 진행률 계산
 */
export function calculateProgress(progress: number, goal: number): number {
  return Math.min(Math.round((progress / goal) * 100), 100);
}

/**
 * 챌린지 완료 여부
 */
export function isCompleted(progress: number, goal: number): boolean {
  return progress >= goal;
}
