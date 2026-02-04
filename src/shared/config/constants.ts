/**
 * Shared Configuration Constants
 */

export const APP_CONFIG = {
  name: '우리아이도서관',
  description: '우리 아이 책, 현명하게 골라 합리적으로 구해요.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

export const API_CONFIG = {
  libraryApiBase: 'https://data4library.kr/api',
  aladinApiBase: 'https://www.aladin.co.kr/ttb/api',
};

// Age groups for the app
export const AGE_GROUPS = [
  { id: '0-2', label: '0-2세', minAge: 0, maxAge: 2, description: '영아기', apiCode: '0', emoji: '👶' },
  { id: '3-4', label: '3-4세', minAge: 3, maxAge: 4, description: '유아기', apiCode: '6', emoji: '🧒' },
  { id: '5-6', label: '5-6세', minAge: 5, maxAge: 6, description: '취학 전', apiCode: '8', emoji: '👦' },
  { id: '7-8', label: '7-8세', minAge: 7, maxAge: 8, description: '초등 저학년', apiCode: '14', emoji: '📚' },
] as const;

export type AgeGroupId = typeof AGE_GROUPS[number]['id'];

// Region codes (주요 지역만)
export const REGIONS = [
  { code: '11', name: '서울특별시' },
  { code: '26', name: '부산광역시' },
  { code: '27', name: '대구광역시' },
  { code: '28', name: '인천광역시' },
  { code: '29', name: '광주광역시' },
  { code: '30', name: '대전광역시' },
  { code: '31', name: '울산광역시' },
  { code: '36', name: '세종특별자치시' },
  { code: '41', name: '경기도' },
  { code: '51', name: '강원특별자치도' },
  { code: '43', name: '충청북도' },
  { code: '44', name: '충청남도' },
  { code: '52', name: '전북특별자치도' },
  { code: '46', name: '전라남도' },
  { code: '47', name: '경상북도' },
  { code: '48', name: '경상남도' },
  { code: '50', name: '제주특별자치도' },
] as const;

// Design tokens
export const COLORS = {
  primary: '#2E7D32',      // Warm green
  secondary: '#FFD54F',    // Soft yellow
  accent: '#FF7043',       // Coral
  background: '#FFFEF5',   // Cream white
  text: '#3E2723',         // Dark brown
};

// Curation Taxonomy
export const DEVELOPMENTAL_AREAS = [
  '신체운동·건강', // 대근육, 소근육, 신체인식, 건강생활
  '의사소통',      // 언어이해, 언어표현, 읽기/쓰기 흥미
  '사회관계',      // 자아존중, 더불어 생활하기, 정서조절
  '예술경험',      // 아름다움 찾기, 예술적 표현, 감상
  '자연탐구',      // 탐구과정, 수학적 탐구(수/도형), 과학적 탐구
  '생활습관',      // 배변, 수면, 식습관, 정리정돈
  '인지발달',      // 기억력, 문제해결, 사고력 (보조)
] as const;

export type DevelopmentalArea = typeof DEVELOPMENTAL_AREAS[number];

// Aladin Category Mapping (For Fetcher)
export const ALADIN_CATEGORIES = {
  INFANT: 13789,    // 영유아(0~3세)
  TODDLER: 1108,    // 유아(4~7세)
  ELEMENTARY: 1120, // 어린이(초등)
  PARENTING: 1,     // 가정/요리/뷰티 (육아 포함) - Not used for child books
} as const;

// Sound Pen Compatibility
export const PEN_TYPES = [
  '세이펜',       // 시장 점유율 1위 (아람, 그레이트북스 등 다수)
  '토끼펜',       // 블루래빗 전용
  '바나나펜',     // 명꼬(한국차일드아카데미) 등
  '씽킹펜',       // 프뢰벨 전용
  '피쉬톡',       // 어스본 등 일부 출판사 호환
  '팝펜',         // 네오랩 (일부 영어 원서)
  'QR코드',       // 펜은 아니지만 음원 재생 수단
  'CD/MP3',       // 고전적인 방식
] as const;

export type PenType = typeof PEN_TYPES[number];
