
/**
 * Woorilib Standard Taxonomy for Kids Books (0-8 Years)
 * Defines the criteria for grouping/clustering books robustly.
 */

export type BookCategory = 
  | 'EMOTION'   // 인성/생활습관 (Social & Emotional)
  | 'NATURE'    // 자연관찰 (Nature & Science)
  | 'COGNITIVE' // 인지/발달 (Cognitive & Development)
  | 'MATH_SCI'  // 수과학 (Math, Science, Logic)
  | 'CREATIVE'  // 창작/상상 (Creative Fiction)
  | 'LANGUAGE'  // 언어/한글/영어 (Language)
  | 'ART_MUSIC' // 예체능 (Art & Music)
  | 'TOY'       // 놀이/조작/사운드 (Toy & Interactive)
  | 'VEHICLE'   // 자동차/탈것 (Vehicles)
  | 'ENGLISH'   // 영어/외국어 (English)
  | 'HISTORY'   // 인물/역사 (History & Culture)
  | 'UNKNOWN';

export interface CategoryRule {
  id: BookCategory;
  label: string;
  keywords: string[]; // Deterministic triggers
}

export const TAXONOMY_RULES: CategoryRule[] = [
  {
    id: 'EMOTION',
    label: '인성/생활습관',
    keywords: ['인성', '마음', '생활', '습관', '배변', '양치', '친구', '예절', '감정', 'friend', 'emotion', 'habit', '안녕 마음아', '추피', '베베 코알라']
  },
  {
    id: 'NATURE',
    label: '자연/동식물',
    keywords: ['자연', '동물', '식물', '곤충', '공룡', '바다', 'nature', 'animal', 'dino', '자연이랑', '놀라운 자연']
  },
  {
    id: 'MATH_SCI',
    label: '수학/과학',
    keywords: ['수학', '과학', '원리', '실험', '탐구', 'math', 'science', '과학공룡', '수학공룡', '과학특공대']
  },
  {
    id: 'COGNITIVE',
    label: '인지/두뇌발달',
    keywords: ['초점', '색깔', '모양', '숫자', '낱말', '인지', 'brain', 'color', 'shape', '베이비올', '오감']
  },
  {
    id: 'CREATIVE',
    label: '창작동화',
    keywords: ['창작', '상상', '모험', '이야기', 'fantasy', 'story', '도레미 곰', '버니의 세계책방', '사파리']
  },
  {
    id: 'TOY',
    label: '놀이/조작/사운드',
    keywords: ['조작', '사운드', '팝업', '태엽', '플랩', 'toy', 'sound', 'popup', 'flap', '어스본', '블루래빗', '오감']
  },
  {
    id: 'VEHICLE',
    label: '자동차/탈것',
    keywords: ['자동차', '기차', '탈것', '중장비', '비행기', 'vehicle', 'car', 'train', '타요', '폴리']
  },
  {
    id: 'ENGLISH',
    label: '영어/외국어',
    keywords: ['영어', 'english', 'phonics', '파닉스', '흘려듣기', '원서', 'dwe', 'egg', '노부영', '페파피그']
  },
  {
    id: 'HISTORY',
    label: '인물/역사/전통',
    keywords: ['위인', '역사', '전통', '옛이야기', '전래', 'history', '꽃할망']
  },
  {
    id: 'ART_MUSIC',
    label: '예술/음악',
    keywords: ['음악', '미술', '노래', '악기', 'art', 'music', 'classic', '노래하는 솜사탕']
  }
];
