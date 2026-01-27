/**
 * 자녀(가족 멤버) 타입 정의
 */
export interface Child {
  id: string;
  userId: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  avatar: string; // 이모지
  createdAt: string;
  updatedAt: string;
}

export interface CreateChildDto {
  name: string;
  birthDate: string;
  avatar?: string;
}

export interface UpdateChildDto {
  name?: string;
  birthDate?: string;
  avatar?: string;
}

/**
 * 나이 계산 (만 나이)
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 한국식 나이 계산 (세는 나이)
 */
export function calculateKoreanAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  return today.getFullYear() - birth.getFullYear() + 1;
}

/**
 * 나이대 라벨
 */
export function getAgeLabel(birthDate: string): string {
  const age = calculateAge(birthDate);
  if (age < 1) return '영아';
  if (age < 3) return '영아';
  if (age < 5) return '유아';
  if (age < 7) return '취학 전';
  if (age < 10) return '초등 저학년';
  if (age < 13) return '초등 고학년';
  return '중학생 이상';
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
