import { calculateAge, calculateKoreanAge, getAgeGroupLabel as getAgeLabel } from '@/shared/lib/child-logic';

/**
 * 자녀(가족 멤버) 타입 정의
 */
export interface Child {
  id: string;
  userId: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthYear?: number; // 추가
  avatar: string; // 이모지
  createdAt: string;
  updatedAt: string;
}

export { calculateAge, calculateKoreanAge, getAgeLabel };

export interface CreateChildDto {
  name: string;
  birthDate: string;
  avatar: string;
}

export interface UpdateChildDto {
  name?: string;
  birthDate?: string;
  avatar?: string;
}

/**
 * 아바타 이모지 옵션
 */
export const AVATAR_OPTIONS = [
  '👶', // 아기
  '🧒', // 어린이
  '👦', // 소년
  '👧', // 소녀
  '🐰', // 토끼
  '🐻', // 곰
  '🦊', // 여우
  '🐱', // 고양이
  '🐶', // 강아지
  '🦁', // 사자
  '🐼', // 판다
  '🐨', // 코알라
];

export const DEFAULT_AVATAR = '👶';
