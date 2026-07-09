
import { GrowthDomain } from '@/features/classification/lib/classification.service';

export enum RoadmapStage {
  STEP_1_SEED = 'seed',      // 0~2세 (감각/놀이) - 씨앗 단계
  STEP_2_SPROUT = 'sprout',  // 3~4세 (생활/기초) - 새싹 단계
  STEP_3_LEAF = 'leaf',      // 5~6세 (이야기/사회성) - 잎새 단계
  STEP_4_TREE = 'tree'       // 7~8세 (지식/초등) - 나무 단계
}

export interface RoadmapItem {
  id: string;
  title: string;
  publisher: string;
  domain: GrowthDomain;
  targetMonths: [number, number]; // [min, max] - Reference for sorting
  priority: 'core' | 'extended';
  stage: RoadmapStage;
  keywords?: string[]; // For fuzzy matching
  description?: string;
}

export const STANDARD_ROADMAP_DATA: RoadmapItem[] = [
  // === STEP 1: 씨앗 (0~2세) ===
  {
    id: 'dol-han',
    title: '돌잡이 한글',
    publisher: '천재교육',
    domain: 'language',
    targetMonths: [12, 30],
    priority: 'core',
    stage: RoadmapStage.STEP_1_SEED,
    keywords: ['돌잡이한글', '돌잡이']
  },
  {
    id: 'dol-su',
    title: '돌잡이 수학',
    publisher: '천재교육',
    domain: 'math_sci',
    targetMonths: [12, 30],
    priority: 'core',
    stage: RoadmapStage.STEP_1_SEED,
    keywords: ['돌잡이수학']
  },
  {
    id: 'dol-eng',
    title: '돌잡이 영어',
    publisher: '천재교육',
    domain: 'english',
    targetMonths: [12, 36],
    priority: 'core',
    stage: RoadmapStage.STEP_1_SEED,
    keywords: ['돌잡이영어']
  },
  {
    id: 'dol-art',
    title: '돌잡이 명화',
    publisher: '천재교육',
    domain: 'art_music',
    targetMonths: [12, 36],
    priority: 'core',
    stage: RoadmapStage.STEP_1_SEED,
    keywords: ['돌잡이명화']
  },
  {
    id: 'bebe',
    title: '베베코알라',
    publisher: '그레이트북스',
    domain: 'social',
    targetMonths: [12, 48],
    priority: 'core',
    stage: RoadmapStage.STEP_1_SEED,
    keywords: ['베베코알라', '베베']
  },

  // === STEP 2: 새싹 (3~4세) ===
  {
    id: 'chupi',
    title: '추피의 생활이야기',
    publisher: '무지개',
    domain: 'social',
    targetMonths: [24, 48],
    priority: 'core',
    stage: RoadmapStage.STEP_2_SPROUT,
    keywords: ['추피', '추피의', '생활이야기']
  },
  {
    id: 'doremi',
    title: '도레미곰',
    publisher: '그레이트북스',
    domain: 'art_music',
    targetMonths: [24, 60],
    priority: 'core',
    stage: RoadmapStage.STEP_2_SPROUT,
    keywords: ['도레미곰']
  },
  {
    id: 'nature',
    title: '놀라운 자연(자연이랑)',
    publisher: '그레이트북스',
    domain: 'math_sci',
    targetMonths: [24, 72],
    priority: 'core',
    stage: RoadmapStage.STEP_2_SPROUT,
    keywords: ['놀라운자연', '자연이랑']
  },
  {
    id: 'bread',
    title: '창작 브런치',
    publisher: '웅진북클럽',
    domain: 'language',
    targetMonths: [24, 48],
    priority: 'extended',
    stage: RoadmapStage.STEP_2_SPROUT,
    keywords: ['창작브런치']
  },
  {
    id: 'banana-rocket',
    title: '바나나로켓',
    publisher: '웅진북클럽',
    domain: 'math_sci',
    targetMonths: [30, 60],
    priority: 'extended',
    stage: RoadmapStage.STEP_2_SPROUT,
    keywords: ['바나나로켓']
  },
  {
    id: 'maisy',
    title: '내 친구 메이지',
    publisher: '다양',
    domain: 'english',
    targetMonths: [24, 48],
    priority: 'extended',
    stage: RoadmapStage.STEP_2_SPROUT,
    keywords: ['메이지', 'Maisy']
  },

  // === STEP 3: 잎새 (5~6세) ===
  {
    id: 'heart',
    title: '안녕 마음아',
    publisher: '그레이트북스',
    domain: 'social',
    targetMonths: [36, 72],
    priority: 'core',
    stage: RoadmapStage.STEP_3_LEAF,
    keywords: ['안녕마음아', '마음아']
  },
  {
    id: 'sci-dino',
    title: '내 친구 과학공룡',
    publisher: '그레이트북스',
    domain: 'math_sci',
    targetMonths: [36, 72],
    priority: 'core',
    stage: RoadmapStage.STEP_3_LEAF,
    keywords: ['과학공룡']
  },
  {
    id: 'math-dino',
    title: '내 친구 수학공룡',
    publisher: '그레이트북스',
    domain: 'math_sci',
    targetMonths: [36, 72],
    priority: 'core',
    stage: RoadmapStage.STEP_3_LEAF,
    keywords: ['수학공룡']
  },
  {
    id: 'first-discovery',
    title: '첫발견 (플레이송스)',
    publisher: '웅진/랜덤',
    domain: 'cognitive',
    targetMonths: [36, 84],
    priority: 'core',
    stage: RoadmapStage.STEP_3_LEAF,
    keywords: ['첫발견']
  },
  {
    id: 'soc-dino',
    title: '내 친구 사회공룡',
    publisher: '그레이트북스',
    domain: 'social',
    targetMonths: [48, 84],
    priority: 'core',
    stage: RoadmapStage.STEP_3_LEAF,
    keywords: ['사회공룡']
  },

  // === STEP 4: 나무 (7~8세) ===
  {
    id: 'visual-museum',
    title: '비주얼 박물관',
    publisher: '웅진',
    domain: 'cognitive',
    targetMonths: [48, 120],
    priority: 'extended',
    stage: RoadmapStage.STEP_4_TREE,
    keywords: ['비주얼박물관']
  },
  {
    id: 'why',
    title: 'Why? 시리즈',
    publisher: '예림당',
    domain: 'math_sci',
    targetMonths: [84, 144],
    priority: 'core',
    stage: RoadmapStage.STEP_4_TREE,
    keywords: ['Why', '와이']
  },
  {
    id: 'who',
    title: 'Who? 인물 사이언스',
    publisher: '다산어린이',
    domain: 'social',
    targetMonths: [84, 144],
    priority: 'core',
    stage: RoadmapStage.STEP_4_TREE,
    keywords: ['Who', '후']
  },
  {
    id: 'magic-charm',
    title: '마법천자문',
    publisher: '아울북',
    domain: 'language',
    targetMonths: [84, 120],
    priority: 'extended',
    stage: RoadmapStage.STEP_4_TREE,
    keywords: ['마법천자문']
  }
];

export const DOMAIN_LABELS: Record<GrowthDomain, { label: string, color: string, iconBg: string, emoji: string }> = {
  language: { label: '의사소통/국어', color: 'bg-white text-rose-600 border-rose-100', iconBg: 'bg-rose-50', emoji: '🗣️' },
  social: { label: '인성/역사/사회', color: 'bg-white text-yellow-700 border-yellow-200', iconBg: 'bg-yellow-50', emoji: '🤝' },
  math_sci: { label: '자연/과학/수리', color: 'bg-white text-green-700 border-green-100', iconBg: 'bg-green-50', emoji: '🔬' },
  cognitive: { label: '종합/인지/지식', color: 'bg-white text-blue-700 border-blue-100', iconBg: 'bg-blue-50', emoji: '🧠' },
  art_music: { label: '예술/체육', color: 'bg-white text-purple-700 border-purple-100', iconBg: 'bg-purple-50', emoji: '🎨' },
  english: { label: '학습/영어', color: 'bg-white text-gray-700 border-gray-200', iconBg: 'bg-gray-50', emoji: '🔤' },
  unclassified: { label: '기타/미분류', color: 'bg-white text-slate-500 border-slate-100', iconBg: 'bg-slate-50', emoji: '❓' },
};

export const STAGE_CONFIG: Record<RoadmapStage, { label: string, sub: string, color: string }> = {
  [RoadmapStage.STEP_1_SEED]: { label: 'Step 1 씨앗', sub: '0~2세 (감각/놀이)', color: 'bg-green-100 text-green-700' },
  [RoadmapStage.STEP_2_SPROUT]: { label: 'Step 2 새싹', sub: '3~4세 (생활/기초)', color: 'bg-lime-100 text-lime-700' },
  [RoadmapStage.STEP_3_LEAF]: { label: 'Step 3 잎새', sub: '5~6세 (이야기)', color: 'bg-emerald-100 text-emerald-700' },
  [RoadmapStage.STEP_4_TREE]: { label: 'Step 4 나무', sub: '7~8세 (지식/초등)', color: 'bg-teal-100 text-teal-700' },
};
